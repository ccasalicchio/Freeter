/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

// Identity proxy for style imports in tests (ESM flavor of identity-obj-proxy):
// `styles['any-class']` returns 'any-class', so class assertions see original
// names and no real CSS is applied (Jest-era specs assume unstyled DOM).
export default new Proxy({}, {
  get: (_target, key) => String(key)
});
