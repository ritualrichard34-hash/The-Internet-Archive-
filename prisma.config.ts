import { definePrismaConfig } from 'prisma/config';
import { defineConfig as composer } from '@prisma/composer/config';
import { nodeBuild } from '@prisma/composer/node/control';
import { prismaCloud, prismaState } from '@prisma/composer-prisma-cloud/control';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  // Prisma ORM 8: the data contract source, the database commands use and the
  // migrations directory the deploy's migration step reads.
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: { connection: process.env['DATABASE_URL']! },
  }),
  // Prisma Composer: the app root entry and the deploy target wiring.
  composer: composer({
    entry: './module.mjs',
    extensions: [prismaCloud(), nodeBuild()],
    state: prismaState(),
  }),
});
