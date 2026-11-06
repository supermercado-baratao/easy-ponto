'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { FormCard, FormField, Select } from '@/app/components/ui/custom/form'
import { CardContent, CardFooter } from '@/app/components/ui/shadcn/card'
import { Field } from '@/app/components/ui/shadcn/field'
import type { Company } from '@/infra/database/types'

import { save } from './actions'
import { ImportButton } from './import-button'
import { SubmitButton } from './submit-button'
import { TCompanyState } from './types'

type TCompanyFormProps = {
  company: Company | null
  hasDevice: boolean
}

export const CompanyForm = ({ company, hasDevice }: TCompanyFormProps) => {
  const initialState: TCompanyState = {}
  const [state, formAction, pending] = useActionState(save, initialState)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Dados salvos com sucesso!')
      return
    }

    if (!state.fatalError) return

    toast.error('Um erro inesperado aconteceu!', {
      description: 'Atualize a página e tente novamente.'
    })
  }, [pending, state])

  return (
    <FormCard
      title="Empresa"
      description="Adicione as informações da empresa."
      className="h-fit"
    >
      <CardContent>
        <form
          key={company?.updatedAt.toISOString()}
          id="company-form"
          action={formAction}
          noValidate
        >
          <FormField
            name="name"
            label="Nome*"
            defaultValue={company?.name}
            error={state.errors?.name}
          />
          <FormField
            name="address"
            label="Endereço*"
            defaultValue={company?.address}
            error={state.errors?.address}
          />
          <FormField
            name="cpf"
            label="CPF do Responsável*"
            defaultValue={company?.cpf}
            error={state.errors?.cpf}
          />
          <Select
            name="tipoDoc"
            label="Tipo de Documento*"
            placeholder="Tipo utilizado no campo CPF/CNPJ"
            defaultValue={company?.tipoDoc.toString()}
            options={[
              { value: '0', label: '0 - CPF' },
              { value: '1', label: '1 - CNPJ' }
            ]}
            error={state.errors?.tipoDoc}
          />
          <FormField
            name="cpfCnpj"
            label="CPF/CNPJ*"
            defaultValue={company?.cpfCnpj}
            error={state.errors?.cpfCnpj}
          />
          <FormField
            name="cei"
            label="CEI*"
            defaultValue={company?.cei}
            error={state.errors?.cei}
          />
          <FormField
            name="registration"
            label="Inscrição"
            defaultValue={company?.registration ?? ''}
            error={state.errors?.registration}
          />
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          {hasDevice && <ImportButton isFormPending={pending} />}
          <SubmitButton pending={pending} />
        </Field>
      </CardFooter>
    </FormCard>
  )
}
