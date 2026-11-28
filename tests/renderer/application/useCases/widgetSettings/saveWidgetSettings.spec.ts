/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { createSaveWidgetSettingsUseCase } from '@/application/useCases/widgetSettings/saveWidgetSettings';
import { AppState } from '@/base/state/app';
import { fixtureWidgetA, fixtureWidgetEnvAreaShelf } from '@tests/base/fixtures/widget';
import { fixtureAppState } from '@tests/base/state/fixtures/appState';
import { fixtureModalScreens, fixtureModalScreensData } from '@tests/base/state/fixtures/modalScreens';
import { fixtureWidgetSettings } from '@tests/base/state/fixtures/widgetSettings';
import { fixtureAppStore } from '@tests/data/fixtures/appStore';
import { fixtureWidgetTypeA } from '@tests/base/fixtures/widgetType';
import { SafeStorageProvider } from '@/application/interfaces/safeStorageProvider';

function mockSafeStorageProvider(): SafeStorageProvider {
  return {
    encryptString: jest.fn(async (plainText: string) => `CIPHER(${plainText})`),
    decryptString: jest.fn(async () => ''),
  }
}

async function setup(initState: AppState, safeStorageProvider = mockSafeStorageProvider()) {
  const [appStore] = await fixtureAppStore(initState);
  const saveWidgetSettingsUseCase = createSaveWidgetSettingsUseCase({
    appStore,
    safeStorageProvider
  });
  return {
    appStore,
    safeStorageProvider,
    saveWidgetSettingsUseCase
  }
}

function stateWithEditedSecretWidget(editedSettings: Record<string, unknown>, secretSettings: readonly string[] | null = ['token', 'password']) {
  const widgetType = secretSettings ? { ...fixtureWidgetTypeA(), secretSettings } : fixtureWidgetTypeA();
  const widget = fixtureWidgetA({ type: widgetType.id, settings: { token: '', password: '', other: '' } });
  return {
    widget,
    initState: fixtureAppState({
      entities: {
        widgets: { [widget.id]: widget },
        widgetTypes: { [widgetType.id]: widgetType }
      },
      ui: {
        modalScreens: fixtureModalScreens({
          data: fixtureModalScreensData({
            widgetSettings: fixtureWidgetSettings({
              widgetInEnv: {
                widget: { ...widget, settings: editedSettings },
                env: fixtureWidgetEnvAreaShelf()
              }
            })
          }),
          order: ['widgetSettings']
        })
      }
    })
  }
}

