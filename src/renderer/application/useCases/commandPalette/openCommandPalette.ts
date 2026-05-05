import { AppStore } from '@/application/interfaces/store';
import { modalScreensStateActions } from '@/base/state/actions/modalScreens';

type Deps = {
  appStore: AppStore;
}

export function createOpenCommandPaletteUseCase({ appStore }: Deps) {
  return function openCommandPaletteUseCase() {
    let state = appStore.get();
    state = modalScreensStateActions.openModalScreen(state, 'commandPalette', undefined);
    appStore.set(state);
  }
}

export type OpenCommandPaletteUseCase = ReturnType<typeof createOpenCommandPaletteUseCase>;
