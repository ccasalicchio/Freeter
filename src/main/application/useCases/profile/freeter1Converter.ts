/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

/**
 * Converts a Freeter 1.x data file (.freeterdata, JSON) into Freeter 3
 * persistent app state + widget data, merging into any existing state.
 *
 * Freeter 1 model: projects[] -> layout.tabs[] -> grid widgets
 * Freeter 3 model: entities {projects, workflows, widgets} + per-widget data
 *
 * Widget type mapping:
 *   text          -> note          (content into widget data key 'note')
 *   link-opener   -> link-opener   (urls)
 *   to-do-list    -> to-do-list    (items into widget data key 'todo')
 *   file-opener   -> file-opener
 *   commander     -> commander     (inline command lines)
 *   image         -> image-media
 *   file-explorer -> file-opener   (folder mode; v3 has no file explorer)
 */

interface Freeter1Widget {
  id: number;
  type: string;
  title?: string;
  name?: string;
  col: number;
  row: number;
  sizeX: number;
  sizeY: number;
  text?: string;
  urls?: string[];
  items?: { id: number; text: string; done: boolean }[];
  doneToBottom?: boolean;
  itemType?: string;
  commands?: string[];
  url?: string;
  source?: string;
  [key: string]: unknown;
}

interface Freeter1Tab {
  id: number;
  name: string;
  widgets: Freeter1Widget[];
}

interface Freeter1Project {
  id: number;
  settings: {
    name?: string;
    icon?: string;
    iconColor?: string;
    iconLink?: string;
    iconType?: string;
    [key: string]: unknown
  };
  layout: { selectedTabId?: number; tabs: Freeter1Tab[] };
}

// Freeter 1 search engine names -> v3 web-query engine ids
const v1EngineIds: Record<string, string> = {
  google: 'goog', bing: 'bing', duckduckgo: 'ddgo', wikipedia: 'wkpd',
  wolframalpha: 'wfal', youtube: 'yt', github: 'gh', stackoverflow: 'so'
};

// Freeter 1 color names -> icon palette hex values
const v1IconColors: Record<string, string> = {
  red: '#E5484D', orange: '#F76B15', yellow: '#FFC53D', green: '#46A758',
  cyan: '#00A2C7', blue: '#0090FF', purple: '#8E4EC6', pink: '#D6409F'
};

interface Freeter1AppPools {
  links?: { name?: string; urls?: string[] }[];
  commands?: { name?: string; cmdLines?: string[] }[];
  searches?: { name?: string; engine?: string; qryTemplate?: string; urlTemplate?: string }[];
  timers?: { name?: string; mins?: number; endSound?: string; endSoundVolume?: number; endDesktop?: boolean }[];
  tools?: { name?: string }[];
  [key: string]: unknown;
}

export interface Freeter1Data {
  freeterVer?: string;
  projects: Freeter1Project[];
  app?: Freeter1AppPools;
  [key: string]: unknown;
}

export interface WidgetDataEntry {
  id: string;
  data: Record<string, string>;
}

export interface Freeter1ConversionResult {
  /** JSON for the appDataStorage 'app' key ({ver, obj} versioned object) */
  appJson: string;
  /** per-widget data storage entries to write */
  widgetsData: WidgetDataEntry[];
  /** counts for reporting */
  stats: { projects: number; workflows: number; widgets: number };
}

export function isFreeter1Data(parsed: unknown): parsed is Freeter1Data {
  if (typeof parsed !== 'object' || parsed === null) {
    return false;
  }
  const obj = parsed as Record<string, unknown>;
  const verIs1 = typeof obj.freeterVer === 'string' && obj.freeterVer.startsWith('1');
  const hasProjects = Array.isArray(obj.projects)
    && obj.projects.every(p => typeof p === 'object' && p !== null && typeof (p as Freeter1Project).layout === 'object');
  return verIs1 && hasProjects;
}

function widgetName(w: Freeter1Widget): string {
  return (typeof w.name === 'string' && w.name) || (typeof w.title === 'string' && w.title) || w.type;
}

