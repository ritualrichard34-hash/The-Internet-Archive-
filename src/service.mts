import { compute } from '@prisma/composer-prisma-cloud';
import { postgres } from '@prisma/composer-prisma-cloud/orm';
import nodeBuild from '@prisma/composer/node';
import { dbContract } from './prisma/db-contract.mjs';

/**
 * The app's one service. The app root provisions it and wires its `db`
 * dependency to the `postgres` resource; the built server imports this
 * declaration to read the database client and the port.
 */
const service = compute({
  name: 'web',
  deps: {
    db: postgres(dbContract),
  },
  build: nodeBuild({
    module: import.meta.url,
    // The whole tsc build output is copied verbatim; `entry` names the
    // file inside it that boots (resolved against `dir`).
    dir: '../dist',
    entry: './server.mjs',
    // tsc leaves packages as imports; deploy traces and stages them.
    dependencies: 'external',
  }),
});

export default service;
