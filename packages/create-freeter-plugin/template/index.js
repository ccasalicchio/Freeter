// My Freeter Plugin
// This widget displays a customizable greeting.

const widgetType = {
  id: 'my-plugin-widget',
  name: 'My Plugin Widget',
  icon: '',
  minSize: { w: 2, h: 2 },
  description: 'A widget created from the plugin starter template.',
  maximizable: true,
  createSettingsState: (settings) => ({
    message: settings.message || 'Hello from my plugin!',
  }),
  settingsEditorComp: {
    type: 'react',
    Comp: function Settings({ settings, settingsApi }) {
      return React.createElement('div', null,
        React.createElement('label', null, 'Message: ',
          React.createElement('input', {
            type: 'text',
            value: settings.message,
            onChange: (e) => settingsApi.updateSettings({ ...settings, message: e.target.value }),
          })
        )
      );
    }
  },
  widgetComp: {
    type: 'react',
    Comp: function Widget({ settings }) {
      return React.createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '16px',
          fontSize: '16px',
          textAlign: 'center',
          color: 'var(--freeter-componentColor)',
        }
      }, settings.message);
    }
  },
  requiresApi: [],
};

export default widgetType;