function convertWidget(w: Freeter1Widget, id: string): { widget: object; data: Record<string, string> | null } | null {
  const core = { id, coreSettings: { name: widgetName(w) } };
  switch (w.type) {
    case 'text':
      return {
        widget: { ...core, type: 'note', settings: {} },
        data: { note: typeof w.text === 'string' ? w.text : '' }
      };
    case 'link-opener': {
      const iconLink = typeof w.itemIconLink === 'string' ? w.itemIconLink : '';
      return {
        widget: {
          ...core,
          type: 'link-opener',
          settings: {
            urls: Array.isArray(w.urls) ? w.urls.filter(u => typeof u === 'string') : [],
            // Freeter 1 custom icon URLs carry over; standard icons use the default
            iconMode: iconLink ? 'custom' : 'default',
            customIcon: iconLink
          }
        },
        data: null
      };
    }
    case 'to-do-list': {
      const items = (Array.isArray(w.items) ? w.items : [])
        .filter(it => typeof it === 'object' && it !== null && typeof it.text === 'string')
        .map((it, idx) => ({
          id: idx + 1,
          text: it.text,
          isDone: !!it.done,
          dueDate: '',
          priority: 'none'
        }));
      return {
        widget: {
          ...core,
          type: 'to-do-list',
          settings: { doneToBottom: !!w.doneToBottom }
        },
        data: { todo: JSON.stringify({ items, nextItemId: items.length + 1 }) }
      };
    }
    case 'file-opener':
    case 'file-explorer': {
      const isFolder = w.type === 'file-explorer' || w.itemType === 'folder';
      return {
        widget: {
          ...core,
          type: 'file-opener',
          // SettingsType: File = 1, Folder = 2
          settings: { type: isFolder ? 2 : 1, files: [], folders: [], openIn: '' }
        },
        data: null
      };
    }
    case 'commander':
      return {
        widget: {
          ...core,
          type: 'commander',
          settings: {
            cmds: Array.isArray(w.commands) ? w.commands.filter(c => typeof c === 'string') : [],
            cwd: ''
          }
        },
        data: null
      };
    case 'image':
      return {
        widget: {
          ...core,
          type: 'image-media',
          settings: {
            imagePath: typeof w.url === 'string' ? w.url : '',
            fitMode: 'contain',
            slideshowEnabled: false,
            slideshowIntervalSec: 10,
            slideshowFolder: ''
          }
        },
        data: null
      };
    default:
      // unknown type: preserve the tile as a note describing what was there
      return {
        widget: { ...core, type: 'note', settings: {} },
        data: { note: `Imported from Freeter 1: unsupported widget type "${w.type}" ("${widgetName(w)}")` }
      };
  }
}

