/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 *
 * Icon sets: IcoMoon-Free (GPL), Tabler Icons (MIT), Bootstrap Icons (MIT).
 */

import imBellSvg from './bell.svg';
import imBookSvg from './book.svg';
import imBookmarkSvg from './bookmark.svg';
import imBriefcaseSvg from './briefcase.svg';
import imBugSvg from './bug.svg';
import imCalendarSvg from './calendar.svg';
import imCameraSvg from './camera.svg';
import imCartSvg from './cart.svg';
import imClockSvg from './clock.svg';
import imCloudSvg from './cloud.svg';
import imCogSvg from './cog.svg';
import imDatabaseSvg from './database.svg';
import imFireSvg from './fire.svg';
import imFlagSvg from './flag.svg';
import imFolderSvg from './folder.svg';
import imGiftSvg from './gift.svg';
import imHeartSvg from './heart.svg';
import imHomeSvg from './home.svg';
import imKeySvg from './key.svg';
import imLinkSvg from './link.svg';
import imLockSvg from './lock.svg';
import imMapSvg from './map.svg';
import imMusicSvg from './music.svg';
import imPencilSvg from './pencil.svg';
import imPhoneSvg from './phone.svg';
import imRocketSvg from './rocket.svg';
import imShieldSvg from './shield.svg';
import imStarFullSvg from './star-full.svg';
import imTerminalSvg from './terminal.svg';
import imTrophySvg from './trophy.svg';
import imVideoCameraSvg from './video-camera.svg';
import tbBellSvg from './tabler/bell.svg';
import tbBookSvg from './tabler/book.svg';
import tbBookmarkSvg from './tabler/bookmark.svg';
import tbBriefcaseSvg from './tabler/briefcase.svg';
import tbBugSvg from './tabler/bug.svg';
import tbCalendarSvg from './tabler/calendar.svg';
import tbCameraSvg from './tabler/camera.svg';
import tbChartBarSvg from './tabler/chart-bar.svg';
import tbClockSvg from './tabler/clock.svg';
import tbCloudSvg from './tabler/cloud.svg';
import tbCodeSvg from './tabler/code.svg';
import tbCoffeeSvg from './tabler/coffee.svg';
import tbDatabaseSvg from './tabler/database.svg';
import tbDownloadSvg from './tabler/download.svg';
import tbFlagSvg from './tabler/flag.svg';
import tbFolderSvg from './tabler/folder.svg';
import tbHeartSvg from './tabler/heart.svg';
import tbHomeSvg from './tabler/home.svg';
import tbKeySvg from './tabler/key.svg';
import tbLinkSvg from './tabler/link.svg';
import tbLockSvg from './tabler/lock.svg';
import tbMailSvg from './tabler/mail.svg';
import tbMusicSvg from './tabler/music.svg';
import tbRocketSvg from './tabler/rocket.svg';
import tbSettingsSvg from './tabler/settings.svg';
import tbShoppingCartSvg from './tabler/shopping-cart.svg';
import tbStarSvg from './tabler/star.svg';
import tbUploadSvg from './tabler/upload.svg';
import tbVideoSvg from './tabler/video.svg';
import tbWorldSvg from './tabler/world.svg';
import bsBarChartFillSvg from './bootstrap/bar-chart-fill.svg';
import bsBellFillSvg from './bootstrap/bell-fill.svg';
import bsBookFillSvg from './bootstrap/book-fill.svg';
import bsBookmarkFillSvg from './bootstrap/bookmark-fill.svg';
import bsBriefcaseFillSvg from './bootstrap/briefcase-fill.svg';
import bsBugFillSvg from './bootstrap/bug-fill.svg';
import bsCalendarEventFillSvg from './bootstrap/calendar-event-fill.svg';
import bsCameraFillSvg from './bootstrap/camera-fill.svg';
import bsCartFillSvg from './bootstrap/cart-fill.svg';
import bsClockFillSvg from './bootstrap/clock-fill.svg';
import bsCloudFillSvg from './bootstrap/cloud-fill.svg';
import bsCodeSlashSvg from './bootstrap/code-slash.svg';
import bsDatabaseFillSvg from './bootstrap/database-fill.svg';
import bsEnvelopeFillSvg from './bootstrap/envelope-fill.svg';
import bsFilmSvg from './bootstrap/film.svg';
import bsFlagFillSvg from './bootstrap/flag-fill.svg';
import bsFolderFillSvg from './bootstrap/folder-fill.svg';
import bsGearFillSvg from './bootstrap/gear-fill.svg';
import bsGlobeSvg from './bootstrap/globe.svg';
import bsHeartFillSvg from './bootstrap/heart-fill.svg';
import bsHouseFillSvg from './bootstrap/house-fill.svg';
import bsKeyFillSvg from './bootstrap/key-fill.svg';
import bsLightningFillSvg from './bootstrap/lightning-fill.svg';
import bsLockFillSvg from './bootstrap/lock-fill.svg';
import bsMusicNoteBeamedSvg from './bootstrap/music-note-beamed.svg';
import bsRocketTakeoffFillSvg from './bootstrap/rocket-takeoff-fill.svg';
import bsStarFillSvg from './bootstrap/star-fill.svg';
import bsTrophyFillSvg from './bootstrap/trophy-fill.svg';

