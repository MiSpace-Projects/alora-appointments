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

export const businessLegal = {
  registeredName: null as string | null,
  legalStatus: null as string | null,
  registrationNumber: null as string | null,
  vatNumber: null as string | null,
  physicalAddress: null as string | null,
  informationOfficerName: null as string | null,
  informationOfficerEmail: businessContact.email,
  informationOfficerPhone: businessContact.phoneE164,
} as const;

export const cancellationPolicy = {
  fullRefundHours: 48,
  lateRefundFraction: 0.5,
  refundProcessingDays: 10,
} as const;

export const legalVersions = {
  privacy: '2026-09-24',
  cookies: '2026-09-24',
  terms: '2026-09-24',
} as const;

export const informationRegulator = {
  name: 'Information Regulator (South Africa)',
  address: 'Woodmead North Office Park, 54 Maxwell Drive, Woodmead, Johannesburg, 2191',
  website: 'https://inforegulator.org.za',
  complaintsEmail: 'POPIAComplaints@inforegulator.org.za',
  paiaComplaintsEmail: 'PAIAComplaints@inforegulator.org.za',
  enquiriesEmail: 'enquiries@inforegulator.org.za',
} as const;
