import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  feedUrls: string[];
  maxItems: number;
  refreshIntervalMin: number;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  feedUrls: Array.isArray(settings.feedUrls) ? settings.feedUrls.filter(u => typeof u === 'string') : [],
  maxItems: typeof settings.maxItems === 'number' ? settings.maxItems : 10,
  refreshIntervalMin: typeof settings.refreshIntervalMin === 'number' ? settings.refreshIntervalMin : 15,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;
  return (
    <>
      <SettingBlock
        title='Feed URLs'
        moreInfo='One URL per line. Supports RSS 2.0 and Atom feeds.'
      >
        <div>
          <textarea
            id='rss-feed-urls'
            rows={5}
            value={settings.feedUrls.join('\n')}
            onChange={e => updateSettings({...settings, feedUrls: e.target.value.split('\n').filter(u => u.trim())})}
            placeholder='https://example.com/rss&#10;https://other.com/atom'
          />
        </div>
      </SettingBlock>

      <SettingBlock
        titleForId='rss-max-items'
        title='Max Items per Feed'
        moreInfo='Maximum number of items to show per feed.'
      >
        <select id="rss-max-items" value={settings.maxItems} onChange={e => {
          updateSettings({...settings, maxItems: Number(e.target.value) || 10})
        }}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </SettingBlock>

      <SettingBlock
        titleForId='rss-refresh-interval'
        title='Refresh Interval (minutes)'
        moreInfo='How often to check feeds for new items.'
      >
        <select id="rss-refresh-interval" value={settings.refreshIntervalMin} onChange={e => {
          updateSettings({...settings, refreshIntervalMin: Number(e.target.value) || 15})
        }}>
          <option value={1}>1 minute</option>
          <option value={5}>5 minutes</option>
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={360}>6 hours</option>
          <option value={1440}>24 hours</option>
        </select>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
