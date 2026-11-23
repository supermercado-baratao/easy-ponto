'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { ReportImportForm } from '@/app/components/blocks/report-import-form'
import type { THoursBankOrder } from '@/models/hours-bank/types'

import { getHoursReportHref } from '../utils'
import { importInitialBalance } from './actions'
import type { TInitialBalanceState } from './types'

export const ImportInitialBalanceButton = ({
  order
}: {
  order: THoursBankOrder
}) => {
  const router = useRouter()

  const handleSuccess = ({ data }: TInitialBalanceState): void => {
    if (!data) return
    const { startDate, endDate, unmatchedNames } = data
    toast.success('Saldo inicial importado com sucesso!')
    if (unmatchedNames.length > 0) {
      toast.warning('Funcionários do relatório não encontrados no Easy Ponto', {
        description: `${unmatchedNames.join(', ')}. Eles ficaram sem saldo inicial.`
      })
    }
    router.replace(
      getHoursReportHref({ initialDate: startDate, finalDate: endDate, order })
    )
  }

  return (
    <ReportImportForm action={importInitialBalance} onSuccess={handleSuccess}>
      Importar saldo inicial
    </ReportImportForm>
  )
}
