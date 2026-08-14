/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { parseAppState, listProjects, listWorkflows, listWidgets, createWidgetInState, switchProjectInState, switchWorkflowInState, reorderWorkflowsInState, setWorkflowArchivedInState, updateWidgetInState, moveWidgetInState, resizeWidgetInState, searchNames, createWorkflowInState, renameWorkflowInState, duplicateWorkflowInState, deleteWidgetFromState, createProjectInState, renameProjectInState, setProjectArchivedInState, AppStateDoc } from '@/infra/mcpServer/mcpState';

function fixtureState(): AppStateDoc {
  return {
    ver: 2,
    obj: {
      entities: {
        projects: {
          'P1': { id: 'P1', settings: { name: 'Alpha' }, workflowIds: ['W1'], currentWorkflowId: 'W1' },
          'P2': { id: 'P2', settings: { name: 'Beta' }, workflowIds: [], currentWorkflowId: '' },
        },
        workflows: {
          'W1': {
            id: 'W1', settings: { name: 'Main' },
            layout: [{ id: 'L1', widgetId: 'WID1', rect: { x: 0, y: 0, w: 2, h: 2 } }]
          },
        },
        widgets: {
          'WID1': { id: 'WID1', type: 'note', coreSettings: { name: 'My Note' }, settings: {} },
        },
      },
      ui: { projectSwitcher: { projectIds: ['P2', 'P1'], currentProjectId: 'P1' } }
    }
  };
}

describe('mcpState', () => {
  it('parses valid state and rejects junk', () => {
    expect(parseAppState(JSON.stringify(fixtureState()))).not.toBeNull();
    expect(parseAppState('{"nope":1}')).toBeNull();
    expect(parseAppState('not json')).toBeNull();
    expect(parseAppState(undefined)).toBeNull();
  })

  it('lists projects in switcher order with current flag', () => {
    const res = listProjects(fixtureState());
    expect(res.map(p => p.name)).toEqual(['Beta', 'Alpha']);
    expect(res.find(p => p.id === 'P1')?.isCurrent).toBe(true);
    expect(res.find(p => p.id === 'P1')?.workflowCount).toBe(1);
  })

  it('lists workflows and widgets', () => {
    const state = fixtureState();
    const wfs = listWorkflows(state, 'P1');
    expect(wfs).toEqual([{ id: 'W1', name: 'Main', widgetCount: 1, isCurrent: true, isArchived: false }]);
    expect(listWorkflows(state, 'NOPE')).toBeNull();

    const widgets = listWidgets(state, 'W1');
    expect(widgets).toEqual([{ id: 'WID1', type: 'note', name: 'My Note', rect: { x: 0, y: 0, w: 2, h: 2 } }]);
    expect(listWidgets(state, 'NOPE')).toBeNull();
  })

  it('creates a widget below the existing layout', () => {
    const state = fixtureState();
    let n = 0;
    const res = createWidgetInState(state, 'W1', 'note', 'New Note', {}, () => `GEN-${++n}`);
    expect(res).toEqual({ widgetId: 'GEN-1' });
    expect(state.obj.entities.widgets['GEN-1'].coreSettings.name).toBe('New Note');
    const layout = state.obj.entities.workflows['W1'].layout;
    expect(layout).toHaveLength(2);
    expect(layout[1].rect.y).toBe(2);
    expect(createWidgetInState(state, 'NOPE', 'note', 'x', {}, () => 'y')).toBeNull();
  })
})

