
import { useCallback, useMemo, useState } from 'react';
import { UseAppState } from '@/ui/hooks/appState';
import { CloseCommandPaletteUseCase } from '@/application/useCases/commandPalette/closeCommandPalette';

type Deps = {
  useAppState: UseAppState;
  closeCommandPaletteUseCase: CloseCommandPaletteUseCase;
}

interface PaletteItem {
  id: string;
  label: string;
  description: string;
  type: 'project' | 'workflow' | 'widget' | 'action';
  action: () => void;
}

export function createCommandPaletteViewModelHook({
  useAppState,
  closeCommandPaletteUseCase,
}: Deps) {
  function useViewModel() {
    const [search, setSearch] = useState('');
    const [selectedIdx, setSelectedIdx] = useState(0);
    const appState = useAppState(state => state);

    const items = useMemo((): PaletteItem[] => {
      const result: PaletteItem[] = [];
      const { projects, workflows } = appState.entities;
      const { projectIds } = appState.ui.projectSwitcher;

      for (const pId of projectIds) {
        const project = projects[pId];
        if (project) {
          result.push({
            id: `prj-${project.id}`,
            label: project.settings.name || 'Unnamed Project',
            description: 'Switch to project',
            type: 'project',
            action: () => { /* switchProjectUseCase */ }
          });
          for (const wId of project.workflowIds) {
            const workflow = workflows[wId];
            if (workflow) {
              result.push({
                id: `wfl-${workflow.id}`,
                label: `${project.settings.name || 'Project'} › ${workflow.settings.name || 'Workflow'}`,
                description: 'Switch to workflow',
                type: 'workflow',
                action: () => { /* switchWorkflowUseCase */ }
              });
            }
          }
        }
      }

      result.push(
        { id: 'settings', label: 'Settings', description: 'Open application settings', type: 'action', action: () => {} },
        { id: 'projects', label: 'Manage Projects', description: 'Open project manager', type: 'action', action: () => {} },
        { id: 'apps', label: 'Manage Apps', description: 'Open app manager', type: 'action', action: () => {} },
      );

      if (!search) {return result;}
      const lower = search.toLowerCase();
      return result.filter(item =>
        item.label.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower));
    }, [appState, search]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(i => Math.min(i + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && items[selectedIdx]) {
        e.preventDefault();
        items[selectedIdx].action();
        closeCommandPaletteUseCase();
      } else if (e.key === 'Escape') {
        closeCommandPaletteUseCase();
      }
    }, [items, selectedIdx, closeCommandPaletteUseCase]);

    const handleSearchChange = useCallback((val: string) => {
      setSearch(val);
      setSelectedIdx(0);
    }, []);

    return { search, setSearch: handleSearchChange, items, selectedIdx, handleKeyDown, close: closeCommandPaletteUseCase };
  }

  return useViewModel;
}

export type CommandPaletteViewModelHook = ReturnType<typeof createCommandPaletteViewModelHook>;
