/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

/** A single entry of a directory listing. */
export interface FsDirEntry {
  name: string;
  isDir: boolean;
  size: number;
  mtimeMs: number;
}

/** Result of a read-only directory listing performed by the main process. */
export interface FsListDirResult {
  ok: boolean;
  error?: string;
  entries?: FsDirEntry[];
}