describe('saveWidgetSettingsUseCase()', () => {
  it('should do nothing, if widgetInEnv is null', async () => {
    const widget = fixtureWidgetA();
    const initState = fixtureAppState({
      entities: {
        widgets: {
          [widget.id]: widget
        }
      },
      ui: {
        modalScreens: fixtureModalScreens({
          data: fixtureModalScreensData({
            widgetSettings: fixtureWidgetSettings({
              widgetInEnv: null
            })
          }),
          order: ['about', 'widgetSettings']
        })
      }
    })
    const {
      appStore,
      saveWidgetSettingsUseCase
    } = await setup(initState)

    const expectState = appStore.get();
    await saveWidgetSettingsUseCase();

    expect(appStore.get()).toBe(expectState);
  })

  it('should save the settings to Widgets state and reset Widget Settings state', async () => {
    const widget = fixtureWidgetA({
      coreSettings: {
        name: 'Name A'
      },
      settings: {
        setting: 'value'
      }
    });
    const widgetWithNewSettings: typeof widget = {
      ...widget,
      coreSettings: {
        name: 'Name B',
      },
      settings: {
        setting: 'new-value'
      }
    }
    const initState = fixtureAppState({
      entities: {
        widgets: {
          [widget.id]: widget
        }
      },
      ui: {
        modalScreens: fixtureModalScreens({
          data: fixtureModalScreensData({
            widgetSettings: fixtureWidgetSettings({
              widgetInEnv: {
                widget: widgetWithNewSettings,
                env: fixtureWidgetEnvAreaShelf()
              }
            })
          }),
          order: ['about', 'widgetSettings']
        })
      }
    })
    const expectState: AppState = {
      ...initState,
      entities: {
        ...initState.entities,
        widgets: {
          ...initState.entities.widgets,
          [widget.id]: {
            ...initState.entities.widgets[widget.id]!,
            coreSettings: widgetWithNewSettings.coreSettings,
            settings: widgetWithNewSettings.settings,
          }
        }
      },
      ui: {
        ...initState.ui,
        modalScreens: {
          ...initState.ui.modalScreens,
          data: {
            ...initState.ui.modalScreens.data,
            widgetSettings: {
              ...initState.ui.modalScreens.data.widgetSettings,
              widgetInEnv: null
            }
          },
          order: ['about']
        }
      }
    }
    const {
      appStore,
      saveWidgetSettingsUseCase
    } = await setup(initState)

    await saveWidgetSettingsUseCase();

    const newState = appStore.get();
    expect(newState).toEqual(expectState);
  })

  describe('secret settings', () => {
    it('should encrypt the plaintext values of the secret keys declared by the widget type', async () => {
      const { widget, initState } = stateWithEditedSecretWidget({ token: 'tok', password: 'pw', other: 'plain' });
      const { appStore, safeStorageProvider, saveWidgetSettingsUseCase } = await setup(initState);

      await saveWidgetSettingsUseCase();

      expect(appStore.get().entities.widgets[widget.id]!.settings).toEqual({
        token: 'enc:v1:CIPHER(tok)',
        password: 'enc:v1:CIPHER(pw)',
        other: 'plain'
      });
      expect(safeStorageProvider.encryptString).toHaveBeenCalledTimes(2);
      expect(appStore.get().ui.modalScreens.data.widgetSettings.widgetInEnv).toBeNull();
    })

    it('should leave already-encrypted values and empty strings alone', async () => {
      const { widget, initState } = stateWithEditedSecretWidget({ token: 'enc:v1:EXISTING', password: '', other: 'x' });
      const { appStore, safeStorageProvider, saveWidgetSettingsUseCase } = await setup(initState);

      await saveWidgetSettingsUseCase();

      expect(appStore.get().entities.widgets[widget.id]!.settings).toEqual({ token: 'enc:v1:EXISTING', password: '', other: 'x' });
      expect(safeStorageProvider.encryptString).not.toHaveBeenCalled();
    })

    it('should not encrypt keys that are not declared as secret', async () => {
      const { widget, initState } = stateWithEditedSecretWidget({ token: 'tok', password: 'pw', other: 'plain' }, ['token']);
      const { appStore, saveWidgetSettingsUseCase } = await setup(initState);

      await saveWidgetSettingsUseCase();

      expect(appStore.get().entities.widgets[widget.id]!.settings).toEqual({ token: 'enc:v1:CIPHER(tok)', password: 'pw', other: 'plain' });
    })

    it('should not encrypt anything for widget types without secretSettings', async () => {
      const { widget, initState } = stateWithEditedSecretWidget({ token: 'tok', password: 'pw', other: 'plain' }, null);
      const { appStore, safeStorageProvider, saveWidgetSettingsUseCase } = await setup(initState);

      await saveWidgetSettingsUseCase();

      expect(appStore.get().entities.widgets[widget.id]!.settings).toEqual({ token: 'tok', password: 'pw', other: 'plain' });
      expect(safeStorageProvider.encryptString).not.toHaveBeenCalled();
    })

    it('should still save (unencrypted) when the keychain encryption fails', async () => {
      const { widget, initState } = stateWithEditedSecretWidget({ token: 'tok', password: '', other: '' });
      const safeStorageProvider = mockSafeStorageProvider();
      (safeStorageProvider.encryptString as jest.Mock).mockRejectedValue(new Error('no keychain'));
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { appStore, saveWidgetSettingsUseCase } = await setup(initState, safeStorageProvider);

      await saveWidgetSettingsUseCase();

      expect(appStore.get().entities.widgets[widget.id]!.settings).toEqual({ token: 'tok', password: '', other: '' });
      expect(appStore.get().ui.modalScreens.data.widgetSettings.widgetInEnv).toBeNull();
      warn.mockRestore();
    })

    it('should not save, if the settings screen was closed while encrypting', async () => {
      const { widget, initState } = stateWithEditedSecretWidget({ token: 'tok', password: '', other: '' });
      const safeStorageProvider = mockSafeStorageProvider();
      const { appStore, saveWidgetSettingsUseCase } = await setup(initState, safeStorageProvider);
      (safeStorageProvider.encryptString as jest.Mock).mockImplementation(async (text: string) => {
        const st = appStore.get();
        appStore.set({
          ...st,
          ui: {
            ...st.ui,
            modalScreens: {
              ...st.ui.modalScreens,
              data: { ...st.ui.modalScreens.data, widgetSettings: { ...st.ui.modalScreens.data.widgetSettings, widgetInEnv: null } }
            }
          }
        });
        return `CIPHER(${text})`;
      });

      await saveWidgetSettingsUseCase();

      expect(appStore.get().entities.widgets[widget.id]!.settings).toEqual({ token: '', password: '', other: '' });
    })
  })
})
