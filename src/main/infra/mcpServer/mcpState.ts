/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

/**
 * Pure helpers over the persisted app state JSON ({ver, obj}) used by the
 * MCP server tools. Kept SDK-free so they are unit-testable.
 */

interface EntityBase { id: string }
interface ProjectEntity extends EntityBase {
  settings: { name?: string; isArchived?: boolean };
  workflowIds: string[];
  currentWorkflowId: string;
}
interface WorkflowEntity extends EntityBase {
  settings: { name?: string;[key: string]: unknown };
  layout: { id: string; widgetId: string; rect: { x: number; y: number; w: number; h: number } }[];
}
interface WidgetEntity extends EntityBase {
  type: string;
  coreSettings: { name?: string };
  settings: Record<string, unknown>;
}

export interface AppStateDoc {
  ver: number;
  obj: {
    entities: {
      projects: Record<string, ProjectEntity>;
      workflows: Record<string, WorkflowEntity>;
      widgets: Record<string, WidgetEntity>;
      [key: string]: unknown;
    };
    ui: {
      projectSwitcher?: { projectIds?: string[]; currentProjectId?: string;[key: string]: unknown };
      shelf?: { widgetList?: { id: string; widgetId: string }[];[key: string]: unknown };
      [key: string]: unknown
    };
    [key: string]: unknown;
  };
}

export function parseAppState(json: string | undefined): AppStateDoc | null {
  if (!json) {
    return null;
  }
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.ver === 'number' && parsed.obj?.entities) {
      return parsed as AppStateDoc;
    }
    return null;
  } catch {
    return null;
  }
}

export function listProjects(state: AppStateDoc) {
  const order = state.obj.ui.projectSwitcher?.projectIds ?? Object.keys(state.obj.entities.projects);
  const currentId = state.obj.ui.projectSwitcher?.currentProjectId ?? '';
  return order
    .map(id => state.obj.entities.projects[id])
    .filter(Boolean)
    .map(p => ({
      id: p.id,
      name: p.settings.name ?? '',
      workflowCount: p.workflowIds.length,
      isCurrent: p.id === currentId,
      isArchived: !!p.settings.isArchived
    }));
}

export function listWorkflows(state: AppStateDoc, projectId: string) {
  const project = state.obj.entities.projects[projectId];
  if (!project) {
    return null;
  }
  return project.workflowIds
    .map(id => state.obj.entities.workflows[id])
    .filter(Boolean)
    .map(w => ({
      id: w.id,
      name: w.settings.name ?? '',
      widgetCount: w.layout.length,
      isCurrent: w.id === project.currentWorkflowId,
      isArchived: (w.settings as { isArchived?: boolean }).isArchived === true
    }));
}

/** Archives or unarchives a workflow tab. Returns false if the workflow doesn't exist. */
export function setWorkflowArchivedInState(state: AppStateDoc, workflowId: string, archived: boolean): boolean {
  const workflow = state.obj.entities.workflows[workflowId];
  if (!workflow) {
    return false;
  }
  (workflow.settings as { isArchived?: boolean }).isArchived = archived ? true : undefined;
  return true;
}

/**
 * Creates a new empty workflow (tab) in a project and makes it the project's
 * current workflow. Returns null if the project doesn't exist.
 */
export function createWorkflowInState(
  state: AppStateDoc,
  projectId: string,
  name: string,
  generateId: () => string
): { workflowId: string } | null {
  const project = state.obj.entities.projects[projectId];
  if (!project) {
    return null;
  }
  const workflowId = generateId();
  state.obj.entities.workflows[workflowId] = {
    id: workflowId,
    settings: { name, memSaver: {} },
    layout: []
  };
  project.workflowIds = [...project.workflowIds, workflowId];
  project.currentWorkflowId = workflowId;
  return { workflowId };
}

/** Renames a workflow tab. Returns false if the workflow doesn't exist. */
export function renameWorkflowInState(state: AppStateDoc, workflowId: string, name: string): boolean {
  const workflow = state.obj.entities.workflows[workflowId];
  if (!workflow) {
    return false;
  }
  workflow.settings = { ...workflow.settings, name };
  return true;
}

