/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { AppStore } from '@/application/interfaces/store';
import { SafeStorageProvider } from '@/application/interfaces/safeStorageProvider';
import { entityStateActions, modalScreensStateActions } from '@/base/state/actions';
import { WidgetSettings } from '@/base/widget';
import { encryptSecretSettings, needsSecretEncryption } from '@common/base/secretSetting';

type Deps = {
  appStore: AppStore;
  safeStorageProvider: SafeStorageProvider;
}

export function createSaveWidgetSettingsUseCase({
  appStore,
  safeStorageProvider,
}: Deps) {
  /**
   * Commits the edited widget settings. Secret settings declared by the widget
   * type (`secretSettings`) are encrypted here, once, before they reach the
   * persisted state; legacy plaintext values migrate on the next save.
   */
  const useCase = async () => {
    const { widgetInEnv } = appStore.get().ui.modalScreens.data.widgetSettings;
    if (!widgetInEnv) {
      return;
    }
    const { widget } = widgetInEnv;
    let settings: WidgetSettings = widget.settings;

    const secretKeys = appStore.get().entities.widgetTypes[widget.type]?.secretSettings ?? [];
    if (secretKeys.some(key => needsSecretEncryption(settings[key]))) {
      try {
        settings = await encryptSecretSettings(settings, secretKeys, plainText => safeStorageProvider.encryptString(plainText));
      } catch (err) {
        // keychain unavailable: keep the legacy (plaintext) behaviour rather than losing the user's input
        console.warn('Could not encrypt secret widget settings; saving them unencrypted', err);
      }
      // the modal may have been closed or switched to another widget during the async encryption
      if (appStore.get().ui.modalScreens.data.widgetSettings.widgetInEnv?.widget.id !== widget.id) {
        return;
      }
    }

    let state = appStore.get();
    state = entityStateActions.widgets.updateOne(state, {
      id: widget.id,
      changes: {
        coreSettings: widget.coreSettings,
        settings
      }
    })
    state = modalScreensStateActions.closeModalScreen(state, 'widgetSettings');
    appStore.set(state);
  }

  return useCase;
}

export type SaveWidgetSettingsUseCase = ReturnType<typeof createSaveWidgetSettingsUseCase>;
