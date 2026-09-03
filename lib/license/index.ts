export { formatSerialInput } from "./serial-format";
export {
  canonicalizeSerial,
  generateSerial,
  hashSerial,
} from "./serial";
export {
  createAdminIssuedLicense,
  createPaidLicense,
  findLicenseByEmail,
  findLicenseById,
  findLicenseByMachineId,
  findLicenseBySerial,
  findLicenseByStripeSession,
  issueLicenseSerial,
  licenseHasIssuedSerial,
  listLicenses,
  markLicenseActivated,
  markLicenseExpired,
  markLicenseRevoked,
  markLicenseSerialEmailed,
} from "./store";
export { activateLicenseCopy, toActivationResult } from "./activate";
export { verifyLicenseCopy } from "./heartbeat";
export {
  DEFAULT_LICENSE_GRACE_DAYS,
  evaluateDesktopLease,
  licenseGraceMs,
} from "./lease";
export {
  deliverIssuedLicenseById,
  issueAdminLicense,
  resendLicenseEmail,
  revealLicenseForCheckoutSession,
} from "./deliver";
export {
  DESKTOP_LICENSE_PRODUCT,
  editionLabel,
  formatLicensePrice,
  getPricedLicenseOffer,
  licenseDurationLabel,
  listLicenseOffers,
} from "./catalog";
export { installerUrlForEdition } from "./installers";
export {
  expiresAtFromActivation,
  LICENSE_DURATION_DAYS,
  LICENSE_DURATIONS,
  LICENSE_EDITIONS,
  LICENSE_STATUSES,
  LicenseError,
  type LicenseActivationResult,
  type LicenseRecord,
  type LicenseReveal,
} from "./types";
