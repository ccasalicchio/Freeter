/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { convertFreeter1Data, isFreeter1Data, Freeter1Data } from '@/application/useCases/profile/freeter1Converter';

function makeIdGen() {
  let n = 0;
  return () => `ID-${++n}`;
}

const fixture: Freeter1Data = {
  __structVer: 1,
  freeterVer: '1.2.1',
  projects: [{
    id: 31,
    settings: { name: 'Proj A' },
    layout: {
      selectedTabId: 72,
      tabs: [{
        id: 71,
        name: 'Tab One',
        widgets: [
          { id: 301, type: 'text', title: 'Text', text: 'hello world', col: 0, row: 0, sizeX: 6, sizeY: 8 },
          { id: 302, type: 'link-opener', name: 'My Link', urls: ['https://a.example'], col: 6, row: 0, sizeX: 2, sizeY: 2 },
          {
            id: 303, type: 'to-do-list', title: 'To-Do', col: 0, row: 8, sizeX: 4, sizeY: 4,
            items: [{ id: 1, text: 'task 1', done: true }, { id: 2, text: 'task 2', done: false }],
            doneToBottom: true
          },
          { id: 304, type: 'commander', name: 'Cmds', commands: ['echo hi'], col: 4, row: 8, sizeX: 2, sizeY: 2 },
          { id: 305, type: 'some-unknown', name: 'Mystery', col: 6, row: 8, sizeX: 2, sizeY: 2 }
        ]
      }, {
        id: 72,
        name: 'Tab Two',
        widgets: []
      }]
    }
  }]
};

describe('isFreeter1Data', () => {
  it('detects a Freeter 1 data file', () => {
    expect(isFreeter1Data(fixture)).toBe(true);
  })
  it('rejects v3 backups and junk', () => {
    expect(isFreeter1Data({ version: 1, appSettings: {} })).toBe(false);
    expect(isFreeter1Data(null)).toBe(false);
    expect(isFreeter1Data({ freeterVer: '3.0.0', projects: [] })).toBe(false);
  })
})

describe('convertFreeter1Data', () => {
  it('converts projects, tabs and widgets into v3 entities', () => {
    const res = convertFreeter1Data(fixture, undefined, makeIdGen());
    const state = JSON.parse(res.appJson);

    expect(state.ver).toBe(2);
    const { projects, workflows, widgets } = state.obj.entities;
    expect(Object.keys(projects)).toHaveLength(1);
    expect(Object.keys(workflows)).toHaveLength(2);
    expect(Object.keys(widgets)).toHaveLength(5);

    const project = Object.values(projects)[0] as {
      settings: { name: string }, workflowIds: string[], currentWorkflowId: string
    };
    expect(project.settings.name).toBe('Proj A');
    expect(project.workflowIds).toHaveLength(2);
    // selectedTabId 72 = second tab
    expect(project.currentWorkflowId).toBe(project.workflowIds[1]);

    expect(res.stats).toEqual({ projects: 1, workflows: 2, widgets: 5 });
  })

  it('maps widget types, layout rects and widget data', () => {
    const res = convertFreeter1Data(fixture, undefined, makeIdGen());
    const state = JSON.parse(res.appJson);
    const widgets = Object.values(state.obj.entities.widgets) as {
      id: string, type: string, coreSettings: { name: string }, settings: Record<string, unknown>
    }[];

    const types = widgets.map(w => w.type).sort();
    expect(types).toEqual(['commander', 'link-opener', 'note', 'note', 'to-do-list']);

    const link = widgets.find(w => w.type === 'link-opener');
    expect(link?.settings.urls).toEqual(['https://a.example']);
    expect(link?.coreSettings.name).toBe('My Link');

    const note = widgets.find(w => w.coreSettings.name === 'Text');
    const noteData = res.widgetsData.find(d => d.id === note?.id);
    expect(noteData?.data.note).toBe('hello world');

    const todo = widgets.find(w => w.type === 'to-do-list');
    const todoData = res.widgetsData.find(d => d.id === todo?.id);
    const parsedTodo = JSON.parse(todoData?.data.todo ?? '');
    expect(parsedTodo.items).toEqual([
      { id: 1, text: 'task 1', isDone: true, dueDate: '', priority: 'none' },
      { id: 2, text: 'task 2', isDone: false, dueDate: '', priority: 'none' }
    ]);
    expect(parsedTodo.nextItemId).toBe(3);

    const workflow = (Object.values(state.obj.entities.workflows) as {
      layout: { widgetId: string, rect: { x: number, y: number, w: number, h: number } }[], settings: { name: string }
    }[]).find(w => w.settings.name === 'Tab One');
    expect(workflow?.layout).toHaveLength(5);
    expect(workflow?.layout[0].rect).toEqual({ x: 0, y: 0, w: 6, h: 8 });
  })

  it('merges into existing persistent state without losing projects', () => {
    const existing = JSON.stringify({
      ver: 2,
      obj: {
        entities: {
          projects: { 'EX-P': { id: 'EX-P' } },
          workflows: { 'EX-W': { id: 'EX-W' } },
          widgets: { 'EX-WID': { id: 'EX-WID' } }
        },
        ui: { projectSwitcher: { projectIds: ['EX-P'], currentProjectId: 'EX-P' } }
      }
    });
    const res = convertFreeter1Data(fixture, existing, makeIdGen());
    const state = JSON.parse(res.appJson);

    expect(state.obj.entities.projects['EX-P']).toBeDefined();
    expect(Object.keys(state.obj.entities.projects)).toHaveLength(2);
    expect(state.obj.ui.projectSwitcher.projectIds).toHaveLength(2);
    expect(state.obj.ui.projectSwitcher.projectIds[0]).toBe('EX-P');
    // existing current project is kept
    expect(state.obj.ui.projectSwitcher.currentProjectId).toBe('EX-P');
  })

  it('converts unknown widget types to explanatory notes', () => {
    const res = convertFreeter1Data(fixture, undefined, makeIdGen());
    const state = JSON.parse(res.appJson);
    const widgets = Object.values(state.obj.entities.widgets) as {
      id: string, type: string, coreSettings: { name: string }
    }[];
    const mystery = widgets.find(w => w.coreSettings.name === 'Mystery');
    expect(mystery?.type).toBe('note');
    const data = res.widgetsData.find(d => d.id === mystery?.id);
    expect(data?.data.note).toContain('some-unknown');
  })
})
