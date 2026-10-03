import { hooksLayer } from "@yielded/auth/Persistence";
import type { Context } from "effect";
import { Effect, Layer } from "effect";

import { createComposedPersistence, type Backend } from "./composed-persistence";
import {
  PersistenceConfigurationError,
  type ClaimsCodec,
  type Definition,
  type PersistenceApi,
  type Ports,
} from "./configuration";
import { NativeDatabase, type TransactionNativeDatabase } from "./transaction-kernel";

/** Compose Password, Passkey and email-address persistence with shared sessions and proofs. */
export const createAccountPersistence = <T extends object, R>(
  backend: Backend<T, R>,
): PersistenceApi<T, R> => {
  const core = createComposedPersistence(backend);

  return {
    make: <C extends ClaimsCodec, const Id extends string, const A extends Definition<C, Id>>(
      auth: A & Definition<C, Id>,
    ) => {
      const { services: coreServices, ...bound } = core.make<C, Id, A>(auth);

      // The backend validates its foreign query-builder shape; persisted rows remain decoded by kernels.
      const database = Layer.effect(
        NativeDatabase,
        backend.acquire.pipe(Effect.map((value) => value as TransactionNativeDatabase)),
      );

      const phone = Object.values(auth.strategies).some(
        (strategy) => strategy.persistence?.kind === "phone",
      );

      return {
        ...bound,
        layer: phone
          ? Layer.effectContext<Ports<C, Id, A>, PersistenceConfigurationError, never>(
              Effect.fail(
                PersistenceConfigurationError.make({
                  reason: "Use the full composed adapter for Phone persistence",
                }),
              ),
            )
          : Layer.effectContext(
              coreServices.pipe(
                Effect.map(
                  (context) =>
                    // The checked account capabilities exclude Phone service keys.
                    context as Context.Context<Ports<C, Id, A>>,
                ),
              ),
            ).pipe(Layer.provide(database), Layer.provide(hooksLayer)),
      };
    },
  };
};
