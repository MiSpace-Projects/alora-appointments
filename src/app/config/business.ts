/**
 * Single source of truth for the business identity used in the footer, the
 * legal pages (POPIA s18 notice, ECTA s43 disclosures, PAIA manual) and
 * transactional email. Anything the owner has not yet confirmed is `null`, and
 * the legal pages render an explicit "to be confirmed" marker instead of a
 * guessed value — never invent legal facts.
 */
export const businessContact = {
  tradingName: 'Alora Appointments',
  brandName: 'Alora',
  email: 'alorabookings@gmail.com',
  phoneDisplay: '+27 (60) 639-7955',
  phoneE164: '+27606397955',
  location: 'Bethlehem, Free State',
  country: 'South Africa',
  website: 'https://www.alorastudios.co.za',
} as const;

/**
 * Facts that must come from the owner before go-live. `null` renders as a
 * visible "to be confirmed" item on the legal pages so nothing ships as a
 * silent placeholder.
 */
export const businessLegal = {
  /** Registered legal name, e.g. "Alora Studios (Pty) Ltd" or the owner's full name if a sole proprietor. */
  registeredName: null as string | null,
  /** "Sole proprietor" | "Private company ((Pty) Ltd)" | "Close corporation" */
  legalStatus: null as string | null,
  /** CIPC registration number, if a juristic person. */
  registrationNumber: null as string | null,
  /** VAT number, if VAT-registered. */
  vatNumber: null as string | null,
  /** Full physical / street address (ECTA s43(1)(b), POPIA s18(1)(b)). */
  physicalAddress: null as string | null,
  /** POPIA Information Officer (defaults to the head of the private body). */
  informationOfficerName: null as string | null,
  informationOfficerEmail: businessContact.email,
  informationOfficerPhone: businessContact.phoneE164,
} as const;

/** Booking cancellation and refund policy — the numbers the terms page and the cancel flow both use. */
export const cancellationPolicy = {
  /** Cancel at least this many hours before the appointment for a full refund. */
  fullRefundHours: 48,
  /** Cancelling inside the window refunds this fraction of the amount paid. */
  lateRefundFraction: 0.5,
  /** Working days we commit to for processing refunds (ECTA s44(3) allows up to 30 days). */
  refundProcessingDays: 10,
} as const;

/** Legal-document versions; bump when the wording changes materially so consent records stay meaningful. */
export const legalVersions = {
  privacy: '2026-09-24',
  cookies: '2026-09-24',
  terms: '2026-09-24',
} as const;

/** Information Regulator (South Africa) — complaints contact required by POPIA s18(1)(h)(iv). */
export const informationRegulator = {
  name: 'Information Regulator (South Africa)',
  address: 'Woodmead North Office Park, 54 Maxwell Drive, Woodmead, Johannesburg, 2191',
  website: 'https://inforegulator.org.za',
  complaintsEmail: 'POPIAComplaints@inforegulator.org.za',
  paiaComplaintsEmail: 'PAIAComplaints@inforegulator.org.za',
  enquiriesEmail: 'enquiries@inforegulator.org.za',
} as const;
