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

/** widgets of a content-bearing type, with their location, for content search */
export function listContentWidgets(state: AppStateDoc): { id: string; type: string; name: string; projectName: string; workflowName: string }[] {
  const res: { id: string; type: string; name: string; projectName: string; workflowName: string }[] = [];
  for (const p of Object.values(state.obj.entities.projects)) {
    for (const wid of p.workflowIds) {
      const w = state.obj.entities.workflows[wid];
      if (!w) {
        continue;
      }
      for (const item of w.layout) {
        const widget = state.obj.entities.widgets[item.widgetId];
        if (widget && (widget.type === 'note' || widget.type === 'to-do-list')) {
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
