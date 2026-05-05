// Hello World plugin for Freeter
// This is an example plugin that creates a simple greeting widget.

const widgetType = {
  id: 'hello-world',
  name: 'Hello World',
  icon: '',
  minSize: { w: 2, h: 2 },
  description: 'A simple Hello World plugin widget',
  maximizable: true,
  createSettingsState: (settings) => ({
    name: settings.name || 'World',
    greeting: settings.greeting || 'Hello',
  }),
  settingsEditorComp: {
    type: 'react',
    Comp: function HelloSettings({ settings, settingsApi }) {
      const { updateSettings } = settingsApi;
      return React.createElement('div', null,
        React.createElement('label', null, 'Greeting: ',
          React.createElement('input', {
            type: 'text',
            value: settings.greeting,
            onChange: (e) => updateSettings({ ...settings, greeting: e.target.value }),
          })
        ),
        React.createElement('label', null, 'Name: ',
          React.createElement('input', {
            type: 'text',
            value: settings.name,
            onChange: (e) => updateSettings({ ...settings, name: e.target.value }),
          })
        )
      );
    }
  },
  widgetComp: {
    type: 'react',
    Comp: function HelloWidget({ settings }) {
      return React.createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'var(--freeter-componentColor)',
        }
      }, `${settings.greeting}, ${settings.name}!`);
    }
  },
  requiresApi: [],
};

export default widgetType;