export interface Glyph { id: string; name: string; set: string; svg: string }

export const glyphs: Glyph[] = [
  { id: 'bell', name: 'Bell', set: 'IcoMoon', svg: imBellSvg },
  { id: 'book', name: 'Book', set: 'IcoMoon', svg: imBookSvg },
  { id: 'bookmark', name: 'Bookmark', set: 'IcoMoon', svg: imBookmarkSvg },
  { id: 'briefcase', name: 'Briefcase', set: 'IcoMoon', svg: imBriefcaseSvg },
  { id: 'bug', name: 'Bug', set: 'IcoMoon', svg: imBugSvg },
  { id: 'calendar', name: 'Calendar', set: 'IcoMoon', svg: imCalendarSvg },
  { id: 'camera', name: 'Camera', set: 'IcoMoon', svg: imCameraSvg },
  { id: 'cart', name: 'Cart', set: 'IcoMoon', svg: imCartSvg },
  { id: 'clock', name: 'Clock', set: 'IcoMoon', svg: imClockSvg },
  { id: 'cloud', name: 'Cloud', set: 'IcoMoon', svg: imCloudSvg },
  { id: 'cog', name: 'Cog', set: 'IcoMoon', svg: imCogSvg },
  { id: 'database', name: 'Database', set: 'IcoMoon', svg: imDatabaseSvg },
  { id: 'fire', name: 'Fire', set: 'IcoMoon', svg: imFireSvg },
  { id: 'flag', name: 'Flag', set: 'IcoMoon', svg: imFlagSvg },
  { id: 'folder', name: 'Folder', set: 'IcoMoon', svg: imFolderSvg },
  { id: 'gift', name: 'Gift', set: 'IcoMoon', svg: imGiftSvg },
  { id: 'heart', name: 'Heart', set: 'IcoMoon', svg: imHeartSvg },
  { id: 'home', name: 'Home', set: 'IcoMoon', svg: imHomeSvg },
  { id: 'key', name: 'Key', set: 'IcoMoon', svg: imKeySvg },
  { id: 'link', name: 'Link', set: 'IcoMoon', svg: imLinkSvg },
  { id: 'lock', name: 'Lock', set: 'IcoMoon', svg: imLockSvg },
  { id: 'map', name: 'Map', set: 'IcoMoon', svg: imMapSvg },
  { id: 'music', name: 'Music', set: 'IcoMoon', svg: imMusicSvg },
  { id: 'pencil', name: 'Pencil', set: 'IcoMoon', svg: imPencilSvg },
  { id: 'phone', name: 'Phone', set: 'IcoMoon', svg: imPhoneSvg },
  { id: 'rocket', name: 'Rocket', set: 'IcoMoon', svg: imRocketSvg },
  { id: 'shield', name: 'Shield', set: 'IcoMoon', svg: imShieldSvg },
  { id: 'star-full', name: 'Star Full', set: 'IcoMoon', svg: imStarFullSvg },
  { id: 'terminal', name: 'Terminal', set: 'IcoMoon', svg: imTerminalSvg },
  { id: 'trophy', name: 'Trophy', set: 'IcoMoon', svg: imTrophySvg },
  { id: 'video-camera', name: 'Video Camera', set: 'IcoMoon', svg: imVideoCameraSvg },
  { id: 'tb-bell', name: 'Bell', set: 'Tabler', svg: tbBellSvg },
  { id: 'tb-book', name: 'Book', set: 'Tabler', svg: tbBookSvg },
  { id: 'tb-bookmark', name: 'Bookmark', set: 'Tabler', svg: tbBookmarkSvg },
  { id: 'tb-briefcase', name: 'Briefcase', set: 'Tabler', svg: tbBriefcaseSvg },
  { id: 'tb-bug', name: 'Bug', set: 'Tabler', svg: tbBugSvg },
  { id: 'tb-calendar', name: 'Calendar', set: 'Tabler', svg: tbCalendarSvg },
  { id: 'tb-camera', name: 'Camera', set: 'Tabler', svg: tbCameraSvg },
  { id: 'tb-chart-bar', name: 'Chart Bar', set: 'Tabler', svg: tbChartBarSvg },
  { id: 'tb-clock', name: 'Clock', set: 'Tabler', svg: tbClockSvg },
  { id: 'tb-cloud', name: 'Cloud', set: 'Tabler', svg: tbCloudSvg },
  { id: 'tb-code', name: 'Code', set: 'Tabler', svg: tbCodeSvg },
  { id: 'tb-coffee', name: 'Coffee', set: 'Tabler', svg: tbCoffeeSvg },
  { id: 'tb-database', name: 'Database', set: 'Tabler', svg: tbDatabaseSvg },
  { id: 'tb-download', name: 'Download', set: 'Tabler', svg: tbDownloadSvg },
  { id: 'tb-flag', name: 'Flag', set: 'Tabler', svg: tbFlagSvg },
  { id: 'tb-folder', name: 'Folder', set: 'Tabler', svg: tbFolderSvg },
  { id: 'tb-heart', name: 'Heart', set: 'Tabler', svg: tbHeartSvg },
  { id: 'tb-home', name: 'Home', set: 'Tabler', svg: tbHomeSvg },
  { id: 'tb-key', name: 'Key', set: 'Tabler', svg: tbKeySvg },
  { id: 'tb-link', name: 'Link', set: 'Tabler', svg: tbLinkSvg },
  { id: 'tb-lock', name: 'Lock', set: 'Tabler', svg: tbLockSvg },
  { id: 'tb-mail', name: 'Mail', set: 'Tabler', svg: tbMailSvg },
  { id: 'tb-music', name: 'Music', set: 'Tabler', svg: tbMusicSvg },
  { id: 'tb-rocket', name: 'Rocket', set: 'Tabler', svg: tbRocketSvg },
  { id: 'tb-settings', name: 'Settings', set: 'Tabler', svg: tbSettingsSvg },
  { id: 'tb-shopping-cart', name: 'Shopping Cart', set: 'Tabler', svg: tbShoppingCartSvg },
  { id: 'tb-star', name: 'Star', set: 'Tabler', svg: tbStarSvg },
  { id: 'tb-upload', name: 'Upload', set: 'Tabler', svg: tbUploadSvg },
  { id: 'tb-video', name: 'Video', set: 'Tabler', svg: tbVideoSvg },
  { id: 'tb-world', name: 'World', set: 'Tabler', svg: tbWorldSvg },
  { id: 'bs-bar-chart-fill', name: 'Bar Chart Fill', set: 'Bootstrap', svg: bsBarChartFillSvg },
  { id: 'bs-bell-fill', name: 'Bell Fill', set: 'Bootstrap', svg: bsBellFillSvg },
  { id: 'bs-book-fill', name: 'Book Fill', set: 'Bootstrap', svg: bsBookFillSvg },
  { id: 'bs-bookmark-fill', name: 'Bookmark Fill', set: 'Bootstrap', svg: bsBookmarkFillSvg },
  { id: 'bs-briefcase-fill', name: 'Briefcase Fill', set: 'Bootstrap', svg: bsBriefcaseFillSvg },
  { id: 'bs-bug-fill', name: 'Bug Fill', set: 'Bootstrap', svg: bsBugFillSvg },
  { id: 'bs-calendar-event-fill', name: 'Calendar Event Fill', set: 'Bootstrap', svg: bsCalendarEventFillSvg },
  { id: 'bs-camera-fill', name: 'Camera Fill', set: 'Bootstrap', svg: bsCameraFillSvg },
  { id: 'bs-cart-fill', name: 'Cart Fill', set: 'Bootstrap', svg: bsCartFillSvg },
  { id: 'bs-clock-fill', name: 'Clock Fill', set: 'Bootstrap', svg: bsClockFillSvg },
  { id: 'bs-cloud-fill', name: 'Cloud Fill', set: 'Bootstrap', svg: bsCloudFillSvg },
  { id: 'bs-code-slash', name: 'Code Slash', set: 'Bootstrap', svg: bsCodeSlashSvg },
  { id: 'bs-database-fill', name: 'Database Fill', set: 'Bootstrap', svg: bsDatabaseFillSvg },
  { id: 'bs-envelope-fill', name: 'Envelope Fill', set: 'Bootstrap', svg: bsEnvelopeFillSvg },
  { id: 'bs-film', name: 'Film', set: 'Bootstrap', svg: bsFilmSvg },
  { id: 'bs-flag-fill', name: 'Flag Fill', set: 'Bootstrap', svg: bsFlagFillSvg },
  { id: 'bs-folder-fill', name: 'Folder Fill', set: 'Bootstrap', svg: bsFolderFillSvg },
  { id: 'bs-gear-fill', name: 'Gear Fill', set: 'Bootstrap', svg: bsGearFillSvg },
  { id: 'bs-globe', name: 'Globe', set: 'Bootstrap', svg: bsGlobeSvg },
  { id: 'bs-heart-fill', name: 'Heart Fill', set: 'Bootstrap', svg: bsHeartFillSvg },
  { id: 'bs-house-fill', name: 'House Fill', set: 'Bootstrap', svg: bsHouseFillSvg },
  { id: 'bs-key-fill', name: 'Key Fill', set: 'Bootstrap', svg: bsKeyFillSvg },
  { id: 'bs-lightning-fill', name: 'Lightning Fill', set: 'Bootstrap', svg: bsLightningFillSvg },
  { id: 'bs-lock-fill', name: 'Lock Fill', set: 'Bootstrap', svg: bsLockFillSvg },
  { id: 'bs-music-note-beamed', name: 'Music Note Beamed', set: 'Bootstrap', svg: bsMusicNoteBeamedSvg },
  { id: 'bs-rocket-takeoff-fill', name: 'Rocket Takeoff Fill', set: 'Bootstrap', svg: bsRocketTakeoffFillSvg },
  { id: 'bs-star-fill', name: 'Star Fill', set: 'Bootstrap', svg: bsStarFillSvg },
  { id: 'bs-trophy-fill', name: 'Trophy Fill', set: 'Bootstrap', svg: bsTrophyFillSvg },
];

export const glyphsById = Object.fromEntries(glyphs.map(g => [g.id, g]));

export const glyphSets = [...new Set(glyphs.map(g => g.set))];

