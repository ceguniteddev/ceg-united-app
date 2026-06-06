import type { Agency, Bureau } from './credit-repair-types'

// ============================================
// Credit Reporting Agencies — Real Mailing Addresses
// ============================================
// The Big 3 bureaus + 13 specialty / third-party CRAs. Disputing at the
// source CRA level can remove data before it ever flows to the bureaus.

export const BUREAUS: Record<Bureau, Agency> = {
  experian: {
    key: 'experian',
    name: 'Experian',
    category: 'bureau',
    address: { line1: 'P.O. Box 4500', city: 'Allen', state: 'TX', zip: '75013' },
  },
  equifax: {
    key: 'equifax',
    name: 'Equifax',
    category: 'bureau',
    address: { line1: 'P.O. Box 740256', city: 'Atlanta', state: 'GA', zip: '30374' },
  },
  transunion: {
    key: 'transunion',
    name: 'TransUnion',
    category: 'bureau',
    address: { line1: 'P.O. Box 2000', city: 'Chester', state: 'PA', zip: '19016' },
  },
}

export const THIRD_PARTY_AGENCIES: Agency[] = [
  {
    key: 'lexisnexis',
    name: 'LexisNexis Risk Solutions',
    category: 'cra',
    address: {
      line1: 'P.O. Box 105108',
      city: 'Atlanta',
      state: 'GA',
      zip: '30348',
    },
    notes: 'Public records, insurance, employment data feed',
  },
  {
    key: 'corelogic-credco',
    name: 'CoreLogic Credco',
    category: 'cra',
    address: { line1: 'P.O. Box 509124', city: 'San Diego', state: 'CA', zip: '92150' },
    notes: 'Mortgage merged credit reports',
  },
  {
    key: 'innovis',
    name: 'Innovis',
    category: 'cra',
    address: { line1: 'P.O. Box 1640', city: 'Pittsburgh', state: 'PA', zip: '15230' },
    notes: 'The "fourth bureau" — fraud and identity verification',
  },
  {
    key: 'ars',
    name: 'ARS / Advanced Resolution Services',
    category: 'cra',
    address: { line1: 'P.O. Box 1378', city: 'Reston', state: 'VA', zip: '20195' },
    notes: 'Formerly Insurance Information Exchange',
  },
  {
    key: 'chexsystems',
    name: 'ChexSystems',
    category: 'cra',
    address: { line1: '7805 Hudson Rd Ste 100', city: 'Woodbury', state: 'MN', zip: '55125' },
    notes: 'Bank account / deposit history',
  },
  {
    key: 'early-warning',
    name: 'Early Warning Services',
    category: 'cra',
    address: { line1: '16552 N. 90th St.', city: 'Scottsdale', state: 'AZ', zip: '85260' },
    notes: 'Banking risk and fraud network',
  },
  {
    key: 'the-work-number',
    name: 'The Work Number (Equifax Workforce / Talx)',
    category: 'cra',
    address: { line1: 'P.O. Box 105068', city: 'Atlanta', state: 'GA', zip: '30348' },
    notes: 'Employment & income verification',
  },
  {
    key: 'sagestream',
    name: 'SageStream / LexisNexis SageStream',
    category: 'cra',
    address: { line1: 'P.O. Box 503793', city: 'San Diego', state: 'CA', zip: '92150' },
    notes: 'Alternative credit data feed',
  },
  {
    key: 'clarity',
    name: 'Clarity Services (Experian)',
    category: 'cra',
    address: { line1: 'P.O. Box 5717', city: 'Clearwater', state: 'FL', zip: '33758' },
    notes: 'Subprime / payday lending data',
  },
  {
    key: 'factor-trust',
    name: 'Factor Trust (TransUnion)',
    category: 'cra',
    address: { line1: 'P.O. Box 105108', city: 'Atlanta', state: 'GA', zip: '30348' },
    notes: 'Alternative credit data',
  },
  {
    key: 'datax',
    name: 'DataX',
    category: 'cra',
    address: { line1: '4500 Salisbury Rd Ste 100', city: 'Jacksonville', state: 'FL', zip: '32216' },
    notes: 'Subprime lending data',
  },
  {
    key: 'microbilt',
    name: 'MicroBilt / PRBC',
    category: 'cra',
    address: { line1: '1640 Airport Rd Ste 115', city: 'Kennesaw', state: 'GA', zip: '30144' },
    notes: 'Alternative credit data, rent reporting',
  },
  {
    key: 'teletrack',
    name: 'Teletrack (Equifax)',
    category: 'cra',
    address: { line1: 'P.O. Box 105108', city: 'Atlanta', state: 'GA', zip: '30348' },
    notes: 'Subprime / short-term credit history',
  },
]

export const ALL_AGENCIES: Agency[] = [
  BUREAUS.experian,
  BUREAUS.equifax,
  BUREAUS.transunion,
  ...THIRD_PARTY_AGENCIES,
]

export function getAgency(key: string): Agency | undefined {
  return ALL_AGENCIES.find((a) => a.key === key)
}

export function getBureau(b: Bureau): Agency {
  return BUREAUS[b]
}
