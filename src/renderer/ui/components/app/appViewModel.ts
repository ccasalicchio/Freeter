/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ShowContextMenuUseCase } from '@/application/useCases/contextMenu/showContextMenu';
import { contextMenuForTextInput } from '@/base/contextMenu';
import { resolveUiThemeId } from '@/base/uiTheme';
import { UseAppState } from '@/ui/hooks/appState';
import React, { ReactNode, createElement, useEffect, useMemo } from 'react';
import { CommandPalette, PaletteItem } from '@/ui/components/commandPalette/commandPalette';
import { CloseCommandPaletteUseCase } from '@/application/useCases/commandPalette/closeCommandPalette';

type Deps = {
  useAppState: UseAppState;
  WidgetSettings: React.FC;
  WorkflowSettings: React.FC;
  AppManager: React.FC;
  ProjectManager: React.FC;
  ApplicationSettings: React.FC;
  About: React.FC;
  showContextMenuUseCase: ShowContextMenuUseCase;
  closeCommandPaletteUseCase: CloseCommandPaletteUseCase;
  switchProjectUseCase: (projectId: string) => void;
  switchWorkflowUseCase: (projectId: string, workflowId: string) => void;
  toggleEditModeUseCase: () => void;
  openApplicationSettingsUseCase: () => void;
  openProjectManagerUseCase: () => void;
  openAppManagerUseCase: () => void;
}

export function createAppViewModelHook({
  useAppState,
  WidgetSettings,
  WorkflowSettings,
  ProjectManager,
  AppManager,
  ApplicationSettings,
  About,
  showContextMenuUseCase,
  closeCommandPaletteUseCase,
  switchProjectUseCase,
  switchWorkflowUseCase,
  toggleEditModeUseCase,
  openApplicationSettingsUseCase,
  openProjectManagerUseCase,
  openAppManagerUseCase,
}: Deps) {
  function useViewModel() {
    const [
      editMode,
      projectIds,
      currentProjectId,
      projects,
      workflows,
      modalScreensOrder,
      uiTheme,
      themeOverrides,
      shortcuts,
      hasTopBar
    ] = useAppState(state => [
      state.ui.editMode,
      state.ui.projectSwitcher.projectIds,
      state.ui.projectSwitcher.currentProjectId,
      state.entities.projects,
      state.entities.workflows,
      state.ui.modalScreens.order,
      state.ui.appConfig.uiTheme,
      state.ui.appConfig.themeOverrides,
      state.ui.appConfig.shortcuts,
      state.ui.topBar
    ])

    const projectList = useAppState.useEntityList(state => state.entities.projects, projectIds);
    const hasProjects = projectList.length > 0;
    const currentWorkflow = workflows[projects[currentProjectId]?.currentWorkflowId || ''];
    const showPalette = editMode && !!currentWorkflow;

    const modalScreenComps: Record<string, ReactNode> = {
      about: createElement(About, {}),
      applicationSettings: createElement(ApplicationSettings, {}),
      appManager: createElement(AppManager, {}),
      projectManager: createElement(ProjectManager, {}),
      widgetSettings: createElement(WidgetSettings, {}),
      workflowSettings: createElement(WorkflowSettings, {}),
    }

    // keyboard shortcuts, configurable in Settings > Shortcuts
    useEffect(() => {
      const ctrl = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;
      const matchesProject = (e: KeyboardEvent) =>
        shortcuts.projectSwitch === 'ctrl' ? (ctrl(e) && !e.altKey && !e.shiftKey)
          : shortcuts.projectSwitch === 'ctrl+shift' ? (ctrl(e) && !e.altKey && e.shiftKey)
            : false;
      const matchesWorkflow = (e: KeyboardEvent) =>
        shortcuts.workflowSwitch === 'alt' ? (e.altKey && !ctrl(e) && !e.shiftKey)
          : shortcuts.workflowSwitch === 'alt+shift' ? (e.altKey && !ctrl(e) && e.shiftKey)
            : false;
      const onKeyDown = (e: KeyboardEvent) => {
        if (shortcuts.editModeToggle === 'ctrl+e' && ctrl(e) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'e') {
          e.preventDefault();
          toggleEditModeUseCase();
          return;
        }
        const num = Number(e.key);
        if (!Number.isInteger(num) || num < 1 || num > 9) {
          return;
        }
        if (matchesProject(e)) {
          const visibleIds = projectIds.filter(id => !projects[id]?.settings.isArchived);
          const projectId = visibleIds[num - 1];
          if (projectId) {
            e.preventDefault();
            switchProjectUseCase(projectId);
          }
        } else if (matchesWorkflow(e)) {
          const workflowId = projects[currentProjectId]?.workflowIds[num - 1];
          if (workflowId) {
            e.preventDefault();
            switchWorkflowUseCase(currentProjectId, workflowId);
          }
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [projectIds, projects, currentProjectId, shortcuts]);

    const paletteItems = useMemo((): PaletteItem[] => {
      const result: PaletteItem[] = [];

      for (const pId of projectIds) {
        const project = projects[pId];
        if (project && !project.settings.isArchived) {
          result.push({
            id: `prj-${project.id}`,
            label: project.settings.name || 'Unnamed Project',
            description: 'Switch to project',
            type: 'project',
            action: () => {},
          });
          for (const wId of project.workflowIds) {
            const workflow = workflows[wId];
            if (workflow) {
              result.push({
                id: `wfl-${workflow.id}`,
                label: `${project.settings.name || 'Project'} › ${workflow.settings.name || 'Workflow'}`,
                description: 'Switch to workflow',
                type: 'workflow',
                action: () => {},
              });
            }
          }
        }
      }

      result.push(
        { id: 'settings', label: 'Settings', description: 'Open application settings', type: 'action', action: () => openApplicationSettingsUseCase() },
        { id: 'projects-mgr', label: 'Manage Projects', description: 'Open project manager', type: 'action', action: () => openProjectManagerUseCase() },
        { id: 'apps-mgr', label: 'Manage Apps', description: 'Open app manager', type: 'action', action: () => openAppManagerUseCase() },
      );
      return result;
    }, [projects, workflows, projectIds]);

    const modalScreens = modalScreensOrder.map((id, idx, arr) => {
      if (id === 'commandPalette') {
        const comp = createElement(CommandPalette, { items: paletteItems, onClose: () => closeCommandPaletteUseCase() });
        return { id, comp, isLast: idx === arr.length - 1 };
      }
      if (modalScreenComps[id]) {
        return { id, comp: modalScreenComps[id], isLast: idx === arr.length - 1 };
      } else {
        return null
      }
    })
    const hasModalScreens = modalScreens.length > 0;

    const contextMenuHandler: React.MouseEventHandler<HTMLDivElement> = (e) => {
      const node = e.target as HTMLElement | null;

      switch (node?.nodeName.toLowerCase()) {
        case 'input':
        case 'textarea': {
          showContextMenuUseCase(contextMenuForTextInput);
          break;
        }
      }
    }

    const uiThemeId = resolveUiThemeId(uiTheme);
    return {
      showPalette,
      hasProjects,
      modalScreens,
      hasModalScreens,
      contextMenuHandler,
      uiThemeId,
      themeOverrides,
      hasTopBar
    }
  }

  return useViewModel;
}

export type AppViewModelHook = ReturnType<typeof createAppViewModelHook>;
export type AppViewModel = ReturnType<AppViewModelHook>;
