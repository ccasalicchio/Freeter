/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

/**
 * Localhost MCP server: lets AI clients (Claude Code/Desktop and other MCP
 * clients) read and update the Freeter dashboard. Streamable HTTP (stateless
 * JSON) on 127.0.0.1 only, protected by a bearer token. Off by default;
 * configured in Application Settings → AI / MCP.
 */

import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { DataStorage } from '@common/application/interfaces/dataStorage';
import { ObjectManager } from '@common/base/objectManager';
import { logToFile } from '@/infra/logger/fileLog';
import {
  parseAppState, listProjects, listWorkflows, listWidgets, getWidget, createWidgetInState,
  switchProjectInState, switchWorkflowInState, reorderWorkflowsInState, setWorkflowArchivedInState,
  updateWidgetInState, moveWidgetInState, resizeWidgetInState, searchNames, listContentWidgets
} from '@/infra/mcpServer/mcpState';

export interface McpServerConfig {
  enabled: boolean;
  port: number;
  token: string;
  /** bind all interfaces (WSL / LAN access); default binds 127.0.0.1 only */
  allowExternal?: boolean;
}

type Deps = {
  appDataStorage: DataStorage;
  widgetDataStorageManager: ObjectManager<DataStorage>;
  /** reloads the renderer so external state edits become visible */
  reloadRenderer: () => void;
}

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