/**
 * Duplicates a workflow inside its project: deep-copies the workflow entity
 * (new id, name + ' Copy'), clones every widget entity in its layout (new
 * widget ids) and every layout item (new item ids) pointing at the clones,
 * and inserts the copy right after the source in the project's tab order.
 * Widget DATA (note text etc.) lives outside the app state — the returned
 * clonedWidgetIds pairs let the caller copy it separately.
 * Returns null if the workflow doesn't exist or belongs to no project.
 */
export function duplicateWorkflowInState(
  state: AppStateDoc,
  workflowId: string,
  generateId: () => string
): { workflowId: string; clonedWidgetIds: { from: string; to: string }[] } | null {
  const source = state.obj.entities.workflows[workflowId];
  if (!source) {
    return null;
  }
  const project = Object.values(state.obj.entities.projects).find(p => p.workflowIds.includes(workflowId));
  if (!project) {
    return null;
  }
  const clonedWidgetIds: { from: string; to: string }[] = [];
  const newLayout: WorkflowEntity['layout'] = [];
  for (const item of source.layout) {
    const srcWidget = state.obj.entities.widgets[item.widgetId];
    if (!srcWidget) {
      // dangling layout item: don't carry it into the copy
      continue;
    }
    const newWidgetId = generateId();
    state.obj.entities.widgets[newWidgetId] = {
      ...(JSON.parse(JSON.stringify(srcWidget)) as WidgetEntity),
      id: newWidgetId
    };
    clonedWidgetIds.push({ from: item.widgetId, to: newWidgetId });
    newLayout.push({ id: generateId(), widgetId: newWidgetId, rect: { ...item.rect } });
  }
  const newWorkflowId = generateId();
  state.obj.entities.workflows[newWorkflowId] = {
    ...(JSON.parse(JSON.stringify(source)) as WorkflowEntity),
    id: newWorkflowId,
    settings: {
      ...(JSON.parse(JSON.stringify(source.settings)) as WorkflowEntity['settings']),
      name: `${source.settings.name ?? ''} Copy`.trim()
    },
    layout: newLayout
  };
  const ids = [...project.workflowIds];
  ids.splice(ids.indexOf(workflowId) + 1, 0, newWorkflowId);
  project.workflowIds = ids;
  return { workflowId: newWorkflowId, clonedWidgetIds };
}

export function listWidgets(state: AppStateDoc, workflowId: string) {
  const workflow = state.obj.entities.workflows[workflowId];
  if (!workflow) {
    return null;
  }
  return workflow.layout
    .map(item => {
      const w = state.obj.entities.widgets[item.widgetId];
      return w ? { id: w.id, type: w.type, name: w.coreSettings.name ?? '', rect: item.rect } : null;
    })
    .filter((w): w is NonNullable<typeof w> => w !== null);
}

export function getWidget(state: AppStateDoc, widgetId: string) {
  return state.obj.entities.widgets[widgetId] ?? null;
}

/**
 * Updates a widget's display name and/or merges keys into its settings.
 * Setting a settings key to null deletes it. Returns false if the widget doesn't exist.
 */
export function updateWidgetInState(
  state: AppStateDoc,
  widgetId: string,
  changes: { name?: string; settings?: Record<string, unknown> }
): boolean {
  const widget = state.obj.entities.widgets[widgetId];
  if (!widget) {
    return false;
  }
  if (changes.name !== undefined) {
    widget.coreSettings = { ...widget.coreSettings, name: changes.name };
  }
  if (changes.settings) {
    const merged: Record<string, unknown> = { ...(widget.settings as Record<string, unknown>) };
    for (const [key, value] of Object.entries(changes.settings)) {
      if (value === null) {
        delete merged[key];
      } else {
        merged[key] = value;
      }
    }
    widget.settings = merged;
  }
  return true;
}

/**
 * Moves a widget to another workflow (tab), placing it below that tab's layout.
 * Returns an error string on failure.
 */
