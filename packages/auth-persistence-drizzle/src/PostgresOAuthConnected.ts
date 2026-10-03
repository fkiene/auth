import type { AnyRelations } from "drizzle-orm";
import type { EffectPgDatabase } from "drizzle-orm/effect-postgres";
import type { AnyPgTable } from "drizzle-orm/pg-core";

import { makeOAuthConnectedTarget } from "./drizzle/oauth-connected-drivers";
import { sqlClientOAuthStandaloneGuard } from "./drizzle/oauth-execution";
import { Database } from "./drizzle/pg-database";

export { Database, databaseLayer } from "./PostgresDatabase";

/** Connected custody and revocation ports share the broad driver's transaction authority. */
export const {
  makeOAuthConnectedServices,
  makeOAuthConnectedRevocationServices,
  coordinateOAuthConnected,
  coordinateOAuthConnectedRevocations,
} = makeOAuthConnectedTarget<
  Database,
  EffectPgDatabase<AnyRelations>,
  AnyPgTable<{ dialect: "pg" }>
>(Database, {
  mode: "interactive",
  dialect: "pg",
  locking: true,
  standaloneGuard: sqlClientOAuthStandaloneGuard,
});
