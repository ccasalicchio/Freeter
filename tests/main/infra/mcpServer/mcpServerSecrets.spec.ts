/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { DataStorage } from '@common/application/interfaces/dataStorage';
import { createObjectManager } from '@common/base/objectManager';
import { createFreeterMcpServer } from '@/infra/mcpServer/mcpServer';

function createMemoryStorage(initial: Record<string, string> = {}): DataStorage {
  const items: Record<string, string> = { ...initial };
  return {
    getText: async key => items[key],
    setText: async (key, text) => {
      items[key] = text;
    },
    deleteItem: async key => {
      delete items[key];
    },
    clear: async () => {
      for (const key of Object.keys(items)) {
        delete items[key];
      }
    },
    getKeys: async () => Object.keys(items),
  }
}

function fixtureAppJson() {
  return JSON.stringify({
    ver: 2,
    obj: {
      entities: {
        projects: { P1: { id: 'P1', settings: { name: 'Alpha' }, workflowIds: ['W1'], currentWorkflowId: 'W1' } },
        workflows: { W1: { id: 'W1', settings: { name: 'Main' }, layout: [{ id: 'L1', widgetId: 'CI1', rect: { x: 0, y: 0, w: 2, h: 2 } }] } },
        widgets: {
          CI1: { id: 'CI1', type: 'github-ci', coreSettings: { name: 'CI' }, settings: { repo: 'a/b', token: '' } },
          INBOX: { id: 'INBOX', type: 'alert-inbox', coreSettings: { name: 'Inbox' }, settings: { token: 'ingest-secret' } },
        },
      },
      ui: { projectSwitcher: { projectIds: ['P1'], currentProjectId: 'P1' } }
    }
  });
}

const mcpToken = 'test-mcp-token';

async function setup() {
  const appDataStorage = createMemoryStorage({ app: fixtureAppJson() });
  const encryptString = jest.fn((plainText: string) => `CIPHER(${plainText})`);
  const server = createFreeterMcpServer({
    appDataStorage,
    widgetDataStorageManager: createObjectManager(async () => createMemoryStorage(), async () => true),
    reloadRenderer: jest.fn(),
    safeStorageProvider: { encryptString },
  });
  const port = 40000 + Math.floor(Math.random() * 20000);
  server.start({ enabled: true, port, token: mcpToken });
  // wait for the listener
  await new Promise(resolve => setTimeout(resolve, 50));
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
    requestInit: { headers: { Authorization: `Bearer ${mcpToken}` } }
  }));
  const readWidgets = async () => JSON.parse((await appDataStorage.getText('app'))!).obj.entities.widgets;
  return {
    client,
    encryptString,
    readWidgets,
    teardown: async () => {
      await client.close();
      server.stop();
    }
  };
}

describe('MCP server: secret widget settings', () => {
  it('freeter_update_widget should write the secret keys encrypted', async () => {
    const { client, encryptString, readWidgets, teardown } = await setup();
    try {
      const res = await client.callTool({ name: 'freeter_update_widget', arguments: { widgetId: 'CI1', settings: { token: 'ghp_secret', branch: 'main' } } });
      expect(res.isError).toBeFalsy();

      const widgets = await readWidgets();
      expect(widgets.CI1.settings).toEqual({ repo: 'a/b', token: 'enc:v1:CIPHER(ghp_secret)', branch: 'main' });
      expect(encryptString).toHaveBeenCalledWith('ghp_secret');
    } finally {
      await teardown();
    }
  })

  it('freeter_create_widget should write the secret keys encrypted', async () => {
    const { client, readWidgets, teardown } = await setup();
    try {
      const res = await client.callTool({ name: 'freeter_create_widget', arguments: { workflowId: 'W1', type: 'github-prs', name: 'PRs', settings: { repo: 'a/b', token: 'ghp_new' } } });
      expect(res.isError).toBeFalsy();

      const widgets = await readWidgets();
      const created = Object.values(widgets as Record<string, { type: string; settings: Record<string, unknown> }>).find(w => w.type === 'github-prs');
      expect(created?.settings).toEqual({ repo: 'a/b', token: 'enc:v1:CIPHER(ghp_new)' });
    } finally {
      await teardown();
    }
  })

  it('freeter_get_widget should keep masking an encrypted token', async () => {
    const { client, teardown } = await setup();
    try {
      await client.callTool({ name: 'freeter_update_widget', arguments: { widgetId: 'CI1', settings: { token: 'ghp_secret' } } });
      const res = await client.callTool({ name: 'freeter_get_widget', arguments: { widgetId: 'CI1' } });
      const text = (res.content as { text: string }[])[0].text;
      expect(JSON.parse(text).settings.token).toBe('***');
      expect(text).not.toContain('CIPHER');
    } finally {
      await teardown();
    }
  })

  it('should leave the alert-inbox ingest token as plaintext', async () => {
    const { client, encryptString, readWidgets, teardown } = await setup();
    try {
      await client.callTool({ name: 'freeter_update_widget', arguments: { widgetId: 'INBOX', settings: { token: 'new-ingest-secret' } } });

      const widgets = await readWidgets();
      expect(widgets.INBOX.settings.token).toBe('new-ingest-secret');
      expect(encryptString).not.toHaveBeenCalled();
    } finally {
      await teardown();
    }
  })
})
