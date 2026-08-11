import { CreateSettingsState, ReactComponent, SettingsEditorReactComponentProps, SettingBlock, SettingRow, SettingActions } from '@/widgets/appModules';
import { glockenspielArpeggioId, timerEndSoundFiles, timerEndSoundFilesById } from '@/widgets/timer/audio/timer-end';
import { playSvg } from '@/widgets/timer/icons';
import { useAudioFile } from '@/widgets/timer/useAudioFile';
import { useCallback } from 'react';

export interface Settings {
  mode: 'timer' | 'stopwatch';
  mins: number;
  customSecs: number;
  endSound: string;
  endSoundVol: number;
  endDesktop: boolean;
}

interface SelectOption<T> {
  value: T;
  label: string;
}

const timerMinsOptions: SelectOption<number>[] = [];
for (let mins = 5; mins <= 90; mins += 5) {
  timerMinsOptions.push({
    label: mins + ' minutes',
    value: mins
  });
}

const timerCustomOptions: SelectOption<number>[] = [];
for (let secs = 0; secs <= 300; secs += 10) {
  timerCustomOptions.push({
    label: secs + ' seconds',
    value: secs
  });
}

export const endSoundOptions: SelectOption<string>[] = [
  {
    label: '(No Sound)',
    value: ''
  },
  ...timerEndSoundFiles.map(item=>({
    label: item.name,
    value: item.id
  }))
];
const endSoundValues = endSoundOptions.map(item=>item.value);
function isEndSoundValue(val: unknown): val is string {
  if (typeof val !== 'string') {
    return false;
  }

  if (endSoundValues.indexOf(val as string)>-1) {
    return true;
  }

  return false;
}
const defaultEndSound = glockenspielArpeggioId;

const endSoundVolOptions: SelectOption<number>[] = [];
for (let vol = 0; vol <= 100; vol += 10) {
  endSoundVolOptions.push({
    label: vol + '%',
    value: vol
  });
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  mode: (settings.mode === 'timer' || settings.mode === 'stopwatch') ? settings.mode : 'timer',
  mins: typeof settings.mins === 'number' ? settings.mins : 25,
  customSecs: typeof settings.customSecs === 'number' ? settings.customSecs : 0,
  endDesktop: typeof settings.endDesktop === 'boolean' ? settings.endDesktop : true,
  endSound: isEndSoundValue(settings.endSound) ? settings.endSound : defaultEndSound,
  endSoundVol: typeof settings.endSoundVol === 'number' ? settings.endSoundVol : 70,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;
  const endSound = useAudioFile(timerEndSoundFilesById[settings.endSound]?.path || '', settings.endSoundVol);

  const testSoundAction = useCallback(async () => {
    endSound.play();
  }, [endSound])

  return (
    <>
      <SettingBlock
        titleForId='timer-mode'
        title='Mode'
      >
        <select id="timer-mode" value={settings.mode} onChange={e => {
          updateSettings({
            ...settings,
            mode: e.target.value as Settings['mode']
          })
        }}>
          <option value="timer">Timer (countdown)</option>
          <option value="stopwatch">Stopwatch (count up)</option>
        </select>
      </SettingBlock>

      {settings.mode === 'timer' && (
        <SettingBlock
          titleForId='timer-mins'
          title='Duration'
        >
          <select id="timer-mins" value={settings.mins} onChange={e => {
            updateSettings({
              ...settings,
              mins: Number(e.target.value) || 5
            })
          }}>
            {
              timerMinsOptions.map(opt=>(
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))
            }
          </select>
          <div style={{marginTop: 4}}>
            <label style={{fontSize: 11, color: 'var(--freeter-mutedText)'}}>
              Custom seconds:
              <select value={settings.customSecs} onChange={e => updateSettings({...settings, customSecs: Number(e.target.value)})} style={{marginLeft: 4}}>
                {timerCustomOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
          </div>
        </SettingBlock>
      )}

      <SettingBlock
        titleForId='timer-endDesktop'
        title='Desktop Notification'
      >
        <div>
          <label>
            <input type="checkbox" id="timer-endDesktop" checked={settings.endDesktop} onChange={_=>updateSettings({
              ...settings,
              endDesktop: !settings.endDesktop
            })}/>
            {' '}Show notification when timer ends
          </label>
        </div>
      </SettingBlock>

      <SettingBlock
        titleForId='timer-endSound'
        title='Play Sound When Timer Ends'
      >
        <select id="timer-endSound" value={settings.endSound} onChange={e => {
          updateSettings({
            ...settings,
            endSound: e.target.value
          })
        }}>
          {
            endSoundOptions.map(opt=>(
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))
          }
        </select>
      </SettingBlock>

      <SettingBlock
        titleForId='timer-endSoundVol'
        title='End Sound Volume'
      >
        <SettingRow>
          <select id="timer-endSoundVol" value={settings.endSoundVol} onChange={e => {
            updateSettings({
              ...settings,
              endSoundVol: Number(e.target.value) || 80
            })
          }}>
            {
              endSoundVolOptions.map(opt=>(
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))
            }
          </select>
          <SettingActions
            actions={[{
              id: 'TEST-SOUND',
              icon: playSvg,
              title: 'Test Sound',
              doAction: testSoundAction
            }]}
          />
        </SettingRow>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