export function createFreeterMcpServer({ appDataStorage, widgetDataStorageManager, reloadRenderer }: Deps) {
  let httpServer: http.Server | null = null;

  async function readState() {
    return parseAppState(await appDataStorage.getText('app'));
  }

  // undo history for MCP mutations; lives for the app's lifetime (max 20 entries)
  interface UndoEntry {
    label: string;
    at: string;
    appStateJson?: string;
    widgetData?: { widgetId: string; key: string; prevText: string | undefined };
  }
  const undoStack: UndoEntry[] = [];
  function pushUndo(entry: UndoEntry): void {
    undoStack.push(entry);
    if (undoStack.length > 20) {
      undoStack.shift();
    }
  }

  async function writeState(stateObj: object, undoLabel?: string) {
    if (undoLabel) {
      const prev = await appDataStorage.getText('app');
      if (prev !== undefined) {
        pushUndo({ label: undoLabel, at: new Date().toISOString(), appStateJson: prev });
      }
    }
    await appDataStorage.setText('app', JSON.stringify(stateObj));
    reloadRenderer();
  }

  async function setWidgetTextWithUndo(widgetId: string, key: string, text: string, undoLabel: string) {
    const storage = await widgetDataStorageManager.getObject(widgetId);
    const prevText = await storage.getText(key);
    pushUndo({ label: undoLabel, at: new Date().toISOString(), widgetData: { widgetId, key, prevText } });
    await storage.setText(key, text);
    reloadRenderer();
  }

  function buildMcpServer(): McpServer {
    const server = new McpServer({ name: 'freeter', version: '3.0.0' });

    server.registerTool('freeter_list_projects', {
      description: 'Lists all Freeter projects (dashboards) with id, name, workflow count and which one is current.',
      inputSchema: {}
    }, async () => {
      const state = await readState();
      if (!state) {
        return errorResult('Freeter has no saved state yet.');
      }
      return textResult(listProjects(state));
    });

    server.registerTool('freeter_list_workflows', {
      description: 'Lists the workflows (tabs) of a project. Get project ids from freeter_list_projects.',
      inputSchema: { projectId: z.string().describe('Project id') }
    }, async ({ projectId }) => {
      const state = await readState();
      const res = state && listWorkflows(state, projectId);
      if (!res) {
        return errorResult(`Project "${projectId}" not found. Use freeter_list_projects to get valid ids.`);
      }
      return textResult(res);
    });

    server.registerTool('freeter_list_widgets', {
      description: 'Lists the widgets of a workflow with id, type, name and grid position. Get workflow ids from freeter_list_workflows.',
      inputSchema: { workflowId: z.string().describe('Workflow id') }
    }, async ({ workflowId }) => {
      const state = await readState();
      const res = state && listWidgets(state, workflowId);
      if (!res) {
        return errorResult(`Workflow "${workflowId}" not found. Use freeter_list_workflows to get valid ids.`);
      }
      return textResult(res);
    });

    server.registerTool('freeter_read_note', {
      description: 'Reads the text/markdown content of a note widget.',
      inputSchema: { widgetId: z.string().describe('Note widget id (type "note")') }
    }, async ({ widgetId }) => {
      const state = await readState();
      const widget = state && getWidget(state, widgetId);
      if (!widget || widget.type !== 'note') {
        return errorResult(`Widget "${widgetId}" is not a note. Use freeter_list_widgets to find note widgets.`);
      }
      const storage = await widgetDataStorageManager.getObject(widgetId);
      const text = await storage.getText('note');
      return textResult(text ?? '');
    });

    server.registerTool('freeter_write_note', {
      description: 'Writes text/markdown to a note widget: replaces or appends to the existing content.',
      inputSchema: {
        widgetId: z.string().describe('Note widget id (type "note")'),
        text: z.string().describe('Content to write'),
        mode: z.enum(['replace', 'append', 'prepend']).default('append').describe('replace overwrites; append adds to the end; prepend adds to the start')
      }
    }, async ({ widgetId, text, mode }) => {
      const state = await readState();
      const widget = state && getWidget(state, widgetId);
      if (!widget || widget.type !== 'note') {
        return errorResult(`Widget "${widgetId}" is not a note. Use freeter_list_widgets to find note widgets.`);
      }
      const storage = await widgetDataStorageManager.getObject(widgetId);
      const current = (mode !== 'replace' && await storage.getText('note')) || '';
      const updated = !current || mode === 'replace' ? text
        : mode === 'append' ? `${current}\n${text}`
        : `${text}\n${current}`;
      await setWidgetTextWithUndo(widgetId, 'note', updated, `${mode} note text`);
      return textResult(`Note updated (${updated.length} chars).`);
    });

    server.registerTool('freeter_read_todo', {
      description: 'Reads the items of a to-do list widget.',
      inputSchema: { widgetId: z.string().describe('To-do widget id (type "to-do-list")') }
    }, async ({ widgetId }) => {
      const state = await readState();
      const widget = state && getWidget(state, widgetId);
      if (!widget || widget.type !== 'to-do-list') {
        return errorResult(`Widget "${widgetId}" is not a to-do list. Use freeter_list_widgets to find to-do widgets.`);
      }
      const storage = await widgetDataStorageManager.getObject(widgetId);
      const raw = await storage.getText('todo');
      let data: unknown = { items: [], nextItemId: 1 };
      try {
        if (raw) {
          data = JSON.parse(raw);
        }
      } catch {
        // unreadable data: report the empty default
      }
      return textResult(data);
    });

    server.registerTool('freeter_add_todo_item', {
      description: 'Adds an item to a to-do list widget.',
      inputSchema: {
        widgetId: z.string().describe('To-do widget id (type "to-do-list")'),
        text: z.string().describe('Task text')
      }
    }, async ({ widgetId, text }) => {
      const state = await readState();
      const widget = state && getWidget(state, widgetId);
      if (!widget || widget.type !== 'to-do-list') {
        return errorResult(`Widget "${widgetId}" is not a to-do list. Use freeter_list_widgets to find to-do widgets.`);
      }
      const storage = await widgetDataStorageManager.getObject(widgetId);
      let data: { items?: { id: number; text: string; isDone: boolean }[]; nextItemId?: number } = {};
      try {
        const raw = await storage.getText('todo');
        if (raw) {
          data = JSON.parse(raw);
        }
      } catch {
        // start fresh on unreadable data
      }
      const items = Array.isArray(data.items) ? data.items : [];
      const nextId = typeof data.nextItemId === 'number' ? data.nextItemId : items.length + 1;
      items.push({ id: nextId, text, isDone: false, ...( { dueDate: '', priority: 'none' } ) });
      await setWidgetTextWithUndo(widgetId, 'todo', JSON.stringify({ ...data, items, nextItemId: nextId + 1 }), 'add to-do item');
      return textResult(`Added item #${nextId}: ${text}`);
    });

    server.registerTool('freeter_create_widget', {
      description: 'Creates a widget in a workflow. Common types and settings: note (content via freeter_write_note afterwards), to-do-list, link-opener {"urls": [...]}, webhook-button {"url"}, http-monitor {"url","method","intervalSecs","expectStatus"}, file-explorer {"folderPath","showHidden","sortBy","refreshSecs"}, git-status {"repoPath","refreshSecs"}, github-ci/github-prs {"repo","token","refreshSecs"}, app-launcher {"appPath","args"}, webpage {"url"}, timer, commander {"cmdLines","cwd"}.',
      inputSchema: {
        workflowId: z.string().describe('Workflow id to add the widget to'),
        type: z.enum([
          'note', 'to-do-list', 'link-opener', 'webhook-button',
          'file-explorer', 'http-monitor', 'app-launcher', 'git-status',
          'github-ci', 'github-prs', 'webpage', 'web-query', 'commander',
          'timer', 'image-media', 'api-request', 'code-snippet', 'calendar',
          'kanban-board', 'rss-feed-reader', 'system-monitor', 'clipboard-history',
          'file-opener'
        ]).describe('Widget type'),
        name: z.string().describe('Widget display name'),
        settings: z.record(z.string(), z.unknown()).optional().describe('Type-specific settings (optional)')
      }
    }, async ({ workflowId, type, name, settings }) => {
      const state = await readState();
      if (!state) {
        return errorResult('Freeter has no saved state yet.');
      }
      const res = createWidgetInState(state, workflowId, type, name, settings ?? {}, randomUUID);
      if (!res) {
        return errorResult(`Workflow "${workflowId}" not found. Use freeter_list_workflows to get valid ids.`);
      }
      await writeState(state, `create ${type} widget`);
      return textResult(`Created ${type} widget "${name}" (id ${res.widgetId}).`);
    });


    server.registerTool('freeter_search', {
      description: 'Searches the whole dashboard: project/workflow/widget names plus the contents of notes and to-do lists. Returns hits with locations and widget ids.',
      inputSchema: { query: z.string().describe('Case-insensitive text to search for') }
    }, async ({ query }) => {
      const state = await readState();
      if (!state) {
        return errorResult('Freeter has no saved state yet.');
      }
      const nameHits = searchNames(state, query);
      const contentHits: object[] = [];
      const q = query.toLowerCase();
      for (const w of listContentWidgets(state)) {
        try {
          const storage = await widgetDataStorageManager.getObject(w.id);
          const raw = await storage.getText(w.type === 'note' ? 'note' : 'todo');
          if (raw && raw.toLowerCase().includes(q)) {
            contentHits.push({ kind: `${w.type}-content`, widgetId: w.id, name: w.name, projectName: w.projectName, workflowName: w.workflowName });
          }
        } catch {
          // unreadable widget data: skip
        }
      }
      return textResult({ nameMatches: nameHits, contentMatches: contentHits });
    });

    server.registerTool('freeter_switch_project', {
      description: 'Switches the visible project (dashboard). Get ids from freeter_list_projects.',
      inputSchema: { projectId: z.string().describe('Project id') }
    }, async ({ projectId }) => {
      const state = await readState();
      if (!state || !switchProjectInState(state, projectId)) {
        return errorResult(`Project "${projectId}" not found. Use freeter_list_projects to get valid ids.`);
      }
      await writeState(state, 'switch project');
      return textResult('Switched project.');
    });

    server.registerTool('freeter_switch_workflow', {
      description: 'Switches to a workflow (tab), also switching to its project. Get ids from freeter_list_workflows.',
      inputSchema: { workflowId: z.string().describe('Workflow id') }
    }, async ({ workflowId }) => {
      const state = await readState();
      if (!state || !switchWorkflowInState(state, workflowId)) {
        return errorResult(`Workflow "${workflowId}" not found. Use freeter_list_workflows to get valid ids.`);
      }
      await writeState(state, 'switch workflow');
      return textResult('Switched workflow.');
    });

    server.registerTool('freeter_reorder_workflows', {
      description: 'Reorders the workflow tabs of a project. Pass the complete list of the project\'s workflow ids in the desired order (a permutation of the current ids from freeter_list_workflows).',
      inputSchema: {
        projectId: z.string().describe('Project id'),
        workflowIds: z.array(z.string()).describe('All workflow ids of the project, in the new tab order')
      }
    }, async ({ projectId, workflowIds }) => {
      const state = await readState();
      if (!state) {
        return errorResult('App state not available.');
      }
      const err = reorderWorkflowsInState(state, projectId, workflowIds);
      if (err) {
        return errorResult(`Reorder failed: ${err}. Use freeter_list_workflows to get the current ids.`);
      }
      await writeState(state, 'reorder workflows');
      return textResult('Workflows reordered.');
    });

    server.registerTool('freeter_set_workflow_archived', {
      description: 'Archives or unarchives a workflow (tab). Archived tabs are hidden from the tab bar but keep all their widgets and can be unarchived later.',
      inputSchema: {
        workflowId: z.string().describe('Workflow id'),
        archived: z.boolean().describe('true to archive, false to unarchive')
      }
    }, async ({ workflowId, archived }) => {
      const state = await readState();
      if (!state || !setWorkflowArchivedInState(state, workflowId, archived)) {
        return errorResult(`Workflow "${workflowId}" not found. Use freeter_list_workflows to get valid ids.`);
      }
      await writeState(state, archived ? 'archive workflow' : 'unarchive workflow');
      return textResult(archived ? 'Workflow archived.' : 'Workflow unarchived.');
    });

    server.registerTool('freeter_undo', {
      description: 'Undoes the most recent MCP change (up to 20 back). Restores the exact state saved before that change, so any MANUAL edits made in the app since then to the same data are lost. Undoing an undo redoes it.',
      inputSchema: {}
    }, async () => {
      const entry = undoStack.pop();
      if (!entry) {
        return errorResult('Nothing to undo.');
      }
      const at = new Date().toISOString();
      if (entry.appStateJson !== undefined) {
        const current = await appDataStorage.getText('app');
        if (current !== undefined) {
          pushUndo({ label: `undo of: ${entry.label}`, at, appStateJson: current });
        }
        await appDataStorage.setText('app', entry.appStateJson);
        reloadRenderer();
      } else if (entry.widgetData) {
        const { widgetId, key, prevText } = entry.widgetData;
        const storage = await widgetDataStorageManager.getObject(widgetId);
        const current = await storage.getText(key);
        pushUndo({ label: `undo of: ${entry.label}`, at, widgetData: { widgetId, key, prevText: current } });
        await storage.setText(key, prevText ?? '');
        reloadRenderer();
      }
      return textResult(`Undone: ${entry.label}`);
    });

    server.registerTool('freeter_list_undo', {
      description: 'Lists the undo history of MCP changes, newest first (what freeter_undo would revert).',
      inputSchema: {}
    }, async () => textResult(
      [...undoStack].reverse().map((e, i) => ({ depth: i + 1, label: e.label, at: e.at }))
    ));

    server.registerTool('freeter_get_widget', {
      description: 'Reads a widget\'s full details: type, name and settings JSON (e.g. a link-opener\'s urls, a commander\'s cmdLines, an http-monitor\'s url). Use before freeter_update_widget.',
      inputSchema: { widgetId: z.string().describe('Widget id (from freeter_list_widgets or freeter_search)') }
    }, async ({ widgetId }) => {
      const state = await readState();
      const widget = state && getWidget(state, widgetId);
      if (!widget) {
        return errorResult(`Widget "${widgetId}" not found. Use freeter_list_widgets to get valid ids.`);
      }
      if (widget.type === 'password-vault') {
        return errorResult('Password vault widgets are not readable over MCP.');
      }
      // secret-looking settings are masked; update_widget can still write them
      const settings = Object.fromEntries(Object.entries(widget.settings as Record<string, unknown>).map(([k, v]) =>
        /token|password|secret|apikey|api_key/i.test(k) && typeof v === 'string' && v !== '' ? [k, '***'] : [k, v]
      ));
      return textResult({ id: widget.id, type: widget.type, name: widget.coreSettings.name ?? '', settings });
    });

    server.registerTool('freeter_update_widget', {
      description: 'Renames a widget and/or edits its settings (merge: only the keys you pass change; pass null to delete a key). Works for every widget type — e.g. edit a link-opener\'s {"urls": [...]}, a commander\'s {"cmdLines": [...]}, an app-launcher\'s {"appPath"}. Read current settings with freeter_get_widget first.',
      inputSchema: {
        widgetId: z.string().describe('Widget id'),
        name: z.string().optional().describe('New display name (optional)'),
        settings: z.record(z.string(), z.unknown()).optional().describe('Settings keys to merge (null value deletes a key)')
      }
    }, async ({ widgetId, name, settings }) => {
      const state = await readState();
      if (state && getWidget(state, widgetId)?.type === 'password-vault') {
        return errorResult('Password vault widgets are not editable over MCP.');
      }
      if (!state || !updateWidgetInState(state, widgetId, { name, settings })) {
        return errorResult(`Widget "${widgetId}" not found. Use freeter_list_widgets to get valid ids.`);
      }
      await writeState(state, 'update widget');
      return textResult('Widget updated.');
    });

    server.registerTool('freeter_move_widget', {
      description: 'Moves a widget to another workflow (tab), placing it below that tab\'s existing layout. Use with freeter_read_note/freeter_write_note when you only want to move TEXT between note widgets instead of the widget itself.',
      inputSchema: {
        widgetId: z.string().describe('Widget id to move'),
        targetWorkflowId: z.string().describe('Destination workflow id')
      }
    }, async ({ widgetId, targetWorkflowId }) => {
      const state = await readState();
      if (!state) {
        return errorResult('App state not available.');
      }
      const err = moveWidgetInState(state, widgetId, targetWorkflowId, randomUUID);
      if (err) {
        return errorResult(`Move failed: ${err}.`);
      }
      await writeState(state, 'move widget');
      return textResult('Widget moved.');
    });

    server.registerTool('freeter_resize_widget', {
      description: 'Sets a widget\'s grid position and size (rect: x, y, w, h in grid cells). Current rects come from freeter_list_widgets. Use to tidy layouts.',
      inputSchema: {
        widgetId: z.string().describe('Widget id'),
        rect: z.object({
          x: z.number().int().min(0),
          y: z.number().int().min(0),
          w: z.number().int().min(1),
          h: z.number().int().min(1)
        }).describe('New grid rect')
      }
    }, async ({ widgetId, rect }) => {
      const state = await readState();
      if (!state) {
        return errorResult('App state not available.');
      }
      const err = resizeWidgetInState(state, widgetId, rect);
      if (err) {
        return errorResult(`Resize failed: ${err}.`);
      }
      await writeState(state, 'resize widget');
      return textResult('Widget resized.');
    });

    server.registerTool('freeter_update_todo_item', {
      description: 'Edits or completes an item in a to-do list widget. Get item ids from freeter_read_todo.',
      inputSchema: {
        widgetId: z.string().describe('To-do widget id'),
        itemId: z.number().describe('Item id from freeter_read_todo'),
        text: z.string().optional().describe('New text (optional)'),
        isDone: z.boolean().optional().describe('Done state (optional)')
      }
    }, async ({ widgetId, itemId, text, isDone }) => {
      const state = await readState();
      const widget = state && getWidget(state, widgetId);
      if (!widget || widget.type !== 'to-do-list') {
        return errorResult(`Widget "${widgetId}" is not a to-do list.`);
      }
      const storage = await widgetDataStorageManager.getObject(widgetId);
      const data = JSON.parse((await storage.getText('todo')) || '{"items":[],"nextItemId":1}');
      const item = (data.items as Array<{ id: number; text: string; isDone: boolean }>).find(i => i.id === itemId);
      if (!item) {
        return errorResult(`Item ${itemId} not found. Use freeter_read_todo to list items.`);
      }
      if (text !== undefined) {
        item.text = text;
      }
      if (isDone !== undefined) {
        item.isDone = isDone;
      }
      await setWidgetTextWithUndo(widgetId, 'todo', JSON.stringify(data), 'update to-do item');
      return textResult(`Item #${itemId} updated.`);
    });

    server.registerTool('freeter_delete_todo_item', {
      description: 'Deletes an item from a to-do list widget. Get item ids from freeter_read_todo.',
      inputSchema: {
        widgetId: z.string().describe('To-do widget id'),
        itemId: z.number().describe('Item id to delete')
      }
    }, async ({ widgetId, itemId }) => {
      const state = await readState();
      const widget = state && getWidget(state, widgetId);
      if (!widget || widget.type !== 'to-do-list') {
        return errorResult(`Widget "${widgetId}" is not a to-do list.`);
      }
      const storage = await widgetDataStorageManager.getObject(widgetId);
      const data = JSON.parse((await storage.getText('todo')) || '{"items":[],"nextItemId":1}');
      const before = (data.items as Array<{ id: number }>).length;
      data.items = (data.items as Array<{ id: number }>).filter(i => i.id !== itemId);
      if (data.items.length === before) {
        return errorResult(`Item ${itemId} not found.`);
      }
      await setWidgetTextWithUndo(widgetId, 'todo', JSON.stringify(data), 'delete to-do item');
      return textResult(`Item #${itemId} deleted.`);
    });

    server.registerTool('freeter_reorder_todo_items', {
      description: 'Reorders the items of a to-do list widget. Pass ALL item ids in the desired order (a permutation of the ids from freeter_read_todo).',
      inputSchema: {
        widgetId: z.string().describe('To-do widget id'),
        itemIds: z.array(z.number()).describe('All item ids in the new order')
      }
    }, async ({ widgetId, itemIds }) => {
      const state = await readState();
      const widget = state && getWidget(state, widgetId);
      if (!widget || widget.type !== 'to-do-list') {
        return errorResult(`Widget "${widgetId}" is not a to-do list.`);
      }
      const storage = await widgetDataStorageManager.getObject(widgetId);
      const data = JSON.parse((await storage.getText('todo')) || '{"items":[],"nextItemId":1}');
      const items = data.items as Array<{ id: number }>;
      const byId = new Map(items.map(i => [i.id, i]));
      if (itemIds.length !== items.length || new Set(itemIds).size !== itemIds.length || itemIds.some(id => !byId.has(id))) {
        return errorResult(`itemIds must be a permutation of the current ${items.length} item ids from freeter_read_todo.`);
      }
      data.items = itemIds.map(id => byId.get(id));
      await setWidgetTextWithUndo(widgetId, 'todo', JSON.stringify(data), 'reorder to-do items');
      return textResult('Items reordered.');
    });

    return server;
  }

  return {
    start(config: McpServerConfig): void {
      this.stop();
      if (!config.enabled || !config.token) {
        return;
      }
      httpServer = http.createServer(async (req, res) => {
        try {
          if (req.url !== '/mcp') {
            res.writeHead(404).end();
            return;
          }
          const auth = req.headers.authorization ?? '';
          if (auth !== `Bearer ${config.token}`) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
              .end(JSON.stringify({ error: 'Unauthorized: send Authorization: Bearer <token> (see Freeter Settings > AI / MCP)' }));
            return;
          }
          // stateless: fresh server+transport per request
          const server = buildMcpServer();
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined
          });
          res.on('close', () => {
            transport.close();
            server.close();
          });
          await server.connect(transport);
          await transport.handleRequest(req, res);
        } catch (err) {
          logToFile('error', `mcp request failed: ${err instanceof Error ? err.message : String(err)}`);
          if (!res.headersSent) {
            res.writeHead(500).end();
          }
        }
      });
      const bindHost = config.allowExternal ? '0.0.0.0' : '127.0.0.1';
      httpServer.listen(config.port, bindHost, () => {
        logToFile('info', `mcp server listening on ${bindHost}:${config.port}`);
      });
      httpServer.on('error', err => {
        logToFile('error', `mcp server error: ${err.message}`);
      });
    },
    stop(): void {
      if (httpServer) {
        httpServer.close();
        httpServer = null;
        logToFile('info', 'mcp server stopped');
      }
    }
  }
}
