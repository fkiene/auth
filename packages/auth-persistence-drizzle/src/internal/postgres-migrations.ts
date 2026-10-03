import { makeWithDefaults } from "drizzle-orm/effect-postgres";
import { Effect } from "effect";

import { drizzleMigrationsLayer } from "./drizzle-migrations";

export const migrationsLayer = drizzleMigrationsLayer(
  makeWithDefaults({}),
  Effect.promise(() => import("drizzle-orm/effect-postgres/migrator")).pipe(
    Effect.map((module) => module.migrate),
  ),
);
