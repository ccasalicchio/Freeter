/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { fixtureStore } from '@testscommon/data/fixtures/store';
import { AppState, createPersistentAppState } from '@/base/state/app';

// persist exactly what the real app store persists: ui.memSaver holds timer
// handles, which are circular Node objects in the test environment
export const fixtureAppStore = (state: AppState) => fixtureStore<AppState>(state, createPersistentAppState);
