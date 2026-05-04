import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  imagePath: string;
  fitMode: 'cover' | 'contain' | 'fill' | 'none';
  slideshowEnabled: boolean;
  slideshowIntervalSec: number;
  slideshowFolder: string;
}

export const fitModes = ['cover', 'contain', 'fill', 'none'] as const;

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  imagePath: typeof settings.imagePath === 'string' ? settings.imagePath : '',
  fitMode: fitModes.includes(settings.fitMode as typeof fitModes[number]) ? settings.fitMode as Settings['fitMode'] : 'contain',
  slideshowEnabled: typeof settings.slideshowEnabled === 'boolean' ? settings.slideshowEnabled : false,
  slideshowIntervalSec: typeof settings.slideshowIntervalSec === 'number' ? settings.slideshowIntervalSec : 5,
  slideshowFolder: typeof settings.slideshowFolder === 'string' ? settings.slideshowFolder : '',
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;
  return (
    <>
      <SettingBlock
        titleForId='img-media-fit-mode'
        title='Fit Mode'
        moreInfo='Controls how the image fits in the widget area.'
      >
        <select id="img-media-fit-mode" value={settings.fitMode} onChange={e => {
          updateSettings({
            ...settings,
            fitMode: e.target.value as Settings['fitMode']
          })
        }}>
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
          <option value="none">None</option>
        </select>
      </SettingBlock>

      <SettingBlock
        titleForId='img-media-image-path'
        title='Image Path'
        moreInfo='Path to the image file to display.'
      >
        <div>
          <input
            id="img-media-image-path"
            type="text"
            value={settings.imagePath}
            placeholder='/path/to/image.jpg'
            onChange={e => updateSettings({...settings, imagePath: e.target.value})}
          />
        </div>
      </SettingBlock>

      <SettingBlock
        titleForId='img-media-slideshow-enabled'
        title='Slideshow'
        moreInfo='Enable slideshow mode to rotate through images in a folder.'
      >
        <div>
          <label>
            <input type="checkbox" id="img-media-slideshow-enabled" checked={settings.slideshowEnabled} onChange={_=>updateSettings({
              ...settings,
              slideshowEnabled: !settings.slideshowEnabled
            })}/>
            Enable Slideshow
          </label>
        </div>
      </SettingBlock>

      {settings.slideshowEnabled && (
        <SettingBlock
          titleForId='img-media-slideshow-folder'
          title='Slideshow Folder'
          moreInfo='Path to a folder containing images for the slideshow.'
        >
          <div>
            <input
              id="img-media-slideshow-folder"
              type="text"
              value={settings.slideshowFolder}
              placeholder='/path/to/images/'
              onChange={e => updateSettings({...settings, slideshowFolder: e.target.value})}
            />
          </div>
        </SettingBlock>
      )}

      {settings.slideshowEnabled && (
        <SettingBlock
          titleForId='img-media-slideshow-interval'
          title='Slideshow Interval (seconds)'
          moreInfo='How long each image is displayed before advancing.'
        >
          <select id="img-media-slideshow-interval" value={settings.slideshowIntervalSec} onChange={e => {
            updateSettings({
              ...settings,
              slideshowIntervalSec: Number(e.target.value) || 5
            })
          }}>
            <option value={2}>2 seconds</option>
            <option value={3}>3 seconds</option>
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
          </select>
        </SettingBlock>
      )}
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
