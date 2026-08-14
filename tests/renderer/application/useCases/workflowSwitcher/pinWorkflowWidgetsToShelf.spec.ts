/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { createPinWorkflowWidgetsToShelfUseCase, maxWidgetsPinnedPerAction } from '@/application/useCases/workflowSwitcher/pinWorkflowWidgetsToShelf';
import { createAddItemToWidgetListSubCase } from '@/application/useCases/shelf/subs/addItemToWidgetList';
import { createCloneWidgetSubCase } from '@/application/useCases/widget/subs/cloneWidget';
import { IdGenerator } from '@/application/interfaces/idGenerator';
import { AppState } from '@/base/state/app';
import { Widget } from '@/base/widget';
import { WidgetLayoutItem } from '@/base/widgetLayout';
import { fixtureAppState } from '@tests/base/state/fixtures/appState';
import { fixtureAppStore } from '@tests/data/fixtures/appStore';
import { fixtureWidgetA, fixtureWidgetB, fixtureWidgetC } from '@tests/base/fixtures/widget';
import { fixtureWidgetLayoutItemA, fixtureWidgetLayoutItemB } from '@tests/base/fixtures/widgetLayout';
import { fixtureWidgetListItemA } from '@tests/base/fixtures/widgetList';
import { fixtureWorkflowAInColl } from '@tests/base/state/fixtures/entitiesState';
import { fixtureShelf } from '@tests/base/state/fixtures/shelf';

async function setup(initState: AppState) {
  const [appStore] = await fixtureAppStore(initState);
  let widgetIdNum = 0;
  let listItemIdNum = 0;
  const widgetIdGeneratorMock: jest.MockedFn<IdGenerator> = jest.fn().mockImplementation(() => `NEW-W-${++widgetIdNum}`);
  const widgetListItemIdGeneratorMock: jest.MockedFn<IdGenerator> = jest.fn().mockImplementation(() => `NEW-WL-${++listItemIdNum}`);
  const copyObjectDataMock = jest.fn();
  const addItemToWidgetListSubCase = createAddItemToWidgetListSubCase({
    idGenerator: widgetListItemIdGeneratorMock
  })
  const cloneWidgetSubCase = createCloneWidgetSubCase({
    idGenerator: widgetIdGeneratorMock,
    widgetDataStorageManager: {
      copyObjectData: copyObjectDataMock,
      getObject: jest.fn()
    }
  })
  const pinWorkflowWidgetsToShelfUseCase = createPinWorkflowWidgetsToShelfUseCase({
    appStore,
    cloneWidgetSubCase,
    addItemToWidgetListSubCase
  });
  return {
    appStore,
    pinWorkflowWidgetsToShelfUseCase,
    copyObjectDataMock
  }
}

