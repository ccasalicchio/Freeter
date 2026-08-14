/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { AppStore } from '@/application/interfaces/store';
import { AddItemToWidgetListSubCase } from '@/application/useCases/shelf/subs/addItemToWidgetList';
import { CloneWidgetSubCase } from '@/application/useCases/widget/subs/cloneWidget';
import { EntityId } from '@/base/entity';
import { addOneToEntityCollection, getOneFromEntityCollection } from '@/base/entityCollection';
import { getAllWidgetNamesFromWidgetList } from '@/base/state/actions/usedNames';
import { generateCopyName } from '@/base/utils';
import { updateWidgetCoreSettings } from '@/base/widget';

/**
 * Max number of widgets pinned to the Shelf per action, to avoid flooding
 * the Shelf when bulk-pinning a big workflow.
 */
export const maxWidgetsPinnedPerAction = 30;

type Deps = {
  appStore: AppStore;
  cloneWidgetSubCase: CloneWidgetSubCase;
  addItemToWidgetListSubCase: AddItemToWidgetListSubCase;
}

export function createPinWorkflowWidgetsToShelfUseCase({
  appStore,
  cloneWidgetSubCase,
  addItemToWidgetListSubCase,
}: Deps) {
  const useCase = async (workflowId: EntityId) => {
    const state = appStore.get();
    const workflow = getOneFromEntityCollection(state.entities.workflows, workflowId);
    if (!workflow) {
      return;
    }

    let { widgetList } = state.ui.shelf;
    let widgets = state.entities.widgets;
    const usedNames = getAllWidgetNamesFromWidgetList(widgets, widgetList);
    // Widget ids already referenced by the Shelf (the Shelf holds widget
    // instances by id); such widgets are skipped instead of pinned twice.
    const widgetIdsOnShelf = new Set(widgetList.map(item => item.widgetId));

    let numPinned = 0;
    for (const layoutItem of workflow.layout) {
      if (numPinned >= maxWidgetsPinnedPerAction) {
        break;
      }
      if (widgetIdsOnShelf.has(layoutItem.widgetId)) {
        continue;
      }
      const widget = getOneFromEntityCollection(widgets, layoutItem.widgetId);
      if (!widget) {
        continue;
      }

      // Same mechanism as the single-widget copy-to-Shelf path: clone the
      // widget entity (incl. its data storage) and add a Shelf list item
      // referencing the clone, keeping the original widget in the workflow.
      const widgetClone = await cloneWidgetSubCase(widget);
      const origName = widget.coreSettings.name;
      const newWidget = updateWidgetCoreSettings(widgetClone, {
        // Keep the original name when it is free on the Shelf; otherwise
        // generate a unique "<name> Copy N" like the paste-to-Shelf path.
        name: usedNames.indexOf(origName) < 0 ? origName : generateCopyName(origName, usedNames)
      });
      widgetList = addItemToWidgetListSubCase(newWidget.id, widgetList, null);
      widgets = addOneToEntityCollection(widgets, newWidget);
      usedNames.push(newWidget.coreSettings.name);
      widgetIdsOnShelf.add(layoutItem.widgetId);
      numPinned++;
    }

    if (numPinned < 1) {
      return;
    }

    appStore.set({
      ...state,
      entities: {
        ...state.entities,
        widgets
      },
      ui: {
        ...state.ui,
        shelf: {
          ...state.ui.shelf,
          widgetList
        }
      }
    });
  }

  return useCase;
}

export type PinWorkflowWidgetsToShelfUseCase = ReturnType<typeof createPinWorkflowWidgetsToShelfUseCase>;
