import { hooksLayer } from "@yielded/auth/Persistence";
import { Context, Effect, Layer } from "effect";

import { createComposedPersistence, type Backend } from "./composed-persistence";
import { composedPhoneServices } from "./composed-phone";
import type { ClaimsCodec, Definition, PersistenceApi, Ports } from "./configuration";
import { NativeDatabase, type TransactionNativeDatabase } from "./transaction-kernel";

export type { Backend } from "./composed-persistence";

export const createPersistence = <T extends object, R>(
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

      const services = Effect.gen(function* () {
        let context = yield* coreServices;

        if (phone) {
          context = Context.merge(
            context,
            yield* composedPhoneServices<T, C, Id, A>(backend.operations, auth, bound.Config),
          );
        }

        // Checked capability metadata determines the contributed service keys.
        return context as Context.Context<Ports<C, Id, A>>;
      });

      return {
        ...bound,
        layer: Layer.effectContext(services).pipe(
          Layer.provide(database),
          Layer.provide(hooksLayer),
        ),
      };
    },
  };
};
