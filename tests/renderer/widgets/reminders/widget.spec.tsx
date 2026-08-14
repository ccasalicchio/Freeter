/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Settings } from '@/widgets/reminders/settings';
import { widgetComp } from '@/widgets/reminders/widget'
import { screen, waitFor } from '@testing-library/react';
import { SetupWidgetSutOptional, setupWidgetSut } from '@tests/widgets/setupSut'

const settings: Settings = {};

function fixtureItem(item: Partial<{ id: number; text: string; atIso: string; done: boolean; notified: boolean }>) {
  return {
    id: 1,
    text: 'Some reminder',
    atIso: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    done: false,
    notified: false,
    ...item
  }
}

function setupSut(optional?: SetupWidgetSutOptional) {
  return setupWidgetSut(widgetComp, settings, optional);
}

describe('Reminders Widget', () => {
  it('should show an empty note when nothing is stored', async () => {
    setupSut({
      mockWidgetApi: { dataStorage: { getJson: jest.fn(async () => undefined) } }
    });

    expect(await screen.findByText(/no reminders yet/i)).toBeInTheDocument();
  })

  it('should add a reminder and persist it under the "reminders" key', async () => {
    const setJson = jest.fn();
    const { userEvent, fireEvent } = setupSut({
      mockWidgetApi: { dataStorage: { getJson: jest.fn(async () => undefined), setJson } }
    });

    const textInput = await screen.findByLabelText('Reminder text');
    await userEvent.type(textInput, 'Buy milk');
    fireEvent.change(screen.getByLabelText('Reminder time'), { target: { value: '2030-01-15T09:30' } });
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
    expect(setJson).toBeCalledWith('reminders', {
      items: [{
        id: 1,
        text: 'Buy milk',
        atIso: new Date('2030-01-15T09:30').toISOString(),
        done: false,
        notified: false
      }],
      nextId: 2
    });
  })

  it('should render stored reminders sorted by time', async () => {
    const later = fixtureItem({ id: 1, text: 'Later task', atIso: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() });
    const sooner = fixtureItem({ id: 2, text: 'Sooner task', atIso: new Date(Date.now() + 60 * 60 * 1000).toISOString() });
    setupSut({
      mockWidgetApi: { dataStorage: { getJson: jest.fn(async () => ({ items: [later, sooner], nextId: 3 })) } }
    });

    const soonerEl = await screen.findByText('Sooner task');
    const laterEl = screen.getByText('Later task');
    const position = soonerEl.compareDocumentPosition(laterEl);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  })

  it('should notify a due, not-done, not-notified reminder and persist the notified flag', async () => {
    const show = jest.fn();
    const setJson = jest.fn();
    const due = fixtureItem({ id: 1, text: 'Stand up', atIso: new Date(Date.now() - 60 * 1000).toISOString() });
    setupSut({
      mockWidgetApi: {
        dataStorage: { getJson: jest.fn(async () => ({ items: [due], nextId: 2 })), setJson },
        notification: { show }
      }
    });

    await waitFor(() => expect(show).toBeCalledWith('Reminder', 'Stand up'));
    expect(show).toBeCalledTimes(1);
    expect(setJson).toBeCalledWith('reminders', {
      items: [{ ...due, notified: true }],
      nextId: 2
    });
  })

  it('should not notify done or already-notified reminders', async () => {
    const show = jest.fn();
    const done = fixtureItem({ id: 1, text: 'Done task', atIso: new Date(Date.now() - 60 * 1000).toISOString(), done: true });
    const notified = fixtureItem({ id: 2, text: 'Notified task', atIso: new Date(Date.now() - 60 * 1000).toISOString(), notified: true });
    setupSut({
      mockWidgetApi: {
        dataStorage: { getJson: jest.fn(async () => ({ items: [done, notified], nextId: 3 })) },
        notification: { show }
      }
    });

    expect(await screen.findByText('Notified task')).toBeInTheDocument();
    expect(show).not.toBeCalled();
  })

  it('should toggle done and persist it', async () => {
    const setJson = jest.fn();
    const item = fixtureItem({ id: 1, text: 'Water plants' });
    const { userEvent } = setupSut({
      mockWidgetApi: { dataStorage: { getJson: jest.fn(async () => ({ items: [item], nextId: 2 })), setJson } }
    });

    await screen.findByText('Water plants');
    await userEvent.click(screen.getByLabelText('Done: Water plants'));

    expect(setJson).toBeCalledWith('reminders', {
      items: [{ ...item, done: true }],
      nextId: 2
    });
    expect(screen.getByLabelText('Done: Water plants')).toBeChecked();
  })

  it('should delete a reminder and persist the removal', async () => {
    const setJson = jest.fn();
    const item = fixtureItem({ id: 1, text: 'Old task' });
    const { userEvent } = setupSut({
      mockWidgetApi: { dataStorage: { getJson: jest.fn(async () => ({ items: [item], nextId: 2 })), setJson } }
    });

    await screen.findByText('Old task');
    await userEvent.click(screen.getByTitle('Delete: Old task'));

    expect(setJson).toBeCalledWith('reminders', { items: [], nextId: 2 });
    expect(screen.queryByText('Old task')).not.toBeInTheDocument();
  })

  it('should highlight overdue, not-done reminders', async () => {
    const overdue = fixtureItem({ id: 1, text: 'Overdue task', atIso: new Date(Date.now() - 60 * 1000).toISOString(), notified: true });
    setupSut({
      mockWidgetApi: { dataStorage: { getJson: jest.fn(async () => ({ items: [overdue], nextId: 2 })) } }
    });

    const row = (await screen.findByText('Overdue task')).parentElement!;
    expect(row.className).toContain('row-overdue');
  })
})
