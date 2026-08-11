/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { vi } from 'vitest';

// The test suites were written against the Jest globals API. Vitest's `vi`
// is call-compatible for the subset they use (fn, spyOn, mock, timers,
// clearAllMocks, ...), so expose it as `jest` until the specs are migrated.
(globalThis as unknown as { jest: typeof vi }).jest = vi;
