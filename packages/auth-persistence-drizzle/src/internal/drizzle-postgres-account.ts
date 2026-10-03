import {
  makeComposedPasskeys,
  createAccountPersistence,
} from "@yielded/auth-persistence/AccountAdapter";
import type { PgTable } from "drizzle-orm/pg-core";
import type { Effect } from "effect";
import type { SqlClient } from "effect/sql/SqlClient";

import { drizzleQueryOperations } from "../drizzle/query-operations";
import { makeTable, describe } from "./drizzle-postgres-tables";

export const postgresAccountPersistence = <R>(
  acquire: Effect.Effect<object, never, R | SqlClient>,
) =>
  createAccountPersistence<PgTable, R>({
    makeTable,
    describe,
    operations: drizzleQueryOperations,
    acquire,
    passkeys: makeComposedPasskeys(drizzleQueryOperations),
  });
