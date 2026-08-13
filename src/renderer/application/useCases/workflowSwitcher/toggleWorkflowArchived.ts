/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { AppStore } from '@/application/interfaces/store';
import { DeactivateWorkflowUseCase } from '@/application/useCases/memSaver/deactivateWorkflow';
import { setCurrentWorkflowSubCase } from '@/application/useCases/project/subs/setCurrentWorkflow';
import { EntityId } from '@/base/entity';
import { getOneFromEntityCollection, updateOneInEntityCollection } from '@/base/entityCollection';

type Deps = {
  appStore: AppStore;
  deactivateWorkflowUseCase: DeactivateWorkflowUseCase;
}

export function createToggleWorkflowArchivedUseCase({
  appStore,
  deactivateWorkflowUseCase,
}: Deps) {
  const useCase = (workflowId: EntityId) => {
    let state = appStore.get();
    const workflow = getOneFromEntityCollection(state.entities.workflows, workflowId);
    if (!workflow) {
      return;
    }
    const newIsArchived = !workflow.settings.isArchived;
    state = {
      ...state,
      entities: {
        ...state.entities,
        workflows: updateOneInEntityCollection(state.entities.workflows, {
          id: workflowId,
          changes: {
            settings: {
              ...workflow.settings,
              isArchived: newIsArchived
            }
          }
        })
      }
    };

    if (newIsArchived) {
      // If the current workflow of the current project gets archived, switch to
      // the first non-archived workflow of the project. If there is none, keep
      // the archived workflow current (same edge-case handling as projects).
      const { currentProjectId } = state.ui.projectSwitcher;
      const currentProject = getOneFromEntityCollection(state.entities.projects, currentProjectId);
      if (currentProject && currentProject.currentWorkflowId === workflowId) {
        const firstNonArchivedId = currentProject.workflowIds.find(
          id => !getOneFromEntityCollection(state.entities.workflows, id)?.settings.isArchived
        );
        if (firstNonArchivedId) {
          state = setCurrentWorkflowSubCase(state, deactivateWorkflowUseCase, currentProjectId, firstNonArchivedId, true);
        }
      }
    }

    appStore.set(state);
  }

  return useCase;
}

export type ToggleWorkflowArchivedUseCase = ReturnType<typeof createToggleWorkflowArchivedUseCase>;
