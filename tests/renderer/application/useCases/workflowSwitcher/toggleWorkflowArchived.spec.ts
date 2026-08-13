/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { createToggleWorkflowArchivedUseCase } from '@/application/useCases/workflowSwitcher/toggleWorkflowArchived';
import { AppState } from '@/base/state/app';
import { fixtureWorkflowSettingsA, fixtureWorkflowSettingsB, fixtureWorkflowSettingsC } from '@tests/base/fixtures/workflow';
import { fixtureAppState } from '@tests/base/state/fixtures/appState';
import { fixtureProjectAInColl, fixtureWorkflowAInColl, fixtureWorkflowBInColl, fixtureWorkflowCInColl } from '@tests/base/state/fixtures/entitiesState';
import { fixtureProjectSwitcher } from '@tests/base/state/fixtures/projectSwitcher';
import { fixtureAppStore } from '@tests/data/fixtures/appStore';

async function setup(initState: AppState) {
  const [appStore] = await fixtureAppStore(initState);
  const deactivateWorkflowUseCase = jest.fn();
  const toggleWorkflowArchivedUseCase = createToggleWorkflowArchivedUseCase({
    appStore,
    deactivateWorkflowUseCase
  });
  return {
    appStore,
    toggleWorkflowArchivedUseCase
  }
}

describe('toggleWorkflowArchivedUseCase()', () => {
  it('should do nothing, if the specified workflow does not exist', async () => {
    const initState = fixtureAppState({
      entities: {
        workflows: fixtureWorkflowAInColl()
      },
    })
    const {
      appStore,
      toggleWorkflowArchivedUseCase
    } = await setup(initState)
    const expectState = appStore.get();

    toggleWorkflowArchivedUseCase('NO-SUCH-ID');

    expect(appStore.get()).toBe(expectState);
  })

  it('should set isArchived=true for a non-archived workflow and keep the current workflow, when archiving a non-current workflow', async () => {
    const idP = 'P';
    const idWA = 'W-A';
    const idWB = 'W-B';
    const initState = fixtureAppState({
      entities: {
        projects: fixtureProjectAInColl({ id: idP, workflowIds: [idWA, idWB], currentWorkflowId: idWA }),
        workflows: {
          ...fixtureWorkflowAInColl({ id: idWA, settings: fixtureWorkflowSettingsA() }),
          ...fixtureWorkflowBInColl({ id: idWB, settings: fixtureWorkflowSettingsB() }),
        }
      },
      ui: {
        projectSwitcher: fixtureProjectSwitcher({
          projectIds: [idP],
          currentProjectId: idP
        })
      }
    })
    const {
      appStore,
      toggleWorkflowArchivedUseCase
    } = await setup(initState)

    toggleWorkflowArchivedUseCase(idWB);

    const newState = appStore.get();
    expect(newState.entities.workflows[idWB]?.settings.isArchived).toBe(true);
    expect(newState.entities.projects[idP]?.currentWorkflowId).toBe(idWA);
  })

  it('should set isArchived=false, when the workflow is already archived', async () => {
    const idWA = 'W-A';
    const initState = fixtureAppState({
      entities: {
        workflows: fixtureWorkflowAInColl({ id: idWA, settings: fixtureWorkflowSettingsA({ isArchived: true }) })
      }
    })
    const {
      appStore,
      toggleWorkflowArchivedUseCase
    } = await setup(initState)

    toggleWorkflowArchivedUseCase(idWA);

    expect(appStore.get().entities.workflows[idWA]?.settings.isArchived).toBe(false);
  })

  it('should switch to the first non-archived workflow of the project, when archiving the current workflow', async () => {
    const idP = 'P';
    const idWA = 'W-A';
    const idWB = 'W-B';
    const idWC = 'W-C';
    const initState = fixtureAppState({
      entities: {
        projects: fixtureProjectAInColl({ id: idP, workflowIds: [idWA, idWB, idWC], currentWorkflowId: idWB }),
        workflows: {
          ...fixtureWorkflowAInColl({ id: idWA, settings: fixtureWorkflowSettingsA({ isArchived: true }) }),
          ...fixtureWorkflowBInColl({ id: idWB, settings: fixtureWorkflowSettingsB() }),
          ...fixtureWorkflowCInColl({ id: idWC, settings: fixtureWorkflowSettingsC() }),
        }
      },
      ui: {
        projectSwitcher: fixtureProjectSwitcher({
          projectIds: [idP],
          currentProjectId: idP
        })
      }
    })
    const {
      appStore,
      toggleWorkflowArchivedUseCase
    } = await setup(initState)

    toggleWorkflowArchivedUseCase(idWB);

    const newState = appStore.get();
    expect(newState.entities.workflows[idWB]?.settings.isArchived).toBe(true);
    // W-A is archived, so the first non-archived workflow is W-C
    expect(newState.entities.projects[idP]?.currentWorkflowId).toBe(idWC);
  })

  it('should keep the archived workflow current, when archiving the current workflow and there is no non-archived workflow left', async () => {
    const idP = 'P';
    const idWA = 'W-A';
    const idWB = 'W-B';
    const initState = fixtureAppState({
      entities: {
        projects: fixtureProjectAInColl({ id: idP, workflowIds: [idWA, idWB], currentWorkflowId: idWB }),
        workflows: {
          ...fixtureWorkflowAInColl({ id: idWA, settings: fixtureWorkflowSettingsA({ isArchived: true }) }),
          ...fixtureWorkflowBInColl({ id: idWB, settings: fixtureWorkflowSettingsB() }),
        }
      },
      ui: {
        projectSwitcher: fixtureProjectSwitcher({
          projectIds: [idP],
          currentProjectId: idP
        })
      }
    })
    const {
      appStore,
      toggleWorkflowArchivedUseCase
    } = await setup(initState)

    toggleWorkflowArchivedUseCase(idWB);

    const newState = appStore.get();
    expect(newState.entities.workflows[idWB]?.settings.isArchived).toBe(true);
    expect(newState.entities.projects[idP]?.currentWorkflowId).toBe(idWB);
  })
})
