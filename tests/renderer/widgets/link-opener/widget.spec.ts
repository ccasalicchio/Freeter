/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Settings } from '@/widgets/link-opener/settings';
import { widgetComp } from '@/widgets/link-opener/widget'
import { screen } from '@testing-library/react';
import { SetupWidgetSutOptional, setupWidgetSut } from '@tests/widgets/setupSut'
import { fixtureSettings } from './fixtures';
import { faviconUrl } from '@common/infra/network';

function setupSut(settings: Settings, optional?: SetupWidgetSutOptional) {
  const { comp, ...rest } = setupWidgetSut(widgetComp, settings, optional);
  return {
    comp,
    ...rest
  }
}

describe('Link Opener Widget', () => {
  it('should render a "not specified" note, if urls is empty', () => {
    setupSut(fixtureSettings({ urls: [] }));

    expect(screen.getByText(/urls not specified/i)).toBeInTheDocument();
  })

  it('should render a "not specified" note, if all urls are empty strings', () => {
    setupSut(fixtureSettings({ urls: ['', ''] }));

    expect(screen.getByText(/urls not specified/i)).toBeInTheDocument();
  })

  it('should render a button with "Open Link" title, if urls has only one non-empty string', () => {
    setupSut(fixtureSettings({ urls: ['one', ''] }));

    expect(screen.getByRole('button', { name: /open link/i })).toBeInTheDocument();
  })

  it('should render a button with "Open Links" title, if urls has multiple non-empty strings', () => {
    setupSut(fixtureSettings({ urls: ['more', 'than', 'one'] }));

    expect(screen.getByRole('button', { name: /open links/i })).toBeInTheDocument();
  })

  it('should call openExternalUrl for each non-empty urls item with right params, when clicking the open button', async () => {
    const openExternalUrl = jest.fn();
    const { userEvent } = setupSut(
      fixtureSettings({ urls: ['', 'test://url1', 'test://url2'] }),
      {
        mockWidgetApi: {
          shell: {
            openExternalUrl
          }
        }
      }
    );

    await userEvent.click(screen.getByRole('button', { name: /open links/i }))

    expect(openExternalUrl).toBeCalledTimes(2);
    expect(openExternalUrl).toHaveBeenNthCalledWith(1, 'test://url1');
    expect(openExternalUrl).toHaveBeenNthCalledWith(2, 'test://url2');
  })

  describe('favicon icon mode', () => {
    it('should render the favicon of a single URL via the freeter-file favicon protocol', () => {
      const url = 'https://example.com/some/page';
      setupSut(fixtureSettings({ urls: [url], iconMode: 'favicon' }));

      const img = screen.getByRole('button', { name: /open link/i }).querySelector('img');
      expect(img).not.toBeNull();
      expect(img!).toHaveAttribute('src', `freeter-file://favicon/${encodeURIComponent(url)}`);
      expect(img!).toHaveAttribute('src', faviconUrl(url));
    })

    it('should render a per-URL favicon for each URL of a multi-URL tile', () => {
      const urls = ['https://one.example.com/', 'https://two.example.com/page'];
      setupSut(fixtureSettings({ urls, iconMode: 'favicon' }));

      const imgs = screen.getByRole('button', { name: /open links/i }).querySelectorAll('img');
      expect(imgs.length).toBe(2);
      expect(imgs[0]).toHaveAttribute('src', faviconUrl(urls[0]));
      expect(imgs[1]).toHaveAttribute('src', faviconUrl(urls[1]));
    })

    it('should render at most 4 mini-favicons on a multi-URL tile', () => {
      const urls = [1, 2, 3, 4, 5].map(i => `https://site${i}.example.com/`);
      setupSut(fixtureSettings({ urls, iconMode: 'favicon' }));

      const imgs = screen.getByRole('button', { name: /open links/i }).querySelectorAll('img');
      expect(imgs.length).toBe(4);
      expect(Array.from(imgs).map(img => img.getAttribute('src')))
        .toEqual(urls.slice(0, 4).map(faviconUrl));
    })

    it('should still open every URL on click, when showing per-URL favicons', async () => {
      const urls = [1, 2, 3, 4, 5].map(i => `https://site${i}.example.com/`);
      const openExternalUrl = jest.fn();
      const { userEvent } = setupSut(
        fixtureSettings({ urls, iconMode: 'favicon' }),
        { mockWidgetApi: { shell: { openExternalUrl } } }
      );

      await userEvent.click(screen.getByRole('button', { name: /open links/i }))

      expect(openExternalUrl).toBeCalledTimes(5);
      urls.forEach((url, i) => expect(openExternalUrl).toHaveBeenNthCalledWith(i + 1, url));
    })
  })
})