export function moveWidgetInState(
  state: AppStateDoc,
  widgetId: string,
  targetWorkflowId: string,
  generateId: () => string
): string | undefined {
  if (!state.obj.entities.widgets[widgetId]) {
    return `widget ${widgetId} not found`;
  }
  const target = state.obj.entities.workflows[targetWorkflowId];
  if (!target) {
    return `workflow ${targetWorkflowId} not found`;
  }
  const source = Object.values(state.obj.entities.workflows)
    .find(w => w.layout.some(item => item.widgetId === widgetId));
  if (!source) {
    return `widget ${widgetId} is not placed in any workflow`;
  }
  if (source.id === targetWorkflowId) {
    return undefined;
  }
  const item = source.layout.find(i => i.widgetId === widgetId);
  source.layout = source.layout.filter(i => i.widgetId !== widgetId);
  const maxY = target.layout.reduce((m, i) => Math.max(m, i.rect.y + i.rect.h), 0);
  target.layout = [
    ...target.layout,
    { id: generateId(), widgetId, rect: { ...(item as NonNullable<typeof item>).rect, x: 0, y: maxY } }
  ];
  return undefined;
}

/**
 * Sets the grid rect (x, y, w, h) of a widget's layout item.
 * Returns an error string on failure.
 */
export function resizeWidgetInState(
  state: AppStateDoc,
  widgetId: string,
  rect: { x: number; y: number; w: number; h: number }
): string | undefined {
  if ([rect.x, rect.y, rect.w, rect.h].some(n => !Number.isInteger(n) || n < 0) || rect.w < 1 || rect.h < 1) {
    return 'rect values must be non-negative integers with w/h >= 1';
  }
  const workflow = Object.values(state.obj.entities.workflows)
    .find(w => w.layout.some(item => item.widgetId === widgetId));
  if (!workflow) {
    return `widget ${widgetId} is not placed in any workflow`;
  }
  workflow.layout = workflow.layout.map(item => item.widgetId === widgetId ? { ...item, rect: { ...rect } } : item);
  return undefined;
}

/** places a new widget below the lowest row of the workflow layout */
export function createWidgetInState(
  state: AppStateDoc,
  workflowId: string,
  type: string,
  name: string,
  settings: Record<string, unknown>,
  generateId: () => string
): { widgetId: string } | null {
  const workflow = state.obj.entities.workflows[workflowId];
  if (!workflow) {
    return null;
  }
  const widgetId = generateId();
  state.obj.entities.widgets[widgetId] = {
    id: widgetId,
    type,
    coreSettings: { name },
    settings
  };
  const maxY = workflow.layout.reduce((m, item) => Math.max(m, item.rect.y + item.rect.h), 0);
  workflow.layout = [
    ...workflow.layout,
    { id: generateId(), widgetId, rect: { x: 0, y: maxY, w: 4, h: 4 } }
  ];
  return { widgetId };
}

/**
 * Removes a widget entity plus its layout item from whichever workflow holds
 * it, and its entry in the shelf widget list if present.
 * Returns an error string on failure.
 */
export function deleteWidgetFromState(state: AppStateDoc, widgetId: string): string | undefined {
  if (!state.obj.entities.widgets[widgetId]) {
    return `widget ${widgetId} not found`;
  }
  delete state.obj.entities.widgets[widgetId];
  for (const workflow of Object.values(state.obj.entities.workflows)) {
    if (workflow.layout.some(item => item.widgetId === widgetId)) {
      workflow.layout = workflow.layout.filter(item => item.widgetId !== widgetId);
    }
  }
  const shelf = state.obj.ui.shelf;
  if (shelf && Array.isArray(shelf.widgetList)) {
    shelf.widgetList = shelf.widgetList.filter(item => item.widgetId !== widgetId);
  }
  return undefined;
}

/** Creates a new empty project (dashboard) and appends it to the project switcher order. */
export function createProjectInState(
  state: AppStateDoc,
  name: string,
  generateId: () => string
): { projectId: string } {
  const projectId = generateId();
  state.obj.entities.projects[projectId] = {
    id: projectId,
    settings: { name },
    workflowIds: [],
    currentWorkflowId: ''
  };
  const switcher = state.obj.ui.projectSwitcher ?? {};
  // absent order list: seed it from the existing projects so none disappear
  const order = switcher.projectIds ?? Object.keys(state.obj.entities.projects).filter(id => id !== projectId);
  state.obj.ui.projectSwitcher = { ...switcher, projectIds: [...order, projectId] };
  return { projectId };
}

