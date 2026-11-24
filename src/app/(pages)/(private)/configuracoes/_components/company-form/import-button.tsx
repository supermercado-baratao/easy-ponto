import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { showActionError } from '@/app/utils/action-error'
import type {
  TCompanyChange,
  TDeviceCompanyField
} from '@/models/company/types'

import { importFromDevice, loadDeviceChanges } from './actions'
import { ImportDialog } from './import-dialog'

export const ImportButton = ({ isFormPending }: { isFormPending: boolean }) => {
  const [changes, setChanges] = useState<TCompanyChange[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, startLoading] = useTransition()
  const [isImporting, startImporting] = useTransition()

  const loadChanges = (): void => {
    startLoading(async () => {
      const result = await loadDeviceChanges()
      if (!result.success || !result.data) {
        showActionError(result)
        return
      }
      if (result.data.length === 0) {
        toast.info('Os dados da empresa já estão iguais aos do relógio.')
        return
      }
      setChanges(result.data)
      setIsDialogOpen(true)
    })
  }

  const applyChanges = (fields: TDeviceCompanyField[]): void => {
    startImporting(async () => {
      const result = await importFromDevice(fields)
      if (!result.success) {
        showActionError(result)
        return
      }
      setIsDialogOpen(false)
      toast.success('Dados importados com sucesso!')
    })
  }

  const isPending = isLoading || isFormPending

  return (
    <>
      <Button
        variant="outline"
        type="button"
        disabled={isPending}
        focusableWhenDisabled
        className="w-1/5 min-w-20"
        onClick={loadChanges}
      >
        {isPending ? <Loader mode="inline" label="Importar" /> : 'Importar'}
      </Button>
      <ImportDialog
        key={changes.map(({ field, device }) => `${field}:${device}`).join(',')}
        open={isDialogOpen}
        changes={changes}
        pending={isImporting}
        onSubmit={applyChanges}
        onCancel={() => setIsDialogOpen(false)}
      />
    </>
  )
}
