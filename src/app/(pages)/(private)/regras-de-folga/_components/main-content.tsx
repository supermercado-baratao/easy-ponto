import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'

import { GenerateRestsDialog } from './generate-rests-dialog/generate-rests-dialog'
import { RestRuleSheet } from './rest-rule-sheet/rest-rule-sheet'
import { RestRulesTable } from './rest-rules-table'
import type { TRestRulesPageData } from './types'

export const MainContent = ({
  rules,
  shiftPatterns,
  nextMonth,
  canEdit
}: TRestRulesPageData) => (
  <>
    <Header title="Regras de Folga">
      {canEdit && (
        <div className="flex gap-2">
          {rules.length > 0 && <GenerateRestsDialog defaultMonth={nextMonth} />}
          <RestRuleSheet
            rules={rules}
            shiftPatterns={shiftPatterns}
            defaultValues={{ holidayRest: 'window', distances: '2, 4, 6, 1' }}
          />
        </div>
      )}
    </Header>
    <_MainContent className="flex flex-col gap-6">
      <p className="max-w-prose text-sm text-muted-foreground">
        Uma regra de folga diz em que dias do mês a folga da escala pode cair e
        para onde ela vai quando cai fora deles. As folgas movidas são salvas
        como ajustes do dia, que aparecem no Calendário, e a escala não muda.
      </p>
      {rules.length > 0 ? (
        <RestRulesTable
          rules={rules}
          shiftPatterns={shiftPatterns}
          canEdit={canEdit}
        />
      ) : (
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>Nenhuma regra de folga cadastrada</p>
          {canEdit && (
            <p>Sem uma regra, as folgas seguem a escala de cada funcionário.</p>
          )}
        </div>
      )}
    </_MainContent>
  </>
)
