import type { AnyRelations } from "drizzle-orm";
import { type EffectPgDatabase, makeWithDefaults } from "drizzle-orm/effect-postgres";
import type { AnyPgTable } from "drizzle-orm/pg-core";

import type {
  IdentityTables,
  SubjectProvisioningTables,
  ExternalIdentityTables,
} from "./drizzle/model";
import { Database } from "./drizzle/pg-database";
import {
  makePgExternalIdentityServices,
  makePgIdentityServices,
  makePgSubjectProvisioningServices,
} from "./drizzle/pg-identity";

export { Database, databaseLayer } from "./PostgresDatabase";

export {
  coordinatePgAuthenticationAuthority as coordinateAuthenticationAuthority,
  coordinatePgPendingAuthentication as coordinatePendingAuthentication,
  coordinatePgSignedSessionValidity as coordinateSignedSessionValidity,
  coordinatePgStatefulSessions as coordinateStatefulSessions,
  makePgAuthenticationAuthorityServices as makeAuthenticationAuthorityServices,
  makePgPendingAuthenticationServices as makePendingAuthenticationServices,
  makePgSignedSessionValidityServices as makeSignedSessionValidityServices,
  makePgStatefulSessionServices as makeStatefulSessionServices,
} from "./drizzle/pg-sessions";

export {
  coordinatePgProofPersistence as coordinateProofPersistence,
  makePgProofPersistenceServices as makeProofPersistenceServices,
} from "./drizzle/pg-proofs";

export {
  coordinatePgPasswordPersistence as coordinatePasswordPersistence,
  coordinatePgPasswordRegistration as coordinatePasswordRegistration,
  makePgPasswordPersistenceServices as makePasswordPersistenceServices,
  makePgPasswordRegistrationServices as makePasswordRegistrationServices,
} from "./drizzle/pg-passwords";

export {
  coordinatePgEmailAddress as coordinateEmailAddress,
  coordinatePgEmailRegistration as coordinateEmailRegistration,
  makePgEmailAddressServices as makeEmailAddressServices,
  makePgEmailRegistrationServices as makeEmailRegistrationServices,
  makePgEmailSignInServices as makeEmailSignInServices,
} from "./drizzle/pg-emails";

export const makeSubjectProvisioningServices = <
  Subject extends AnyPgTable,
  Identifier extends AnyPgTable,
  Request extends AnyPgTable,
  NativeId,
>(
  mapping: SubjectProvisioningTables<Subject, Identifier, Request, NativeId>,
) => makePgSubjectProvisioningServices(mapping);

export const makeExternalIdentityServices = <
  Subject extends AnyPgTable,
  External extends AnyPgTable,
  NativeId,
>(
  mapping: ExternalIdentityTables<Subject, External, NativeId>,
) => makePgExternalIdentityServices(mapping);

export const commitMode = "interactive" as const;

export const makeIdentityServices = <
  Subject extends AnyPgTable,
  Identifier extends AnyPgTable,
  External extends AnyPgTable,
  Request extends AnyPgTable,
  NativeId,
>(
  mapping: IdentityTables<Subject, Identifier, External, Request, NativeId>,
) => makePgIdentityServices(mapping);

export {
  makePgSessionStepUpServices as makeSessionStepUpServices,
  coordinatePgSessionStepUp as coordinateSessionStepUp,
} from "./drizzle/pg-sessions";

export {
  makePgPasswordPreparedPersistenceServices as makePasswordPreparedPersistenceServices,
  coordinatePgPasswordPreparedPersistence as coordinatePasswordPreparedPersistence,
} from "./drizzle/pg-password-prepared";

export { passwordPreparedPersistenceLayer } from "./drizzle/password-prepared-target";

import { makeOAuthIdentityTarget } from "./drizzle/oauth-drivers";
import { sqlClientOAuthStandaloneGuard } from "./drizzle/oauth-target";

const oauthTarget = makeOAuthIdentityTarget<
  Database,
  EffectPgDatabase<AnyRelations>,
  AnyPgTable<{ dialect: "pg" }>
>(Database, {
  mode: "interactive",
  dialect: "pg",
  locking: true,
  standaloneGuard: sqlClientOAuthStandaloneGuard,
});

export const {
  makeOAuthAccountsServices,
  makeOAuthSignInServices,
  makeOAuthRegistrationIntentServices,
  makeOAuthRegistrationServices,
  coordinateOAuthRegistration,
  coordinateOAuthSignIn,
  coordinateOAuthRegistrationIntents,
  coordinateOAuthAccounts,
} = oauthTarget;

export {
  makeOAuthConnectedServices,
  makeOAuthConnectedRevocationServices,
  coordinateOAuthConnected,
  coordinateOAuthConnectedRevocations,
} from "./PostgresOAuthConnected";

import { makePasskeyTarget } from "./drizzle/passkey-drivers";
import { sqlClientPasskeyStandaloneGuard } from "./drizzle/passkey-target";

const passkeyTarget = makePasskeyTarget<
  Database,
  EffectPgDatabase<AnyRelations>,
  AnyPgTable<{ dialect: "pg" }>
>(Database, {
  mode: "interactive",
  dialect: "pg",
  locking: true,
  standaloneGuard: sqlClientPasskeyStandaloneGuard,
});

export const {
  makePasskeyCredentialServices,
  makePasskeyPersistenceServices,
  makePasskeyEnrollmentContextServices,
  makePasskeyRegistrationCeremonyServices,
  coordinatePasskeyPersistence,
  coordinatePasskeyRegistrationCeremony,
  makePasskeyManagementServices,
  makePasskeyRegistrationServices,
  coordinatePasskeyManagement,
  coordinatePasskeyRegistration,
} = passkeyTarget;

import { makeTotpTarget, sqlClientTotpStandaloneGuard } from "./drizzle/totp-target";

const totpTarget = makeTotpTarget<
  Database,
  EffectPgDatabase<AnyRelations>,
  AnyPgTable<{ dialect: "pg" }>
>(Database, {
  mode: "interactive",
  dialect: "pg",
  locking: true,
  standaloneGuard: sqlClientTotpStandaloneGuard,
});

export const { makeTotpPersistenceServices, coordinateTotpPersistence } = totpTarget;

import { makePhoneTarget, sqlClientPhoneStandaloneGuard } from "./drizzle/phone-target";

const phoneTarget = makePhoneTarget<
  Database,
  EffectPgDatabase<AnyRelations>,
  AnyPgTable<{ dialect: "pg" }>
>(Database, {
  mode: "interactive",
  dialect: "pg",
  locking: true,
  standaloneGuard: sqlClientPhoneStandaloneGuard,
});

export const { makePhonePersistenceServices, coordinatePhonePersistence } = phoneTarget;

import { postgresPersistence } from "./internal/drizzle-postgres";
import { migrationsLayer } from "./internal/postgres-migrations";

export const AuthPersistence = {
  ...postgresPersistence(makeWithDefaults({})),
  migrationsLayer,
};
