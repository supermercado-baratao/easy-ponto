'use client'

import { type FormEvent, useId, useState } from 'react'

import { JustificationTypeForm } from '@/app/components/blocks/justification-type-form/justification-type-form'
import type { TSavedJustificationType } from '@/app/components/blocks/justification-type-form/types'
import { Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/app/components/ui/shadcn/dialog'
import type { TCodeResolutions } from '@/models/synchronization/types'

const CREATE_CHOICE = 'create'

export const UnknownCodesDialog = ({
  open,
  codes,
  types,
  errors,
  pending,
  onSubmit,
  onCancel
}: {
  open: boolean
  codes: string[]
  types: TSavedJustificationType[]
  errors?: Record<string, string>
  pending: boolean
  onSubmit: (resolutions: TCodeResolutions) => void
  onCancel: () => void
}) => {
  const id = useId()
  const formId = `${id}-form`
  const [createdTypes, setCreatedTypes] = useState<TSavedJustificationType[]>(
    []
  )
  const [choices, setChoices] = useState<Record<string, string>>({})
  // Remounts the select of a code after the new type dialog, so it shows the created type or the previous choice
  const [revisions, setRevisions] = useState<Record<string, number>>({})
  const [creatingCode, setCreatingCode] = useState<string | null>(null)
  const choiceOptions = [
    { value: CREATE_CHOICE, label: 'Cadastrar um novo tipo' },
    ...[...types, ...createdTypes]
      .toSorted((first, second) => first.name.localeCompare(second.name))
      .map((type) => ({ value: type.id, label: type.name }))
  ]

  const chooseType = (code: string, value: string | null): void => {
    if (value === CREATE_CHOICE) {
      setCreatingCode(code)
      return
    }
    setChoices((current) => ({ ...current, [code]: value ?? '' }))
  }

  const closeCreation = (type?: TSavedJustificationType): void => {
    if (!creatingCode) return
    if (type) {
      setCreatedTypes((current) => [...current, type])
      setChoices((current) => ({ ...current, [creatingCode]: type.id }))
    }
    setRevisions((current) => ({
      ...current,
      [creatingCode]: (current[creatingCode] ?? 0) + 1
    }))
    setCreatingCode(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onSubmit(
      Object.fromEntries(codes.map((code) => [code, choices[code] ?? '']))
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !pending && onCancel()}
    >
      <DialogContent className="max-h-[90dvh] grid-rows-[auto_1fr_auto] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Códigos de justificativa desconhecidos</DialogTitle>
          <DialogDescription>
            O relatório tem códigos sem um tipo de justificativa cadastrado.
            Escolha, para cada um, o tipo que corresponde a ele ou cadastre um
            novo. A escolha fica salva para as próximas importações.
          </DialogDescription>
        </DialogHeader>
        <form
          id={formId}
          noValidate
          onSubmit={handleSubmit}
          className="-mx-4 flex flex-col gap-6 overflow-y-auto px-4"
        >
          {codes.map((code, index) => (
            <fieldset key={code} className="flex flex-col gap-4">
              <legend className="mb-3 font-medium">Código {code}</legend>
              <Select
                key={revisions[code] ?? 0}
                id={`${id}-choice-${index}`}
                name={`choice-${index}`}
                label="Tipo"
                placeholder="Selecione o tipo"
                options={choiceOptions}
                defaultValue={choices[code]}
                onValueChange={(value) => chooseType(code, value)}
                error={errors?.[code]}
              />
            </fieldset>
          ))}
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />} disabled={pending}>
            Cancelar
          </DialogClose>
          <Button
            type="submit"
            form={formId}
            disabled={pending}
            focusableWhenDisabled
          >
            {pending ? <Loader mode="inline" label="Importar" /> : 'Importar'}
          </Button>
        </DialogFooter>
        <Dialog
          open={creatingCode !== null}
          onOpenChange={(isOpen) => !isOpen && closeCreation()}
        >
          <DialogContent className="max-h-[90dvh] grid-rows-[auto_1fr_auto] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar tipo</DialogTitle>
              <DialogDescription>
                O novo tipo fica escolhido para o código {creatingCode}.
              </DialogDescription>
            </DialogHeader>
            {creatingCode !== null && (
              <JustificationTypeForm
                defaultValues={{ name: creatingCode }}
                onSaved={closeCreation}
                className="-mx-4 px-4"
                renderFooter={(submitButton) => (
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      Cancelar
                    </DialogClose>
                    {submitButton}
                  </DialogFooter>
                )}
              />
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