describe('pinWorkflowWidgetsToShelfUseCase()', () => {
  it('should do nothing, if the specified workflow does not exist', async () => {
    const initState = fixtureAppState({
      entities: {
        workflows: fixtureWorkflowAInColl()
      }
    })
    const {
      appStore,
      pinWorkflowWidgetsToShelfUseCase
    } = await setup(initState)
    const expectState = appStore.get();

    await pinWorkflowWidgetsToShelfUseCase('NO-SUCH-ID');

    expect(appStore.get()).toBe(expectState);
  })

  it('should do nothing, if the workflow layout is empty', async () => {
    const idW = 'W';
    const initState = fixtureAppState({
      entities: {
        workflows: fixtureWorkflowAInColl({ id: idW, layout: [] })
      }
    })
    const {
      appStore,
      pinWorkflowWidgetsToShelfUseCase
    } = await setup(initState)
    const expectState = appStore.get();

    await pinWorkflowWidgetsToShelfUseCase(idW);

    expect(appStore.get()).toBe(expectState);
  })

  it('should pin clones of all layout widgets to the end of the Shelf in layout order, keeping the originals in the workflow and keeping their names when free on the Shelf', async () => {
    const idW = 'W';
    const widgetA = fixtureWidgetA();
    const widgetB = fixtureWidgetB();
    const layoutItemA = fixtureWidgetLayoutItemA({ widgetId: widgetA.id });
    const layoutItemB = fixtureWidgetLayoutItemB({ widgetId: widgetB.id });
    const initState = fixtureAppState({
      entities: {
        widgets: {
          [widgetA.id]: widgetA,
          [widgetB.id]: widgetB
        },
        workflows: fixtureWorkflowAInColl({ id: idW, layout: [layoutItemA, layoutItemB] })
      },
      ui: {
        shelf: fixtureShelf({
          widgetList: []
        })
      }
    })
    const widgetAClone: Widget = { ...widgetA, id: 'NEW-W-1' };
    const widgetBClone: Widget = { ...widgetB, id: 'NEW-W-2' };
    const expectState: AppState = {
      ...initState,
      entities: {
        ...initState.entities,
        widgets: {
          ...initState.entities.widgets,
          [widgetAClone.id]: widgetAClone,
          [widgetBClone.id]: widgetBClone
        }
      },
      ui: {
        ...initState.ui,
        shelf: {
          ...initState.ui.shelf,
          widgetList: [
            { id: 'NEW-WL-1', widgetId: widgetAClone.id },
            { id: 'NEW-WL-2', widgetId: widgetBClone.id },
          ]
        }
      }
    }
    const {
      appStore,
      pinWorkflowWidgetsToShelfUseCase,
      copyObjectDataMock
    } = await setup(initState)

    await pinWorkflowWidgetsToShelfUseCase(idW);

    expect(appStore.get()).toEqual(expectState);
    expect(copyObjectDataMock).toBeCalledTimes(2);
    expect(copyObjectDataMock).toHaveBeenNthCalledWith(1, widgetA.id, widgetAClone.id);
    expect(copyObjectDataMock).toHaveBeenNthCalledWith(2, widgetB.id, widgetBClone.id);
  })

  it('should give a clone a unique "Copy" name, when the widget name is already used on the Shelf', async () => {
    const idW = 'W';
    const shelfWidget = fixtureWidgetC({ id: 'W-SHELF', coreSettings: { name: 'Widget A' } });
    const widgetA = fixtureWidgetA({ coreSettings: { name: 'Widget A' } });
    const shelfListItem = fixtureWidgetListItemA({ id: 'WL-SHELF', widgetId: shelfWidget.id });
    const initState = fixtureAppState({
      entities: {
        widgets: {
          [shelfWidget.id]: shelfWidget,
          [widgetA.id]: widgetA
        },
        workflows: fixtureWorkflowAInColl({ id: idW, layout: [fixtureWidgetLayoutItemA({ widgetId: widgetA.id })] })
      },
      ui: {
        shelf: fixtureShelf({
          widgetList: [shelfListItem]
        })
      }
    })
    const {
      appStore,
      pinWorkflowWidgetsToShelfUseCase
    } = await setup(initState)

    await pinWorkflowWidgetsToShelfUseCase(idW);

    const newState = appStore.get();
    expect(newState.ui.shelf.widgetList).toEqual([
      shelfListItem,
      { id: 'NEW-WL-1', widgetId: 'NEW-W-1' }
    ]);
    expect(newState.entities.widgets['NEW-W-1']?.coreSettings.name).toBe('Widget A Copy 1');
  })

  it('should skip widgets already on the Shelf (same widget id) and widgets missing in entities', async () => {
    const idW = 'W';
    const widgetA = fixtureWidgetA();
    const widgetB = fixtureWidgetB();
    const shelfListItem = fixtureWidgetListItemA({ widgetId: widgetA.id });
    const initState = fixtureAppState({
      entities: {
        widgets: {
          [widgetA.id]: widgetA,
          [widgetB.id]: widgetB
        },
        workflows: fixtureWorkflowAInColl({
          id: idW,
          layout: [
            fixtureWidgetLayoutItemA({ widgetId: widgetA.id }), // already on the Shelf
            fixtureWidgetLayoutItemB({ id: 'L-X', widgetId: 'NO-SUCH-WIDGET' }), // missing in entities
            fixtureWidgetLayoutItemB({ widgetId: widgetB.id }),
          ]
        })
      },
      ui: {
        shelf: fixtureShelf({
          widgetList: [shelfListItem]
        })
      }
    })
    const {
      appStore,
      pinWorkflowWidgetsToShelfUseCase,
      copyObjectDataMock
    } = await setup(initState)

    await pinWorkflowWidgetsToShelfUseCase(idW);

    const newState = appStore.get();
    expect(newState.ui.shelf.widgetList).toEqual([
      shelfListItem,
      { id: 'NEW-WL-1', widgetId: 'NEW-W-1' }
    ]);
    expect(newState.entities.widgets['NEW-W-1']).toEqual({ ...widgetB, id: 'NEW-W-1' });
    expect(copyObjectDataMock).toBeCalledTimes(1);
  })

  it('should do nothing, when all layout widgets are already on the Shelf', async () => {
    const idW = 'W';
    const widgetA = fixtureWidgetA();
    const initState = fixtureAppState({
      entities: {
        widgets: {
          [widgetA.id]: widgetA
        },
        workflows: fixtureWorkflowAInColl({ id: idW, layout: [fixtureWidgetLayoutItemA({ widgetId: widgetA.id })] })
      },
      ui: {
        shelf: fixtureShelf({
          widgetList: [fixtureWidgetListItemA({ widgetId: widgetA.id })]
        })
      }
    })
    const {
      appStore,
      pinWorkflowWidgetsToShelfUseCase
    } = await setup(initState)
    const expectState = appStore.get();

    await pinWorkflowWidgetsToShelfUseCase(idW);

    expect(appStore.get()).toBe(expectState);
  })

  it(`should pin at most ${maxWidgetsPinnedPerAction} widgets per action`, async () => {
    const idW = 'W';
    const numWidgets = maxWidgetsPinnedPerAction + 5;
    const widgets: Record<string, Widget> = {};
    const layout: WidgetLayoutItem[] = [];
    for (let i = 0; i < numWidgets; i++) {
      const widget = fixtureWidgetA({ id: `WGT-${i}`, coreSettings: { name: `Widget ${i}` } });
      widgets[widget.id] = widget;
      layout.push(fixtureWidgetLayoutItemA({ id: `L-${i}`, widgetId: widget.id, rect: { x: 0, y: i, w: 1, h: 1 } }));
    }
    const initState = fixtureAppState({
      entities: {
        widgets,
        workflows: fixtureWorkflowAInColl({ id: idW, layout })
      },
      ui: {
        shelf: fixtureShelf({
          widgetList: []
        })
      }
    })
    const {
      appStore,
      pinWorkflowWidgetsToShelfUseCase,
      copyObjectDataMock
    } = await setup(initState)

    await pinWorkflowWidgetsToShelfUseCase(idW);

    const newState = appStore.get();
    expect(newState.ui.shelf.widgetList.length).toBe(maxWidgetsPinnedPerAction);
    expect(copyObjectDataMock).toBeCalledTimes(maxWidgetsPinnedPerAction);
    // the first maxWidgetsPinnedPerAction widgets in layout order got pinned
    expect(newState.ui.shelf.widgetList[0].widgetId).toBe('NEW-W-1');
    expect(newState.entities.widgets['NEW-W-1']?.coreSettings.name).toBe('Widget 0');
    expect(newState.entities.widgets[`NEW-W-${maxWidgetsPinnedPerAction}`]?.coreSettings.name).toBe(`Widget ${maxWidgetsPinnedPerAction - 1}`);
  })
})
