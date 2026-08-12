/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { parseAppState, listProjects, listWorkflows, listWidgets, createWidgetInState, switchProjectInState, switchWorkflowInState, searchNames, AppStateDoc } from '@/infra/mcpServer/mcpState';

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
    expect(wfs).toEqual([{ id: 'W1', name: 'Main', widgetCount: 1, isCurrent: true }]);
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

  it('searches names across projects, workflows and widgets', () => {
    const hits = searchNames(fixtureState(), 'note');
    expect(hits).toEqual([expect.objectContaining({ kind: 'widget', id: 'WID1', name: 'My Note' })]);
    expect(searchNames(fixtureState(), 'alpha')[0]).toEqual(expect.objectContaining({ kind: 'project', id: 'P1' }));
  })
})
