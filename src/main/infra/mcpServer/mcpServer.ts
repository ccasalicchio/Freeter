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
  parseAppState, listProjects, listWorkflows, listWidgets, getWidget, createWidgetInState
} from '@/infra/mcpServer/mcpState';

export interface McpServerConfig {
  enabled: boolean;
  port: number;
  token: string;
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

  async function writeState(stateObj: object) {
    await appDataStorage.setText('app', JSON.stringify(stateObj));
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
        mode: z.enum(['replace', 'append']).default('append').describe('replace overwrites; append adds to the end')
      }
    }, async ({ widgetId, text, mode }) => {
      const state = await readState();
      const widget = state && getWidget(state, widgetId);
      if (!widget || widget.type !== 'note') {
        return errorResult(`Widget "${widgetId}" is not a note. Use freeter_list_widgets to find note widgets.`);
      }
      const storage = await widgetDataStorageManager.getObject(widgetId);
      const current = (mode === 'append' && await storage.getText('note')) || '';
      const updated = mode === 'append' && current ? `${current}\n${text}` : text;
      await storage.setText('note', updated);
      reloadRenderer();
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
      await storage.setText('todo', JSON.stringify({ ...data, items, nextItemId: nextId + 1 }));
      reloadRenderer();
      return textResult(`Added item #${nextId}: ${text}`);
    });

    server.registerTool('freeter_create_widget', {
      description: 'Creates a widget in a workflow. Supported types: note (content via freeter_write_note afterwards), to-do-list, link-opener (settings: {"urls": ["https://…"]}), webhook-button (settings: {"url": "https://…"}).',
      inputSchema: {
        workflowId: z.string().describe('Workflow id to add the widget to'),
        type: z.enum(['note', 'to-do-list', 'link-opener', 'webhook-button']).describe('Widget type'),
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
      await writeState(state);
      return textResult(`Created ${type} widget "${name}" (id ${res.widgetId}).`);
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
      httpServer.listen(config.port, '127.0.0.1', () => {
        logToFile('info', `mcp server listening on 127.0.0.1:${config.port}`);
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
