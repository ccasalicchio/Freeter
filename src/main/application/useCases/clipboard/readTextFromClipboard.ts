import { ClipboardProvider } from '@/application/interfaces/clipboardProvider';

type Deps = {
  clipboardProvider: ClipboardProvider;
}

export function createReadTextFromClipboardUseCase({ clipboardProvider }: Deps) {
  return function readTextFromClipboardUseCase() {
    return clipboardProvider.readText();
  }
}

export type ReadTextFromClipboardUseCase = ReturnType<typeof createReadTextFromClipboardUseCase>;
