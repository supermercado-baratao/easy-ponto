import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import type { TShiftPatternWithVersions } from '@/infra/database/types'

import { ShiftPatternSection } from './shift-pattern-section'
import { ShiftPatternSheet } from './shift-pattern-sheet/shift-pattern-sheet'

export const MainContent = ({
  shiftPatterns,
  today,
  canEdit
}: {
  shiftPatterns: TShiftPatternWithVersions[]
  today: string
  canEdit: boolean
}) => (
  <>
    <Header title="Escalas">
      {canEdit && (
        <ShiftPatternSheet
          mode="create"
          description="A escala repete um ciclo de dias de trabalho e de folga."
          defaultValues={{ startDate: today }}
        />
      )}
    </Header>
    <_MainContent className="flex flex-col gap-6">
      {shiftPatterns.length > 0 ? (
        shiftPatterns.map((shiftPattern) => (
          <ShiftPatternSection
            key={shiftPattern.id}
            shiftPattern={shiftPattern}
            today={today}
            canEdit={canEdit}
          />
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma escala cadastrada
        </p>
      )}
    </_MainContent>
  </>
)
