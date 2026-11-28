import { dayjs, wallClockNow } from '@/infra/dayjs'
import { companyModel } from '@/models/company/model'
import { SCHEDULE_AGENDA_DAYS } from '@/models/journey/utils'
import { journeyRulesModel } from '@/models/journey-rules/model'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { INACTIVE_USER_STATUSES, type TUserStatus } from '@/models/user/utils'
import { pendingItemRepository } from '@/repositories/pending-item-repository'
import { userRepository } from '@/repositories/user-repository'

import { PendingItemNotFoundError } from './errors'
import { dismissSchema, findManyByCompanyIdSchema, keySchema } from './schema'
import type {
  TDismissedPendingItem,
  TPendingItem,
  TPendingItemContext,
  TPendingItemDismissData,
  TPendingItemFindManyParams,
  TPendingItemKey,
  TPendingItems
} from './types'
import { detectPendingItems, isDismissible, isEditOnly } from './utils'

const DATE_FORMAT = 'YYYY-MM-DD'

const loadContext = async (companyId: string): Promise<TPendingItemContext> => {
  const today = wallClockNow().format(DATE_FORMAT)
  const [company, { journeyRules, overtimeBands }, users, shiftDays] =
    await Promise.all([
      companyModel.findUniqueById(companyId),
      journeyRulesModel.findByCompanyId(companyId),
      userRepository.findManyByCompanyId(companyId),
      shiftAssignmentModel.findCompanyDays({
        companyId,
        initialDate: today,
        finalDate: dayjs(today)
          .add(SCHEDULE_AGENDA_DAYS - 1, 'day')
          .format(DATE_FORMAT)
      })
    ])
  return {
    today,
    company,
    overtimeBands,
    users: users
      .filter(
        ({ status }) => !INACTIVE_USER_STATUSES.includes(status as TUserStatus)
      )
      .map(({ id, name }) => ({ id, name })),
    shiftDays,
    limits: journeyRules
  }
}

const findManyByCompanyId = async (
  params: TPendingItemFindManyParams
): Promise<TPendingItems> => {
  const { companyId, canEdit } = findManyByCompanyIdSchema.parse(params)
  const [context, dismissals] = await Promise.all([
    loadContext(companyId),
    pendingItemRepository.findDismissalsByCompanyId(companyId)
  ])
  const dismissalsByKey = new Map(
    dismissals.map((dismissal) => [dismissal.key, dismissal])
  )
  const open: TPendingItem[] = []
  const dismissed: TDismissedPendingItem[] = []
  const items = detectPendingItems(context).filter(
    (item) => canEdit || !isEditOnly(item)
  )
  for (const item of items) {
    const dismissal = isDismissible(item)
      ? dismissalsByKey.get(item.key)
      : undefined
    if (dismissal) {
      dismissed.push({
        ...item,
        dismissedAt: dismissal.createdAt,
        dismissedByName: dismissal.dismissedByName
      })
    } else {
      open.push(item)
    }
  }
  const { maxLunch, maxDailyJourney, maxContinuousWork } = context.limits
  return {
    open,
    dismissed,
    limits: { maxLunch, maxDailyJourney, maxContinuousWork }
  }
}

const countOpen = async (
  params: TPendingItemFindManyParams
): Promise<number> => {
  const { open } = await findManyByCompanyId(params)
  return open.length
}

const findDismissible = async ({
  companyId,
  key
}: TPendingItemKey): Promise<TPendingItem> => {
  const item = detectPendingItems(await loadContext(companyId)).find(
    (item) => item.key === key
  )
  if (!item) {
    throw new PendingItemNotFoundError(
      `Pending item ${key} not found in company ${companyId}`
    )
  }
  if (!isDismissible(item)) {
    throw new Error(`Pending item ${key} can't be dismissed`)
  }
  return item
}

const dismiss = async (data: TPendingItemDismissData): Promise<void> => {
  const validData = dismissSchema.parse(data)
  await findDismissible(validData)
  await pendingItemRepository.dismiss(validData)
}

const restore = async (params: TPendingItemKey): Promise<void> => {
  const validParams = keySchema.parse(params)
  if (!(await pendingItemRepository.restore(validParams))) {
    throw new PendingItemNotFoundError(
      `Dismissal ${validParams.key} not found in company ${validParams.companyId}`
    )
  }
}

export const pendingItemModel = {
  findManyByCompanyId,
  countOpen,
  dismiss,
  restore
}
