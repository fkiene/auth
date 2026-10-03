/** Native Email services sharing the PostgreSQL database and existing transaction coordinators. */
export { Database, databaseLayer } from "./PostgresDatabase";

export {
  coordinatePgEmailAddress as coordinateEmailAddress,
  coordinatePgEmailRegistration as coordinateEmailRegistration,
  makePgEmailAddressServices as makeEmailAddressServices,
  makePgEmailRegistrationServices as makeEmailRegistrationServices,
  makePgEmailSignInServices as makeEmailSignInServices,
} from "./drizzle/pg-emails";
