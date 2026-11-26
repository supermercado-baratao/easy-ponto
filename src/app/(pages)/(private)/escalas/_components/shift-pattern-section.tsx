import type {
  TShiftPatternVersionWithDays,
  TShiftPatternWithVersions
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { selectVersionInEffect } from '@/models/shift-pattern/utils'

import { CycleTable } from './cycle-table'
import { RemoveButton } from './remove-button/remove-button'
import { ShiftPatternSheet } from './shift-pattern-sheet/shift-pattern-sheet'
import type { TShiftPatternFormValues } from './shift-pattern-sheet/types'
import { getDayFormValues } from './shift-pattern-sheet/utils'
import { getCycleSummary } from './utils'

const formatDate = (date: string): string => dayjs(date).format('DD/MM/YYYY')

const getVersionFormValues = (
  version: TShiftPatternVersionWithDays
): TShiftPatternFormValues => ({
  cycleLength: String(version.cycleLength),
  ...getDayFormValues(version.days)
})

const getVersionStatus = (
  version: TShiftPatternVersionWithDays,
  versionInEffect: TShiftPatternVersionWithDays | null,
  today: string
): string | undefined => {
  if (version.id === versionInEffect?.id && version.startDate <= today)
    return 'Em vigor'
  if (version.startDate > today) return 'Futura'
}

export const ShiftPatternSection = ({
  shiftPattern,
  today,
  canEdit
}: {
  shiftPattern: TShiftPatternWithVersions
  today: string
  canEdit: boolean
}) => {
  const titleId = `shift-pattern-${shiftPattern.id}-title`
  const versionInEffect = selectVersionInEffect(shiftPattern.versions, today)
  const hasManyVersions = shiftPattern.versions.length > 1
  const newVersionButtonId = `shift-pattern-${shiftPattern.id}-new-version`

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-lg border p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={titleId} className="text-base font-medium">
          {shiftPattern.name}
        </h2>
        {canEdit && (
          <div className="flex items-center gap-1">
            {versionInEffect && (
              <ShiftPatternSheet
                mode="new-version"
                label={`Nova versão de ${shiftPattern.name}`}
                triggerId={newVersionButtonId}
                description={shiftPattern.name}
                defaultValues={{
                  id: shiftPattern.id,
                  name: shiftPattern.name,
                  startDate: today,
                  ...getVersionFormValues(versionInEffect)
                }}
              />
            )}
            <RemoveButton
              id={shiftPattern.id}
              target="shift-pattern"
              label={`Remover ${shiftPattern.name}`}
              title="Remover escala?"
              description={`A escala ${shiftPattern.name} e todas as suas versões serão removidas.`}
            />
          </div>
        )}
      </div>
      {shiftPattern.versions.map((version) => {
        const versionTitleId = `shift-pattern-version-${version.id}-title`
        const startDate = formatDate(version.startDate)
        const status = getVersionStatus(version, versionInEffect, today)

        return (
          <section
            key={version.id}
            aria-labelledby={versionTitleId}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <h3 id={versionTitleId} className="text-sm font-medium">
                  {`A partir de ${startDate}`}
                  {status && (
                    <span className="font-normal text-muted-foreground">
                      {` · ${status}`}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {getCycleSummary(version)}
                </p>
              </div>
              {canEdit && (
                <div className="flex items-center gap-1">
                  <ShiftPatternSheet
                    mode="edit-version"
                    label={`Editar a versão de ${startDate} de ${shiftPattern.name}`}
                    description={`${shiftPattern.name}, a partir de ${startDate}`}
                    defaultValues={{
                      id: shiftPattern.id,
                      versionId: version.id,
                      name: shiftPattern.name,
                      startDate: version.startDate,
                      ...getVersionFormValues(version)
                    }}
                  />
                  {hasManyVersions && (
                    <RemoveButton
                      id={version.id}
                      target="version"
                      label={`Remover a versão de ${startDate} de ${shiftPattern.name}`}
                      title="Remover versão?"
                      description={`A versão de ${startDate} da escala ${shiftPattern.name} será removida.`}
                      focusAfterRemovalId={newVersionButtonId}
                    />
                  )}
                </div>
              )}
            </div>
            <CycleTable
              version={version}
              labelledBy={`${titleId} ${versionTitleId}`}
            />
          </section>
        )
      })}
    </section>
  )
}