interface PersistentStateSkeleton {
  entities: {
    projects: Record<string, object>;
    workflows: Record<string, object>;
    widgets: Record<string, object>;
    [key: string]: unknown;
  };
  ui: {
    projectSwitcher?: { currentProjectId?: string; projectIds?: string[];[key: string]: unknown };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const appStateVersion = 2; // keep in sync with currentAppStateVersion (renderer)

export function convertFreeter1Data(
  data: Freeter1Data,
  existingAppJson: string | undefined,
  generateId: () => string
): Freeter1ConversionResult {
  const projects: Record<string, object> = {};
  const workflows: Record<string, object> = {};
  const widgets: Record<string, object> = {};
  const widgetsData: WidgetDataEntry[] = [];
  const projectIds: string[] = [];
  let firstProjectId = '';

  for (const p of data.projects) {
    const projectId = generateId();
    const workflowIds: string[] = [];
    let currentWorkflowId = '';
    for (const tab of p.layout?.tabs ?? []) {
      const workflowId = generateId();
      const layout: object[] = [];
      for (const w of tab.widgets ?? []) {
        const widgetId = generateId();
        const converted = convertWidget(w, widgetId);
        if (!converted) {
          continue;
        }
        widgets[widgetId] = converted.widget;
        if (converted.data && Object.keys(converted.data).length > 0) {
          widgetsData.push({ id: widgetId, data: converted.data });
        }
        layout.push({
          id: generateId(),
          widgetId,
          rect: {
            x: Math.max(0, Number(w.col) || 0),
            y: Math.max(0, Number(w.row) || 0),
            w: Math.max(1, Number(w.sizeX) || 1),
            h: Math.max(1, Number(w.sizeY) || 1)
          }
        });
      }
      workflows[workflowId] = {
        id: workflowId,
        layout,
        settings: { memSaver: {}, name: tab.name || 'Workflow' }
      };
      workflowIds.push(workflowId);
      if (tab.id === p.layout?.selectedTabId) {
        currentWorkflowId = workflowId;
      }
    }
    const iconImage = typeof p.settings?.iconLink === 'string' ? p.settings.iconLink : '';
    const iconColor = v1IconColors[String(p.settings?.iconColor ?? '')] ?? '';
    projects[projectId] = {
      id: projectId,
      settings: {
        memSaver: {},
        name: p.settings?.name || 'Imported Project',
        ...((iconImage || iconColor) ? { icon: { glyph: iconImage ? '' : 'folder', color: iconColor, image: iconImage } } : {})
      },
      workflowIds,
      currentWorkflowId: currentWorkflowId || workflowIds[0] || ''
    };
    projectIds.push(projectId);
    if (!firstProjectId) {
      firstProjectId = projectId;
    }
  }

  // Freeter 1 global pools (links/commands/searches/timers — the toolbar
  // "mini-apps") become a "Freeter 1 Library" project with one workflow per pool
  const pools = data.app;
  if (pools && typeof pools === 'object') {
    const libraryWorkflows: { name: string; widgets: { widget: object; data: Record<string, string> | null }[] }[] = [];

    const links = Array.isArray(pools.links) ? pools.links : [];
    if (links.length > 0) {
      libraryWorkflows.push({
        name: 'Links',
        widgets: links.map((l, i) => ({
          widget: {
            id: '', coreSettings: { name: l.name || `Link ${i + 1}` },
            type: 'link-opener',
            settings: { urls: Array.isArray(l.urls) ? l.urls.filter(u => typeof u === 'string') : [], iconMode: 'favicon', customIcon: '' }
          },
          data: null
        }))
      });
    }

    const commands = Array.isArray(pools.commands) ? pools.commands : [];
    if (commands.length > 0) {
      libraryWorkflows.push({
        name: 'Commands',
        widgets: commands.map((c, i) => ({
          widget: {
            id: '', coreSettings: { name: c.name || `Command ${i + 1}` },
            type: 'commander',
            settings: { cmds: Array.isArray(c.cmdLines) ? c.cmdLines.filter(x => typeof x === 'string') : [], cwd: '' }
          },
          data: null
        }))
      });
    }

    const searches = Array.isArray(pools.searches) ? pools.searches : [];
    if (searches.length > 0) {
      libraryWorkflows.push({
        name: 'Searches',
        widgets: searches.map((s, i) => ({
          widget: {
            id: '', coreSettings: { name: s.name || `Search ${i + 1}` },
            type: 'web-query',
            settings: {
              engine: v1EngineIds[String(s.engine ?? '').toLowerCase()] ?? String(s.engine ?? ''),
              descr: s.name || '',
              // v1 site-scoped searches become a site: query template
              query: [
                (typeof (s as { site?: string }).site === 'string' && (s as { site?: string }).site) ? `site:${(s as { site?: string }).site}` : '',
                typeof s.qryTemplate === 'string' ? s.qryTemplate.replace(/%QUERY%/g, 'QUERY') : ''
              ].filter(Boolean).join(' '),
              url: typeof s.urlTemplate === 'string' ? s.urlTemplate.replace(/%QUERY%/g, 'QUERY') : ''
            }
          },
          data: null
        }))
      });
    }

    const tools = Array.isArray(pools.tools) ? pools.tools : [];
    if (tools.length > 0) {
      libraryWorkflows.push({
        name: 'Tools',
        widgets: tools.map((t, i) => ({
          widget: {
            id: '', coreSettings: { name: t.name || `Tool ${i + 1}` },
            // v1 tools carried no paths in this format; import as ready-to-fill launchers
            type: 'app-launcher',
            settings: { appPath: '', args: '', glyph: 'rocket', glyphColor: '', customIcon: '' }
          },
          data: null
        }))
      });
    }

    const timers = Array.isArray(pools.timers) ? pools.timers : [];
    if (timers.length > 0) {
      libraryWorkflows.push({
        name: 'Timers',
        widgets: timers.map((t, i) => ({
          widget: {
            id: '', coreSettings: { name: t.name || `Timer ${i + 1}` },
            type: 'timer',
            settings: {
              mode: 'timer',
              mins: typeof t.mins === 'number' ? t.mins : 25,
              customSecs: 0,
              endSound: typeof t.endSound === 'string' ? t.endSound : '',
              endSoundVol: typeof t.endSoundVolume === 'number' ? t.endSoundVolume : 80,
              endDesktop: !!t.endDesktop
            }
          },
          data: null
        }))
      });
    }

    if (libraryWorkflows.length > 0) {
      const projectId = generateId();
      const workflowIds: string[] = [];
      for (const wf of libraryWorkflows) {
        const workflowId = generateId();
        const layout: object[] = [];
        wf.widgets.forEach((entry, i) => {
          const widgetId = generateId();
          widgets[widgetId] = { ...entry.widget, id: widgetId };
          if (entry.data && Object.keys(entry.data).length > 0) {
            widgetsData.push({ id: widgetId, data: entry.data });
          }
          layout.push({
            id: generateId(),
            widgetId,
            // 2x2 tiles, 6 per row
            rect: { x: (i % 6) * 2, y: Math.floor(i / 6) * 2, w: 2, h: 2 }
          });
        });
        workflows[workflowId] = {
          id: workflowId,
          layout,
          settings: { memSaver: {}, name: wf.name }
        };
        workflowIds.push(workflowId);
      }
      projects[projectId] = {
        id: projectId,
        settings: { memSaver: {}, name: 'Freeter 1 Library' },
        workflowIds,
        currentWorkflowId: workflowIds[0] || ''
      };
      projectIds.push(projectId);
      if (!firstProjectId) {
        firstProjectId = projectId;
      }
    }
  }

  // merge into existing persistent state if present
  let state: PersistentStateSkeleton = {
    entities: { projects: {}, workflows: {}, widgets: {} },
    ui: {}
  };
  if (existingAppJson) {
    try {
      const parsed = JSON.parse(existingAppJson);
      if (parsed && typeof parsed === 'object' && typeof parsed.ver === 'number' && parsed.obj && typeof parsed.obj === 'object') {
        state = parsed.obj as PersistentStateSkeleton;
        state.entities = state.entities ?? { projects: {}, workflows: {}, widgets: {} };
        state.ui = state.ui ?? {};
      }
    } catch {
      // unreadable existing state: start from the imported data only
    }
  }

  state.entities.projects = { ...state.entities.projects, ...projects };
  state.entities.workflows = { ...state.entities.workflows, ...workflows };
  state.entities.widgets = { ...state.entities.widgets, ...widgets };
  const prevSwitcher = state.ui.projectSwitcher ?? {};
  const prevIds = Array.isArray(prevSwitcher.projectIds) ? prevSwitcher.projectIds : [];
  state.ui.projectSwitcher = {
    ...prevSwitcher,
    projectIds: [...prevIds, ...projectIds],
    currentProjectId: prevSwitcher.currentProjectId || firstProjectId
  };

  return {
    appJson: JSON.stringify({ ver: appStateVersion, obj: state }),
    widgetsData,
    stats: {
      projects: projectIds.length,
      workflows: Object.keys(workflows).length,
      widgets: Object.keys(widgets).length
    }
  };
}