/** Renames a project. Returns false if the project doesn't exist. */
export function renameProjectInState(state: AppStateDoc, projectId: string, name: string): boolean {
  const project = state.obj.entities.projects[projectId];
  if (!project) {
    return false;
  }
  project.settings = { ...project.settings, name };
  return true;
}

/** Archives or unarchives a project. Returns false if the project doesn't exist. */
export function setProjectArchivedInState(state: AppStateDoc, projectId: string, archived: boolean): boolean {
  const project = state.obj.entities.projects[projectId];
  if (!project) {
    return false;
  }
  project.settings.isArchived = archived ? true : undefined;
  return true;
}

export function switchProjectInState(state: AppStateDoc, projectId: string): boolean {
  if (!state.obj.entities.projects[projectId]) {
    return false;
  }
  state.obj.ui.projectSwitcher = {
    ...(state.obj.ui.projectSwitcher ?? {}),
    currentProjectId: projectId
  };
  return true;
}

export function switchWorkflowInState(state: AppStateDoc, workflowId: string): boolean {
  const project = Object.values(state.obj.entities.projects).find(p => p.workflowIds.includes(workflowId));
  if (!project) {
    return false;
  }
  (state.obj.entities.projects[project.id] as { currentWorkflowId: string }).currentWorkflowId = workflowId;
  switchProjectInState(state, project.id);
  return true;
}

/**
 * Reorders a project's workflow tabs. orderedWorkflowIds must be a permutation
 * of the project's current workflow ids; returns an error string otherwise.
 */
export function reorderWorkflowsInState(state: AppStateDoc, projectId: string, orderedWorkflowIds: string[]): string | undefined {
  const project = state.obj.entities.projects[projectId];
  if (!project) {
    return `project ${projectId} not found`;
  }
  const current = project.workflowIds;
  if (orderedWorkflowIds.length !== current.length) {
    return `expected ${current.length} workflow ids, got ${orderedWorkflowIds.length}`;
  }
  const currentSet = new Set(current);
  const seen = new Set<string>();
  for (const id of orderedWorkflowIds) {
    if (!currentSet.has(id)) {
      return `workflow ${id} is not in this project`;
    }
    if (seen.has(id)) {
      return `workflow ${id} appears more than once`;
    }
    seen.add(id);
  }
  (project as { workflowIds: string[] }).workflowIds = [...orderedWorkflowIds];
  return undefined;
}

export interface SearchHit {
  kind: 'project' | 'workflow' | 'widget';
  id: string;
  name: string;
  widgetType?: string;
  projectName?: string;
  workflowName?: string;
}

/** searches project/workflow/widget names (case-insensitive substring) */
export function searchNames(state: AppStateDoc, query: string): SearchHit[] {
  const q = query.toLowerCase();
  const hits: SearchHit[] = [];
  for (const p of Object.values(state.obj.entities.projects)) {
    if ((p.settings.name ?? '').toLowerCase().includes(q)) {
      hits.push({ kind: 'project', id: p.id, name: p.settings.name ?? '' });
    }
    for (const wid of p.workflowIds) {
      const w = state.obj.entities.workflows[wid];
      if (!w) {
        continue;
      }
      if ((w.settings.name ?? '').toLowerCase().includes(q)) {
        hits.push({ kind: 'workflow', id: w.id, name: w.settings.name ?? '', projectName: p.settings.name ?? '' });
      }
      for (const item of w.layout) {
        const widget = state.obj.entities.widgets[item.widgetId];
        if (widget && (widget.coreSettings.name ?? '').toLowerCase().includes(q)) {
          hits.push({
            kind: 'widget', id: widget.id, name: widget.coreSettings.name ?? '',
            widgetType: widget.type, projectName: p.settings.name ?? '', workflowName: w.settings.name ?? ''
          });
        }
      }
    }
  }
  return hits;
}