describe('mcpState v2', () => {
  it('switches project and workflow', () => {
    const state = fixtureState();
    expect(switchProjectInState(state, 'P2')).toBe(true);
    expect(state.obj.ui.projectSwitcher?.currentProjectId).toBe('P2');
    expect(switchProjectInState(state, 'NOPE')).toBe(false);

    expect(switchWorkflowInState(state, 'W1')).toBe(true);
    expect(state.obj.ui.projectSwitcher?.currentProjectId).toBe('P1');
    expect(state.obj.entities.projects['P1'].currentWorkflowId).toBe('W1');
    expect(switchWorkflowInState(state, 'NOPE')).toBe(false);
  })

  it('updates widget name and merges settings with null-deletes', () => {
    const state = fixtureState();
    (state.obj.entities.widgets['WID1'].settings as Record<string, unknown>) = { a: 1, b: 2 };
    expect(updateWidgetInState(state, 'WID1', { name: 'Renamed', settings: { b: null, c: 3 } })).toBe(true);
    expect(state.obj.entities.widgets['WID1'].coreSettings.name).toBe('Renamed');
    expect(state.obj.entities.widgets['WID1'].settings).toEqual({ a: 1, c: 3 });
    expect(updateWidgetInState(state, 'NOPE', { name: 'x' })).toBe(false);
  })

  it('moves a widget between workflows, appending below the target layout', () => {
    const state = fixtureState();
    state.obj.entities.workflows['W2'] = {
      id: 'W2', settings: { name: 'Other' },
      layout: [{ id: 'L9', widgetId: 'WID9', rect: { x: 0, y: 0, w: 3, h: 5 } }]
    };
    (state.obj.entities.projects['P1'] as { workflowIds: string[] }).workflowIds = ['W1', 'W2'];

    expect(moveWidgetInState(state, 'WID1', 'W2', () => 'GEN')).toBeUndefined();
    expect(state.obj.entities.workflows['W1'].layout).toHaveLength(0);
    const moved = state.obj.entities.workflows['W2'].layout.find(i => i.widgetId === 'WID1');
    expect(moved?.rect).toEqual({ x: 0, y: 5, w: 2, h: 2 });

    // no-op when already there; errors for unknown ids
    expect(moveWidgetInState(state, 'WID1', 'W2', () => 'G2')).toBeUndefined();
    expect(state.obj.entities.workflows['W2'].layout.filter(i => i.widgetId === 'WID1')).toHaveLength(1);
    expect(moveWidgetInState(state, 'NOPE', 'W2', () => 'G3')).toMatch(/widget NOPE not found/);
    expect(moveWidgetInState(state, 'WID1', 'NOPE', () => 'G4')).toMatch(/workflow NOPE not found/);
  })

  it('resizes a widget layout rect with validation', () => {
    const state = fixtureState();
    expect(resizeWidgetInState(state, 'WID1', { x: 2, y: 3, w: 4, h: 1 })).toBeUndefined();
    expect(state.obj.entities.workflows['W1'].layout[0].rect).toEqual({ x: 2, y: 3, w: 4, h: 1 });
    expect(resizeWidgetInState(state, 'NOPE', { x: 0, y: 0, w: 1, h: 1 })).toMatch(/not placed/);
    expect(resizeWidgetInState(state, 'WID1', { x: 0, y: 0, w: 0, h: 1 })).toMatch(/integers/);
    expect(resizeWidgetInState(state, 'WID1', { x: -1, y: 0, w: 1, h: 1 })).toMatch(/integers/);
  })

  it('archives and unarchives a workflow', () => {
    const state = fixtureState();
    expect(setWorkflowArchivedInState(state, 'W1', true)).toBe(true);
    expect((state.obj.entities.workflows['W1'].settings as { isArchived?: boolean }).isArchived).toBe(true);
    expect(listWorkflows(state, 'P1')?.[0].isArchived).toBe(true);

    expect(setWorkflowArchivedInState(state, 'W1', false)).toBe(true);
    expect(listWorkflows(state, 'P1')?.[0].isArchived).toBe(false);
    expect(setWorkflowArchivedInState(state, 'NOPE', true)).toBe(false);
  })

  it('reorders workflows with permutation validation', () => {
    const state = fixtureState();
    const p1 = state.obj.entities.projects['P1'] as { workflowIds: string[] };
    p1.workflowIds = ['W1', 'W2', 'W3'];

    expect(reorderWorkflowsInState(state, 'P1', ['W3', 'W1', 'W2'])).toBeUndefined();
    expect(state.obj.entities.projects['P1'].workflowIds).toEqual(['W3', 'W1', 'W2']);

    expect(reorderWorkflowsInState(state, 'NOPE', ['W1'])).toMatch(/not found/);
    expect(reorderWorkflowsInState(state, 'P1', ['W1', 'W2'])).toMatch(/expected 3/);
    expect(reorderWorkflowsInState(state, 'P1', ['W1', 'W2', 'WX'])).toMatch(/not in this project/);
    expect(reorderWorkflowsInState(state, 'P1', ['W1', 'W1', 'W2'])).toMatch(/more than once/);
    // failed reorders leave the order untouched
    expect(state.obj.entities.projects['P1'].workflowIds).toEqual(['W3', 'W1', 'W2']);
  })

  it('searches names across projects, workflows and widgets', () => {
    const hits = searchNames(fixtureState(), 'note');
    expect(hits).toEqual([expect.objectContaining({ kind: 'widget', id: 'WID1', name: 'My Note' })]);
    expect(searchNames(fixtureState(), 'alpha')[0]).toEqual(expect.objectContaining({ kind: 'project', id: 'P1' }));
  })
})

