import { makeWithDefaults } from "drizzle-orm/effect-postgres";
import { Layer } from "effect";

import { Database } from "./drizzle/pg-database";

export { Database } from "./drizzle/pg-database";

/** Construct Drizzle from the driver's SQL-client Layer without loading auth factories. */
export const databaseLayer = Layer.effect(Database, makeWithDefaults({}));
