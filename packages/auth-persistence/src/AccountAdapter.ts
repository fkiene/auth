/** Composed account persistence without Phone adapters. */
export { createAccountPersistence } from "./internal/account-persistence";
export { makeComposedPasskeys } from "./internal/passkeys";
export { PersistenceConfigurationError } from "./internal/configuration";
export type { StorageTable } from "./internal/storage-tables";
