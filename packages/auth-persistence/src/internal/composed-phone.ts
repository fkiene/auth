import { randomId } from "@yielded/auth-crypto";
import { LifecycleHooks } from "@yielded/auth/Hooks";
import { PhoneAdmission, PhoneSignInTargets, PhoneOtpUnavailable } from "@yielded/auth/PhoneOtp";
import { Context, Effect } from "effect";
import { SqlClient } from "effect/sql";

import {
  PersistenceConfigurationError,
  type ClaimsCodec,
  type ConfigId,
  type Definition,
  type Roles,
  type StorageLayout,
} from "./configuration";
import { makePhoneKernel, CurrentPhoneTransaction } from "./phone-kernel";
import type { QueryOperations } from "./query-operations";
import { requireStandalone } from "./standalone";
import { makeMappings } from "./storage-mapping";
import { makeTransactionExecutionKernel } from "./transaction-execution-kernel";
import { makeTransactionKernel, NativeDatabase } from "./transaction-kernel";

export const composedPhoneServices = <
  T extends object,
  C extends ClaimsCodec,
  const Id extends string,
  const A extends Definition<C, Id>,
>(
  operations: QueryOperations,
  auth: A & Definition<C, Id>,
  storageKey: Context.Key<ConfigId<A["namespace"]>, StorageLayout<T, Roles<C, Id, A>>>,
) =>
  Effect.gen(function* () {
    const storage = yield* storageKey;
    const hooks = yield* LifecycleHooks;
    const client = yield* SqlClient.SqlClient;
    const native = yield* NativeDatabase;

    const dialect = client.onDialectOrElse({
      pg: () => "pg" as const,
      sqlite: () => "sqlite" as const,
      orElse: () => undefined,
    });

    if (dialect === undefined)
      return yield* PersistenceConfigurationError.make({
        reason: "Use an explicit adapter for this SQL dialect",
      });
    const features = Object.values(auth.strategies).map((strategy) => strategy.persistence);
    const mappings = makeMappings(storage);
    const transactionKernel = makeTransactionKernel(operations);
    const executionKernel = makeTransactionExecutionKernel(transactionKernel);
    const phoneKernel = makePhoneKernel(operations, transactionKernel);
    const { column, eq } = operations;

    const mapping = (moduleId: string) => ({
      moduleId,
      subject: {
        table: storage.subjects.table,
        id: storage.subjects.id,
        securityRevision: storage.subjects.securityRevision,
        activeCondition: eq(
          column(storage.subjects.table, storage.subjects.status),
          storage.subjects.activeValue,
        ),
      },
      subjectIds: {
        toNative: storage.subjects.toNativeSync,
        toSubject: storage.subjects.toSubjectSync,
      },
      identifier: {
        table: mappings.table("identifiers"),
        namespace: "namespace",
        value: "value",
        subjectId: "subjectId",
        revision: "revision",
        verifiedAt: "verifiedAt",
        activeCondition: eq(column(mappings.table("identifiers"), "active"), true),
      },
      credential: {
        table: mappings.table("credentials"),
        id: "credentialId",
        subjectId: "subjectId",
        revision: "revision",
        activeCondition: eq(column(mappings.table("credentials"), "active"), true),
      },
      state: {
        table: mappings.table("phoneState"),
        scope: "scope",
        state: "state",
        version: "version",
        encodeInsert: (row: object) => row,
      },
      admission: {
        windowMillis: 60_000,
        networkRequests: 10,
        networkAttempts: 100,
        maximumMessages: 10,
        requestRetentionMillis: 86_400_000,
      },
      engineNowMillis: operations.sql`${dialect === "pg" ? operations.sql`cast(extract(epoch from clock_timestamp()) * 1000 as bigint)` : operations.sql`cast(round((julianday('now') - 2440587.5) * 86400000) as integer)`}`,
      encodeInstant: storage.encodeInstant,
    });

    const execution = yield* executionKernel
      .makeTransactionExecution(
        CurrentPhoneTransaction,
        {
          mode: "interactive",
          dialect,
          locking: dialect === "pg",
          standaloneGuard: () =>
            requireStandalone(() => PhoneOtpUnavailable.make({}), client.transactionService),
        },
        () => PhoneOtpUnavailable.make({}),
        randomId,
      )
      .pipe(Effect.provideService(NativeDatabase, native));

    const run = <Value, E, Requirements>(
      work: Effect.Effect<Value, E, Requirements>,
      mutation = true,
    ) =>
      execution.admit.pipe(
        Effect.andThen(execution.run(work, mutation)),
        Effect.provideService(LifecycleHooks, hooks),
      );

    const allowed = (moduleId: string) =>
      features.some((feature) => feature?.kind === "phone" && feature.moduleId === moduleId);

    const admission = PhoneAdmission.of({
      admit: (request) =>
        allowed(request.moduleId)
          ? run(phoneKernel.admitPhone(mapping(request.moduleId), request))
          : Effect.fail(PhoneOtpUnavailable.make({})),
      cleanup: (request) =>
        allowed(request.moduleId)
          ? run(phoneKernel.cleanupPhoneAdmission(mapping(request.moduleId), request))
          : Effect.fail(PhoneOtpUnavailable.make({})),
    });

    const targets = PhoneSignInTargets.of({
      lookup: (request) =>
        allowed(request.moduleId)
          ? run(phoneKernel.lookupPhone(mapping(request.moduleId), request), false)
          : Effect.fail(PhoneOtpUnavailable.make({})),
    });

    return Context.empty().pipe(
      Context.add(PhoneAdmission, admission),
      Context.add(PhoneSignInTargets, targets),
    );
  });