describe('mcpState phase 1', () => {
  it('creates a workflow, appending it and making it current', () => {
    const state = fixtureState();
    let n = 0;
    const res = createWorkflowInState(state, 'P1', 'New Tab', () => `GEN-${++n}`);
    expect(res).toEqual({ workflowId: 'GEN-1' });
    expect(state.obj.entities.workflows['GEN-1']).toEqual({ id: 'GEN-1', settings: { name: 'New Tab', memSaver: {} }, layout: [] });
    expect(state.obj.entities.projects['P1'].workflowIds).toEqual(['W1', 'GEN-1']);
    expect(state.obj.entities.projects['P1'].currentWorkflowId).toBe('GEN-1');
    expect(createWorkflowInState(state, 'NOPE', 'x', () => 'y')).toBeNull();
  })

  it('renames a workflow', () => {
    const state = fixtureState();
    expect(renameWorkflowInState(state, 'W1', 'Renamed Tab')).toBe(true);
    expect(state.obj.entities.workflows['W1'].settings.name).toBe('Renamed Tab');
    expect(renameWorkflowInState(state, 'NOPE', 'x')).toBe(false);
  })

  it('duplicates a workflow, deep-cloning widgets and layout items under new ids', () => {
    const state = fixtureState();
    (state.obj.entities.widgets['WID1'].settings as Record<string, unknown>) = { nested: { a: 1 } };
    let n = 0;
    const res = duplicateWorkflowInState(state, 'W1', () => `GEN-${++n}`);
    expect(res).not.toBeNull();
    const { workflowId, clonedWidgetIds } = res as NonNullable<typeof res>;
    const copy = state.obj.entities.workflows[workflowId];
    expect(copy.settings.name).toBe('Main Copy');
    // inserted right after the source in the project's tab order
    expect(state.obj.entities.projects['P1'].workflowIds).toEqual(['W1', workflowId]);
    // widget cloned deeply under a new id; the layout item points at the clone
    expect(clonedWidgetIds).toEqual([{ from: 'WID1', to: expect.any(String) }]);
    const cloneId = clonedWidgetIds[0].to;
    expect(cloneId).not.toBe('WID1');
    expect(state.obj.entities.widgets[cloneId].id).toBe(cloneId);
    expect(state.obj.entities.widgets[cloneId].settings).toEqual({ nested: { a: 1 } });
    expect(state.obj.entities.widgets[cloneId].settings).not.toBe(state.obj.entities.widgets['WID1'].settings);
    expect(copy.layout).toEqual([{ id: expect.any(String), widgetId: cloneId, rect: { x: 0, y: 0, w: 2, h: 2 } }]);
    expect(copy.layout[0].id).not.toBe('L1');
    // source untouched
    expect(state.obj.entities.workflows['W1'].layout).toEqual([{ id: 'L1', widgetId: 'WID1', rect: { x: 0, y: 0, w: 2, h: 2 } }]);
    expect(duplicateWorkflowInState(state, 'NOPE', () => 'x')).toBeNull();
  })

  it('skips dangling layout items when duplicating', () => {
    const state = fixtureState();
    state.obj.entities.workflows['W1'].layout.push({ id: 'L2', widgetId: 'GONE', rect: { x: 0, y: 2, w: 1, h: 1 } });
    let n = 0;
    const res = duplicateWorkflowInState(state, 'W1', () => `GEN-${++n}`);
    expect(res?.clonedWidgetIds).toHaveLength(1);
    expect(state.obj.entities.workflows[(res as NonNullable<typeof res>).workflowId].layout).toHaveLength(1);
  })

  it('deletes a widget together with its layout item', () => {
    const state = fixtureState();
    expect(deleteWidgetFromState(state, 'WID1')).toBeUndefined();
    expect(state.obj.entities.widgets['WID1']).toBeUndefined();
    expect(state.obj.entities.workflows['W1'].layout).toHaveLength(0);
    expect(deleteWidgetFromState(state, 'WID1')).toMatch(/not found/);
  })

  it('deletes a shelf widget from the shelf list', () => {
    const state = fixtureState();
    state.obj.entities.widgets['WID2'] = { id: 'WID2', type: 'note', coreSettings: { name: 'Shelf Note' }, settings: {} };
    state.obj.ui.shelf = { widgetList: [{ id: 'SL1', widgetId: 'WID2' }] };
    expect(deleteWidgetFromState(state, 'WID2')).toBeUndefined();
    expect(state.obj.entities.widgets['WID2']).toBeUndefined();
    expect(state.obj.ui.shelf?.widgetList).toEqual([]);
    // workflow layout untouched
    expect(state.obj.entities.workflows['W1'].layout).toHaveLength(1);
  })

  it('creates a project appended to the switcher order', () => {
    const state = fixtureState();
    const res = createProjectInState(state, 'Gamma', () => 'GEN-P');
    expect(res).toEqual({ projectId: 'GEN-P' });
    expect(state.obj.entities.projects['GEN-P']).toEqual({ id: 'GEN-P', settings: { name: 'Gamma' }, workflowIds: [], currentWorkflowId: '' });
    expect(state.obj.ui.projectSwitcher?.projectIds).toEqual(['P2', 'P1', 'GEN-P']);
  })

  it('creates a project when the switcher order is absent, keeping existing projects', () => {
    const state = fixtureState();
    delete state.obj.ui.projectSwitcher?.projectIds;
    const res = createProjectInState(state, 'Gamma', () => 'GEN-P');
    expect(res).toEqual({ projectId: 'GEN-P' });
    expect(state.obj.ui.projectSwitcher?.projectIds).toEqual(['P1', 'P2', 'GEN-P']);
  })

  it('renames a project', () => {
    const state = fixtureState();
    expect(renameProjectInState(state, 'P1', 'Alpha 2')).toBe(true);
    expect(state.obj.entities.projects['P1'].settings.name).toBe('Alpha 2');
    expect(renameProjectInState(state, 'NOPE', 'x')).toBe(false);
  })

  it('archives and unarchives a project', () => {
    const state = fixtureState();
    expect(setProjectArchivedInState(state, 'P1', true)).toBe(true);
    expect(state.obj.entities.projects['P1'].settings.isArchived).toBe(true);
    expect(listProjects(state).find(p => p.id === 'P1')?.isArchived).toBe(true);

    expect(setProjectArchivedInState(state, 'P1', false)).toBe(true);
    expect(state.obj.entities.projects['P1'].settings.isArchived).toBeUndefined();
    expect(listProjects(state).find(p => p.id === 'P1')?.isArchived).toBe(false);
    expect(setProjectArchivedInState(state, 'NOPE', true)).toBe(false);
  })
})
