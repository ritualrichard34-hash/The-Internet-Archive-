import { dataContract } from '@prisma/composer-prisma-cloud/orm';
import type { Contract } from './contract.js';
import contractJson from './contract.json' with { type: 'json' };

/**
 * The `dataContract`-wrapped value both ends of the database connection
 * reference: the service's dependency (`postgres(dbContract)`) and the
 * resource the app root provisions (`postgres({ contract: dbContract, ... })`).
 */
export const dbContract = dataContract<Contract>(contractJson);