/** widgets of a content-bearing type, with their location, for content search and MCP resource listing */
export function listContentWidgets(state: AppStateDoc, types: readonly string[] = ['note', 'to-do-list']): { id: string; type: string; name: string; projectName: string; workflowName: string }[] {
  const res: { id: string; type: string; name: string; projectName: string; workflowName: string }[] = [];
  for (const p of Object.values(state.obj.entities.projects)) {
    for (const wid of p.workflowIds) {
      const w = state.obj.entities.workflows[wid];
      if (!w) {
        continue;
      }
      for (const item of w.layout) {
        const widget = state.obj.entities.widgets[item.widgetId];
        if (widget && types.includes(widget.type)) {
          res.push({
            id: widget.id, type: widget.type, name: widget.coreSettings.name ?? '',
            projectName: p.settings.name ?? '', workflowName: w.settings.name ?? ''
          });
        }
      }
    }
  }
  return res;
}

/* ---- Phase 2: content widget data (kanban-board / calendar) ----
 * Data shapes mirror the renderer widgets:
 * - kanban-board stores {cards: [{id, title, description, color, columnIdx}], nextCardId}
 *   under widget-data key 'kanban'; column NAMES live in widget settings.columns.
 * - calendar stores {events: [{id, title, date: 'YYYY-MM-DD', description}], nextEventId}
 *   under widget-data key 'events'.
 */

export interface KanbanCardData {
  id: number;
  title: string;
  description: string;
  color: string;
  /** 0-based index into the column names of the widget's settings */
  columnIdx: number;
}

export interface KanbanData {
  cards: KanbanCardData[];
  nextCardId: number;
  [key: string]: unknown;
}

/** default color the renderer's addCard uses */
const defaultKanbanCardColor = '#4e9af1';
const defaultKanbanColumns = ['To Do', 'In Progress', 'Done'];

/** Parses stored kanban JSON defensively; junk yields an empty board. */
export function parseKanbanData(raw: string | undefined): KanbanData {
  const empty: KanbanData = { cards: [], nextCardId: 1 };
  if (!raw) {
    return empty;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return empty;
  }
  const obj = parsed as Record<string, unknown>;
  const cards: KanbanCardData[] = (Array.isArray(obj.cards) ? obj.cards : [])
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object' && typeof (c as { id?: unknown }).id === 'number')
    .map(c => ({
      id: c.id as number,
      title: typeof c.title === 'string' ? c.title : '',
      description: typeof c.description === 'string' ? c.description : '',
      color: typeof c.color === 'string' ? c.color : defaultKanbanCardColor,
      columnIdx: typeof c.columnIdx === 'number' && Number.isInteger(c.columnIdx) && c.columnIdx >= 0 ? c.columnIdx : 0
    }));
  const maxId = cards.reduce((m, c) => Math.max(m, c.id), 0);
  const nextCardId = typeof obj.nextCardId === 'number' && obj.nextCardId > maxId ? obj.nextCardId : maxId + 1;
  return { ...obj, cards, nextCardId };
}

/** Column names of a kanban widget from its settings (renderer defaults apply). */
export function kanbanColumnsFromSettings(settings: Record<string, unknown>): string[] {
  const cols = Array.isArray(settings.columns) ? settings.columns.filter((c): c is string => typeof c === 'string') : [];
  return cols.length > 0 ? cols : [...defaultKanbanColumns];
}

/**
 * Resolves a column reference (0-based index, or a name matched
 * case-insensitively) to a column index. Returns null when it matches nothing.
 */
export function resolveKanbanColumn(columns: string[], ref: number | string): number | null {
  if (typeof ref === 'number') {
    return Number.isInteger(ref) && ref >= 0 && ref < columns.length ? ref : null;
  }
  const name = ref.trim().toLowerCase();
  const byName = columns.findIndex(c => c.trim().toLowerCase() === name);
  if (byName >= 0) {
    return byName;
  }
  if (/^\d+$/.test(name)) {
    const idx = Number(name);
    return idx < columns.length ? idx : null;
  }
  return null;
}

