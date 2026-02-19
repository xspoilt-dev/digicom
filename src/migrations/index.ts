import * as migration_20260218_072547 from './20260218_072547';
import * as migration_20260219_145341 from './20260219_145341';

export const migrations = [
  {
    up: migration_20260218_072547.up,
    down: migration_20260218_072547.down,
    name: '20260218_072547',
  },
  {
    up: migration_20260219_145341.up,
    down: migration_20260219_145341.down,
    name: '20260219_145341'
  },
];
