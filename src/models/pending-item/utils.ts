import { detectCompanySetup } from './_utils/company-setup'
import { detectRestRestrictionBreaks } from './_utils/rest-restriction-break'
import { detectScheduleAlerts } from './_utils/schedule-alert'
import { detectUnmovedRests } from './_utils/unmoved-rest'
import { detectUsersWithoutSchedule } from './_utils/user-without-schedule'
import type {
  TPendingItem,
  TPendingItemContext,
  TPendingItemDetector,
  TPendingItemType
} from './types'

// The order of the list is the order of the groups on the page
const PENDING_ITEM_DETECTORS: TPendingItemDetector[] = [
  detectCompanySetup,
  detectUsersWithoutSchedule,
  detectScheduleAlerts,
  detectUnmovedRests,
  detectRestRestrictionBreaks
]

// The setup is what lets the rest work, so it stays until it is done
const UNDISMISSIBLE_PENDING_ITEM_TYPES: ReadonlySet<TPendingItemType> = new Set(
  ['company-setup']
)

// The setup is done in /configuracoes, which only edits, so only the editors see it
const EDIT_ONLY_PENDING_ITEM_TYPES: ReadonlySet<TPendingItemType> = new Set([
  'company-setup'
])

export const isEditOnly = ({ type }: Pick<TPendingItem, 'type'>): boolean =>
  EDIT_ONLY_PENDING_ITEM_TYPES.has(type)

export const isDismissible = ({ type }: Pick<TPendingItem, 'type'>): boolean =>
  !UNDISMISSIBLE_PENDING_ITEM_TYPES.has(type)

export const detectPendingItems = (
  context: TPendingItemContext
): TPendingItem[] => PENDING_ITEM_DETECTORS.flatMap((detect) => detect(context))
