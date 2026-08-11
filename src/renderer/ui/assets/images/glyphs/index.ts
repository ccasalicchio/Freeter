/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 *
 * Glyphs from IcoMoon-Free (https://github.com/Keyamoon/IcoMoon-Free), GPL license.
 */

import bellGlyphSvg from './bell.svg';
import bookGlyphSvg from './book.svg';
import bookmarkGlyphSvg from './bookmark.svg';
import briefcaseGlyphSvg from './briefcase.svg';
import bugGlyphSvg from './bug.svg';
import calendarGlyphSvg from './calendar.svg';
import cameraGlyphSvg from './camera.svg';
import cartGlyphSvg from './cart.svg';
import clockGlyphSvg from './clock.svg';
import cloudGlyphSvg from './cloud.svg';
import cogGlyphSvg from './cog.svg';
import databaseGlyphSvg from './database.svg';
import fireGlyphSvg from './fire.svg';
import flagGlyphSvg from './flag.svg';
import folderGlyphSvg from './folder.svg';
import giftGlyphSvg from './gift.svg';
import heartGlyphSvg from './heart.svg';
import homeGlyphSvg from './home.svg';
import keyGlyphSvg from './key.svg';
import linkGlyphSvg from './link.svg';
import lockGlyphSvg from './lock.svg';
import mapGlyphSvg from './map.svg';
import musicGlyphSvg from './music.svg';
import pencilGlyphSvg from './pencil.svg';
import phoneGlyphSvg from './phone.svg';
import rocketGlyphSvg from './rocket.svg';
import shieldGlyphSvg from './shield.svg';
import starFullGlyphSvg from './star-full.svg';
import terminalGlyphSvg from './terminal.svg';
import trophyGlyphSvg from './trophy.svg';
import videoCameraGlyphSvg from './video-camera.svg';

export interface Glyph { id: string; name: string; svg: string }

export const glyphs: Glyph[] = [
  { id: 'bell', name: 'Bell', svg: bellGlyphSvg },
  { id: 'book', name: 'Book', svg: bookGlyphSvg },
  { id: 'bookmark', name: 'Bookmark', svg: bookmarkGlyphSvg },
  { id: 'briefcase', name: 'Briefcase', svg: briefcaseGlyphSvg },
  { id: 'bug', name: 'Bug', svg: bugGlyphSvg },
  { id: 'calendar', name: 'Calendar', svg: calendarGlyphSvg },
  { id: 'camera', name: 'Camera', svg: cameraGlyphSvg },
  { id: 'cart', name: 'Cart', svg: cartGlyphSvg },
  { id: 'clock', name: 'Clock', svg: clockGlyphSvg },
  { id: 'cloud', name: 'Cloud', svg: cloudGlyphSvg },
  { id: 'cog', name: 'Cog', svg: cogGlyphSvg },
  { id: 'database', name: 'Database', svg: databaseGlyphSvg },
  { id: 'fire', name: 'Fire', svg: fireGlyphSvg },
  { id: 'flag', name: 'Flag', svg: flagGlyphSvg },
  { id: 'folder', name: 'Folder', svg: folderGlyphSvg },
  { id: 'gift', name: 'Gift', svg: giftGlyphSvg },
  { id: 'heart', name: 'Heart', svg: heartGlyphSvg },
  { id: 'home', name: 'Home', svg: homeGlyphSvg },
  { id: 'key', name: 'Key', svg: keyGlyphSvg },
  { id: 'link', name: 'Link', svg: linkGlyphSvg },
  { id: 'lock', name: 'Lock', svg: lockGlyphSvg },
  { id: 'map', name: 'Map', svg: mapGlyphSvg },
  { id: 'music', name: 'Music', svg: musicGlyphSvg },
  { id: 'pencil', name: 'Pencil', svg: pencilGlyphSvg },
  { id: 'phone', name: 'Phone', svg: phoneGlyphSvg },
  { id: 'rocket', name: 'Rocket', svg: rocketGlyphSvg },
  { id: 'shield', name: 'Shield', svg: shieldGlyphSvg },
  { id: 'star-full', name: 'Star Full', svg: starFullGlyphSvg },
  { id: 'terminal', name: 'Terminal', svg: terminalGlyphSvg },
  { id: 'trophy', name: 'Trophy', svg: trophyGlyphSvg },
  { id: 'video-camera', name: 'Video Camera', svg: videoCameraGlyphSvg },
];

export const glyphsById = Object.fromEntries(glyphs.map(g => [g.id, g]));