/** Board view: columns (by index/name) each with its cards in order. */
export function readKanbanBoard(columns: string[], data: KanbanData) {
  // cards may point past the configured columns (settings edited later): show them anyway
  const maxIdx = data.cards.reduce((m, c) => Math.max(m, c.columnIdx), columns.length - 1);
  const res: { column: number; name: string; cards: { id: number; title: string; description: string; color: string }[] }[] = [];
  for (let idx = 0; idx <= maxIdx; idx++) {
    res.push({
      column: idx,
      name: columns[idx] ?? `(column ${idx})`,
      cards: data.cards
        .filter(c => c.columnIdx === idx)
        .map(({ id, title, description, color }) => ({ id, title, description, color }))
    });
  }
  return { columns: res };
}

/** Appends a new card to a column (renderer-compatible defaults). */
export function addKanbanCardToData(data: KanbanData, columnIdx: number, title: string, description = ''): { cardId: number } {
  const cardId = data.nextCardId;
  data.cards = [...data.cards, { id: cardId, title: title.trim(), description, color: defaultKanbanCardColor, columnIdx }];
  data.nextCardId = cardId + 1;
  return { cardId };
}

/** Edits a card's title/description/color. Returns an error string on unknown id. */
export function updateKanbanCardInData(
  data: KanbanData,
  cardId: number,
  changes: { title?: string; description?: string; color?: string }
): string | undefined {
  const card = data.cards.find(c => c.id === cardId);
  if (!card) {
    return `card ${cardId} not found`;
  }
  data.cards = data.cards.map(c => c.id === cardId ? { ...c, ...changes } : c);
  return undefined;
}

/**
 * Moves a card to a column, optionally at a 0-based position within that
 * column (clamped; default appends at the end). The card order within a
 * column is the relative order of the flat cards list, so the card is
 * re-inserted at the matching flat index. Returns an error string on failure.
 */
export function moveKanbanCardInData(data: KanbanData, cardId: number, toColumnIdx: number, position?: number): string | undefined {
  const card = data.cards.find(c => c.id === cardId);
  if (!card) {
    return `card ${cardId} not found`;
  }
  const rest = data.cards.filter(c => c.id !== cardId);
  const moved: KanbanCardData = { ...card, columnIdx: toColumnIdx };
  const colCards = rest.filter(c => c.columnIdx === toColumnIdx);
  const pos = position === undefined ? colCards.length : Math.max(0, Math.min(Math.floor(position), colCards.length));
  const insertAt = pos < colCards.length ? rest.indexOf(colCards[pos])
    : colCards.length > 0 ? rest.indexOf(colCards[colCards.length - 1]) + 1
    : rest.length;
  rest.splice(insertAt, 0, moved);
  data.cards = rest;
  return undefined;
}

export interface CalendarEventData {
  id: number;
  title: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  description: string;
}

export interface CalendarData {
  events: CalendarEventData[];
  nextEventId: number;
  [key: string]: unknown;
}

/** Parses stored calendar JSON defensively; junk yields an empty calendar. */
export function parseCalendarData(raw: string | undefined): CalendarData {
  const empty: CalendarData = { events: [], nextEventId: 1 };
  if (!raw) {
    return empty;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return empty;
  }
  const obj = parsed as Record<string, unknown>;
  const events: CalendarEventData[] = (Array.isArray(obj.events) ? obj.events : [])
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object' && typeof (e as { id?: unknown }).id === 'number')
    .map(e => ({
      id: e.id as number,
      title: typeof e.title === 'string' ? e.title : '',
      date: typeof e.date === 'string' ? e.date : '',
      description: typeof e.description === 'string' ? e.description : ''
    }));
  const maxId = events.reduce((m, e) => Math.max(m, e.id), 0);
  const nextEventId = typeof obj.nextEventId === 'number' && obj.nextEventId > maxId ? obj.nextEventId : maxId + 1;
  return { ...obj, events, nextEventId };
}

/**
 * Appends an event on a YYYY-MM-DD date (validated as a real calendar day).
 * Returns an error string on an invalid date.
 */
export function addCalendarEventToData(data: CalendarData, date: string, title: string, description = ''): { eventId: number } | string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) {
    return `invalid date "${date}": expected YYYY-MM-DD`;
  }
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    return `invalid date "${date}": not a real calendar day`;
  }
  const eventId = data.nextEventId;
  data.events = [...data.events, { id: eventId, title, date, description }];
  data.nextEventId = eventId + 1;
  return { eventId };
}
