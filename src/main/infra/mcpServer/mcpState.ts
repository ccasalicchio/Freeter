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
  settings: { name?: string };
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
    ui: { projectSwitcher?: { projectIds?: string[]; currentProjectId?: string;[key: string]: unknown };[key: string]: unknown };
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
      isCurrent: w.id === project.currentWorkflowId
    }));
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
