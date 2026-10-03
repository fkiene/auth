import { makeWithDefaults } from "drizzle-orm/effect-postgres";

import { postgresAccountPersistence } from "./internal/drizzle-postgres-account";
import { migrationsLayer } from "./internal/postgres-migrations";

export { Database, databaseLayer } from "./PostgresDatabase";

/** Composed Password and Passkey account storage with shared sessions and proofs. */
export const AuthPersistence = {
  ...postgresAccountPersistence(makeWithDefaults({})),
  migrationsLayer,
};
