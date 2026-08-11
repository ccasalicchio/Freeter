/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

// For CSS
// Use default imports (import styles from './x.module.css') — namespace
// imports only expose valid-identifier class names under ESM, silently
// dropping kebab-case classes like 'is-dragging'.
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// For SCSS
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}
