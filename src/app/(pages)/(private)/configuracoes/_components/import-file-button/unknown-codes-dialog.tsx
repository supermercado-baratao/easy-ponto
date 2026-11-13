'use client'

import { type FormEvent, useId, useState } from 'react'

import { FormField, Select } from '@/app/components/ui/custom/form'
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
import {
  EFFECT_LABELS,
  JUSTIFICATION_EFFECTS
} from '@/models/justification-type/utils'
import type { TCodeResolution } from '@/models/synchronization/types'

const CREATE_CHOICE = 'create'

const EFFECT_OPTIONS = JUSTIFICATION_EFFECTS.map((effect) => ({
  value: effect,
  label: EFFECT_LABELS[effect]
}))

const readResolutions = (
  formData: FormData,
  codes: string[]
): Record<string, Partial<TCodeResolution>> =>
  Object.fromEntries(
    codes.map((code, index) => {
      const choice = formData.get(`choice-${index}`)
      if (choice === CREATE_CHOICE) {
        return [
          code,
          {
            action: 'create',
            code: String(formData.get(`code-${index}`)),
            description: String(formData.get(`description-${index}`)),
            effect: String(formData.get(`effect-${index}`))
          }
        ]
      }
      return [
        code,
        typeof choice === 'string' && choice !== ''
          ? { action: 'associate', typeId: choice }
          : {}
      ]
    })
  )

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
  types: { id: string; code: string; description: string }[]
  errors?: Record<string, string>
  pending: boolean
  onSubmit: (resolutions: Record<string, Partial<TCodeResolution>>) => void
  onCancel: () => void
}) => {
  const id = useId()
  const formId = `${id}-form`
  const [choices, setChoices] = useState<Record<string, string | null>>({})
  const choiceOptions = [
    { value: CREATE_CHOICE, label: 'Cadastrar um novo tipo' },
    ...types.map((type) => ({
      value: type.id,
      label: `${type.code} - ${type.description}`
    }))
  ]

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onSubmit(readResolutions(new FormData(event.currentTarget), codes))
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
            Escolha, para cada um, se ele vira um tipo novo ou se corresponde a
            um tipo já cadastrado. A escolha vale só para esta importação.
          </DialogDescription>
        </DialogHeader>
        <form
          id={formId}
          noValidate
          onSubmit={handleSubmit}
          className="-mx-4 flex flex-col gap-6 overflow-y-auto px-4"
        >
          {codes.map((code, index) => {
            const errorOf = (field: string): string | undefined =>
              errors?.[`${code}.${field}`]
            return (
              <fieldset key={code} className="flex flex-col gap-4">
                <legend className="mb-3 font-medium">Código {code}</legend>
                <Select
                  id={`${id}-choice-${index}`}
                  name={`choice-${index}`}
                  label="Tipo"
                  placeholder="Selecione o tipo"
                  options={choiceOptions}
                  onValueChange={(value) =>
                    setChoices((current) => ({ ...current, [code]: value }))
                  }
                  error={errorOf('action') ?? errorOf('typeId')}
                />
                {choices[code] === CREATE_CHOICE && (
                  <>
                    <FormField
                      id={`${id}-code-${index}`}
                      name={`code-${index}`}
                      label="Código"
                      defaultValue={code}
                      error={errorOf('code')}
                      aria-invalid={errorOf('code') ? true : undefined}
                    />
                    <FormField
                      id={`${id}-description-${index}`}
                      name={`description-${index}`}
                      label="Descrição"
                      error={errorOf('description')}
                      aria-invalid={errorOf('description') ? true : undefined}
                    />
                    <Select
                      id={`${id}-effect-${index}`}
                      name={`effect-${index}`}
                      label="Efeito"
                      placeholder="Selecione o efeito"
                      options={EFFECT_OPTIONS}
                      error={errorOf('effect')}
                    />
                  </>
                )}
              </fieldset>
            )
          })}
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />} disabled={pending}>
            Cancelar
          </DialogClose>
          <Button type="submit" form={formId} disabled={pending}>
            {pending ? <Loader mode="inline" /> : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
