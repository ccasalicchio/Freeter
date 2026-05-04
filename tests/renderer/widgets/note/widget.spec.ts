import { widgetComp } from '@/widgets/note/widget'
import { screen, waitFor } from '@testing-library/react';
import { SetupWidgetSutOptional, setupWidgetSut } from '@tests/widgets/setupSut'

jest.useFakeTimers();

function setupNoteWidgetSut(optional?: SetupWidgetSutOptional) {
  return setupWidgetSut(widgetComp, { spellCheck: false, markdown: false, renderMode: 'source', fontSize: 14 }, optional);
}

describe('Note Widget', () => {
  it('should show the loading status on start', async () => {
    setupNoteWidgetSut();

    await waitFor(() => {
      expect(screen.getByText('Loading Note...')).toBeInTheDocument();
    })
  })

  it('should hide the loading status after loading data', async () => {
    setupNoteWidgetSut();

    await waitFor(() => {
      expect(screen.getByText('Loading Note...')).toBeInTheDocument();
    })

    await waitFor(() => {
      expect(screen.queryByText('Loading Note...')).not.toBeInTheDocument();
    })
  })

  it('should get the note stored in DataStorage on start', async () => {
    const testNote = 'TEST NOTE';
    const getText = jest.fn().mockResolvedValue(testNote);
    setupNoteWidgetSut({
      mockWidgetApi: {
        dataStorage: {
          getText
        }
      }
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading Note...')).not.toBeInTheDocument();
    })

    expect(getText).toBeCalledWith('note');
  })
})
