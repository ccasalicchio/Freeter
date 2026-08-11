interface ParsedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

function parseRss2(doc: XMLDocument, _feedTitle: string): ParsedItem[] {
  const items = doc.querySelectorAll('item');
  return Array.from(items).map(item => {
    const getVal = (sel: string) => item.querySelector(sel)?.textContent?.trim() || '';
    return {
      title: getVal('title'),
      link: getVal('link'),
      description: getVal('description'),
      pubDate: getVal('pubDate'),
    };
  }).filter(item => item.title || item.link);
}

function parseAtom(doc: XMLDocument, _feedTitle: string): ParsedItem[] {
  const entries = doc.querySelectorAll('entry');
  return Array.from(entries).map(entry => {
    const getVal = (sel: string) => entry.querySelector(sel)?.textContent?.trim() || '';
    const linkEl = entry.querySelector('link[href]');
    const link = linkEl?.getAttribute('href') || getVal('link');
    return {
      title: getVal('title'),
      link,
      description: getVal('summary') || getVal('content'),
      pubDate: getVal('published') || getVal('updated'),
    };
  }).filter(item => item.title || item.link);
}

export interface ParsedFeed {
  title: string;
  items: ParsedItem[];
}

export function parseFeed(xmlText: string, url: string): ParsedFeed {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Failed to parse feed XML');
  }

  const feedEl = doc.querySelector('feed');
  if (feedEl) {
    const title = feedEl.querySelector('title')?.textContent?.trim() || url;
    return { title, items: parseAtom(doc, title) };
  }

  const rssEl = doc.querySelector('rss');
  if (rssEl) {
    const title = doc.querySelector('channel > title')?.textContent?.trim() || url;
    return { title, items: parseRss2(doc, title) };
  }

  throw new Error('Unrecognized feed format');
}

export async function fetchFeed(url: string): Promise<ParsedFeed> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const xmlText = await response.text();
  return parseFeed(xmlText, url);
}

export function createFeedItemId(feedUrl: string, itemLink: string, itemTitle: string): string {
  const raw = `${feedUrl}:${itemLink}:${itemTitle}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
