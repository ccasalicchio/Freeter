import { AppStore } from '@/application/interfaces/store';
import { modalScreensStateActions } from '@/base/state/actions/modalScreens';

type Deps = {
  appStore: AppStore;
}

export function createCloseCommandPaletteUseCase({ appStore }: Deps) {
  return function closeCommandPaletteUseCase() {
    let state = appStore.get();
    state = modalScreensStateActions.closeModalScreen(state, 'commandPalette');
    appStore.set(state);
  }
}

export type CloseCommandPaletteUseCase = ReturnType<typeof createCloseCommandPaletteUseCase>;
