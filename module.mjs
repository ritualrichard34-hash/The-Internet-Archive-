// The app root — the entry `prisma deploy` and `prisma dev` load. The name
// decides which project on Prisma Cloud this app deploys to.
import { appRoot } from '@prisma/composer';
import { postgres } from '@prisma/composer-prisma-cloud/orm';
import { dbContract } from './src/prisma/db-contract.mjs';
import service from './src/service.mjs';

export default appRoot('prisma', ({ provision }) => {
  const db = provision(
    postgres({
      name: 'db',
      contract: dbContract,
      config: './prisma.config.ts',
    }),
    { id: 'db' },
  );
  provision(service, { deps: { db } });
});
