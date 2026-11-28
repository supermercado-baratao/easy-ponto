import Link from 'next/link'

import { buttonVariants } from '@/app/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/app/components/ui/shadcn/card'
import { toWallClock } from '@/infra/dayjs'
import type { TScheduleAlertLimits } from '@/models/journey/types'
import type {
  TDismissedPendingItem,
  TPendingItem
} from '@/models/pending-item/types'
import { isDismissible } from '@/models/pending-item/utils'

import { DismissalButton } from './dismissal-button/dismissal-button'
import {
  getPendingItemLabel,
  getResolvePath,
  groupPendingItems,
  PENDING_ITEM_GROUPS
} from './utils'

const isDismissed = (
  item: TPendingItem | TDismissedPendingItem
): item is TDismissedPendingItem => 'dismissedAt' in item

const getDismissalLabel = ({
  dismissedAt,
  dismissedByName
}: TDismissedPendingItem): string => {
  const date = toWallClock(dismissedAt).format('DD/MM/YYYY')
  return dismissedByName
    ? `Dispensada por ${dismissedByName} em ${date}`
    : `Dispensada em ${date}`
}

export const PendingItemGroups = ({
  items,
  limits,
  canEdit,
  idPrefix
}: {
  items: TPendingItem[] | TDismissedPendingItem[]
  idPrefix: string
  limits: TScheduleAlertLimits
  canEdit: boolean
}) => {
  // The viewer edits nothing on the pages the links lead to
  const linkText = canEdit ? 'Resolver' : 'Ver'
  return groupPendingItems<TPendingItem | TDismissedPendingItem>(items).map(
    ({ type, items }) => (
      <Card
        key={type}
        role="region"
        aria-labelledby={`${idPrefix}-${type}-title`}
      >
        <CardHeader>
          <CardTitle>
            <h2 id={`${idPrefix}-${type}-title`}>
              {PENDING_ITEM_GROUPS[type].title} ({items.length})
            </h2>
          </CardTitle>
          <CardDescription>
            {PENDING_ITEM_GROUPS[type].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {items.map((item) => {
              const { title, description } = getPendingItemLabel(item, limits)
              const label = description ? `${title} · ${description}` : title
              return (
                <li
                  key={item.key}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{title}</span>
                    {description && (
                      <span className="text-sm text-muted-foreground">
                        {description}
                      </span>
                    )}
                    {isDismissed(item) && (
                      <span className="text-xs text-muted-foreground">
                        {getDismissalLabel(item)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={getResolvePath(item)}
                      className={buttonVariants({
                        variant: 'outline',
                        size: 'sm'
                      })}
                      aria-label={`${linkText}: ${label}`}
                    >
                      {linkText}
                    </Link>
                    {canEdit && isDismissible(item) && (
                      <DismissalButton
                        mode={isDismissed(item) ? 'restore' : 'dismiss'}
                        itemKey={item.key}
                        itemLabel={label}
                        focusTargetId={`${idPrefix}-tab`}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    )
  )
}
