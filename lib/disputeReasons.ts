import type { DisputeReason } from './credit-repair-types'

// ============================================
// FCRA Dispute Reasons — Standard Library
// ============================================
// Each reason includes the corresponding FCRA citation so the letter
// generator can pull the right legal language automatically.

export const DISPUTE_REASONS: DisputeReason[] = [
  {
    code: 'not-mine',
    label: 'Not mine / Account does not belong to me',
    description:
      'I have no record of this account. It does not belong to me and was not opened by me.',
    fcraCitation: 'FCRA §611',
  },
  {
    code: 'fraud',
    label: 'Account fraudulent / Identity theft',
    description:
      'This account was opened or used as a result of identity theft. I demand block under FCRA §605B.',
    fcraCitation: 'FCRA §605B',
    highPriority: true,
    requiresIdTheftReport: true,
  },
  {
    code: 'never-late',
    label: 'Never late / Incorrect payment history',
    description:
      'The payment history is reported inaccurately. I have never been late on this account.',
    fcraCitation: 'FCRA §623',
    itemTypes: ['late-payment', 'charge-off'],
  },
  {
    code: 'paid-in-full',
    label: 'Already paid in full / Account satisfied',
    description: 'This account has been paid and satisfied in full.',
    fcraCitation: 'FCRA §623',
  },
  {
    code: 'closed-by-consumer',
    label: 'Account closed by consumer',
    description:
      'I voluntarily closed this account. The status reported is inaccurate.',
    fcraCitation: 'FCRA §623',
  },
  {
    code: 'duplicate',
    label: 'Duplicate account',
    description:
      'This account is already being reported under a different tradeline. Reporting it twice is inaccurate.',
    fcraCitation: 'FCRA §611',
  },
  {
    code: 'incorrect-balance',
    label: 'Incorrect balance',
    description: 'The balance reported does not match my records.',
    fcraCitation: 'FCRA §623',
  },
  {
    code: 'incorrect-dates',
    label: 'Incorrect date opened / Date of last activity',
    description:
      'The date opened or date of last activity is reported inaccurately and must be corrected.',
    fcraCitation: 'FCRA §623',
  },
  {
    code: 'incorrect-creditor',
    label: 'Incorrect creditor name',
    description:
      'The creditor name on this account is inaccurate or unfamiliar.',
    fcraCitation: 'FCRA §611',
  },
  {
    code: 'included-in-bk',
    label: 'Account included in bankruptcy',
    description:
      'This debt was discharged in bankruptcy and should reflect a $0 balance with the appropriate status.',
    fcraCitation: 'FCRA §623',
  },
  {
    code: 'past-sol',
    label: 'Past statute of limitations',
    description:
      'This debt is past the statute of limitations and is no longer legally collectible.',
    fcraCitation: 'FCRA §605',
  },
  {
    code: 'outdated',
    label: 'Outdated information (over 7 years / 10 years for BK)',
    description:
      'This item exceeds the FCRA reporting period and must be removed.',
    fcraCitation: 'FCRA §605',
  },
  {
    code: 'authorized-user',
    label: 'Account belongs to authorized user only',
    description:
      'I am only an authorized user on this account and should not be held responsible for its history.',
    fcraCitation: 'FCRA §623',
  },
  {
    code: 'unauthorized-inquiry',
    label: 'Inquiry not authorized',
    description:
      'I did not authorize this hard inquiry. There is no permissible purpose for it.',
    fcraCitation: 'FCRA §604',
    itemTypes: ['inquiry'],
  },
  {
    code: 'cannot-verify',
    label: 'Information could not be verified',
    description:
      'The furnisher cannot verify the accuracy of this information. Reinvestigation is required.',
    fcraCitation: 'FCRA §611(a)(1)(A)',
  },
  {
    code: 'mixed-file',
    label: 'Mixed file / Wrong consumer',
    description:
      'This information belongs to another consumer and was added to my file in error.',
    fcraCitation: 'FCRA §611',
  },
  {
    code: 'goodwill',
    label: 'Goodwill removal request',
    description:
      'I am requesting a goodwill removal of this item based on my otherwise positive history.',
  },
  {
    code: 'other',
    label: 'Other / Custom reason',
    description: 'See additional details for the specific reason.',
    fcraCitation: 'FCRA §611',
  },
]

export function getReason(code: string): DisputeReason | undefined {
  return DISPUTE_REASONS.find((r) => r.code === code)
}

export function reasonsForItemType(type: string): DisputeReason[] {
  return DISPUTE_REASONS.filter(
    (r) => !r.itemTypes || r.itemTypes.includes(type as any)
  )
}
