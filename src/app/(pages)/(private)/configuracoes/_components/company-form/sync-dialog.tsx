import { type FormEvent, useId, useState } from 'react'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Checkbox } from '@/app/components/ui/shadcn/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/app/components/ui/shadcn/dialog'
import { Label } from '@/app/components/ui/shadcn/label'
import type {
  TCompanyChange,
  TDeviceCompanyField
} from '@/models/company/types'

const EMPTY_VALUE = 'Vazio'

export const SyncDialog = ({
  open,
  changes,
  pending,
  onSubmit,
  onCancel
}: {
  open: boolean
  changes: TCompanyChange[]
  pending: boolean
  onSubmit: (fields: TDeviceCompanyField[]) => void
  onCancel: () => void
}) => {
  const id = useId()
  const formId = `${id}-form`
  const [fields, setFields] = useState<TDeviceCompanyField[]>(() =>
    changes.map(({ field }) => field)
  )

  const toggle = (field: TDeviceCompanyField, checked: boolean): void =>
    setFields((current) =>
      checked
        ? [...current, field]
        : current.filter((selected) => selected !== field)
    )

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onSubmit(fields)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !pending && onCancel()}
    >
      <DialogContent className="max-h-[90dvh] grid-rows-[auto_1fr_auto] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dados diferentes no relógio</DialogTitle>
          <DialogDescription>
            Marque os campos que devem receber o valor do relógio. Os campos
            desmarcados mantêm o valor atual.
          </DialogDescription>
        </DialogHeader>
        <form
          id={formId}
          noValidate
          onSubmit={handleSubmit}
          className="-mx-4 flex flex-col gap-4 overflow-y-auto px-4"
        >
          {changes.map(({ field, label, current, device }) => (
            <Label
              key={field}
              className="flex items-start gap-3 rounded-lg border p-3 font-normal"
            >
              <Checkbox
                className="mt-0.5"
                checked={fields.includes(field)}
                onCheckedChange={(checked) => toggle(field, checked)}
              />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">
                  Atual: {current ?? EMPTY_VALUE}
                </span>
                <span>Relógio: {device ?? EMPTY_VALUE}</span>
              </span>
            </Label>
          ))}
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />} disabled={pending}>
            Cancelar
          </DialogClose>
          <Button
            type="submit"
            form={formId}
            disabled={pending || fields.length === 0}
            focusableWhenDisabled
          >
            {pending ? <Loader mode="inline" label="Aplicar" /> : 'Aplicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
