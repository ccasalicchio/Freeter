/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { createStateStorage } from '@common/data/stateStorage';
import { createStore } from '@common/data/store';
import { withJson } from '@common/infra/dataStorage/withJson';
import { createInMemoryDataStorage } from '@common/infra/dataStorage/inMemoryDataStorage';

/**
 * @param persistentStateFactory what gets serialized on save; defaults to the
 * whole state. Pass the production factory when the state holds values that
 * are not JSON-serializable (e.g. Node `Timeout` handles in `ui.memSaver`).
 */
export function fixtureStore<TState extends object>(
  state: TState,
  persistentStateFactory: (state: TState) => object = s => s
): Promise<ReturnType<typeof createStore<TState, TState>>> {
  return new Promise(resolve => {
    const store = createStore<TState, TState>({
      stateStorage: createStateStorage(
        withJson(createInMemoryDataStorage()),
        'state-key',
        1,
        0,
        s => s as TState,
        s => persistentStateFactory(s) as TState
      )
    }, state, s => s as TState, s => s as TState, () => {
      resolve(store);
    })
  })
}
