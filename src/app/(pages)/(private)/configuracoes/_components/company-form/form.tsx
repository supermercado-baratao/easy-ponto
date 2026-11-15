'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { FormCard, FormField, Select } from '@/app/components/ui/custom/form'
import { CardContent, CardFooter } from '@/app/components/ui/shadcn/card'
import { Field } from '@/app/components/ui/shadcn/field'
import type { Company } from '@/infra/database/types'

import { save } from './actions'
import { ImportButton } from './import-button'
import { SubmitButton } from './submit-button'
import type { TCompanyFormValues, TCompanyState } from './types'

type TCompanyFormProps = {
  company: Company | null
  hasDevice: boolean
}

const toFormValues = (company: Company | null): TCompanyFormValues => ({
  name: company?.name,
  address: company?.address,
  cpf: company?.cpf,
  tipoDoc: company?.tipoDoc.toString(),
  cpfCnpj: company?.cpfCnpj,
  cei: company?.cei,
  registration: company?.registration ?? ''
})

export const CompanyForm = ({ company, hasDevice }: TCompanyFormProps) => {
  const initialState: TCompanyState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const formReference = useRef<HTMLFormElement>(null)
  const updatedAt = company?.updatedAt.toISOString()
  // An import replaces the company, so what was typed for the previous one no longer applies (#56)
  const isSameCompany = state.values?.updatedAt === updatedAt
  const values = (isSameCompany && state.values) || toFormValues(company)
  const errors = isSameCompany ? state.errors : undefined

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Dados salvos com sucesso!')
      return
    }

    if (state.errors) {
      formReference.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus()
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
          ref={formReference}
          key={updatedAt}
          id="company-form"
          action={formAction}
          noValidate
        >
          {updatedAt && (
            <input type="hidden" name="updatedAt" value={updatedAt} />
          )}
          <FormField
            name="name"
            label="Nome*"
            defaultValue={values.name}
            error={errors?.name}
          />
          <FormField
            name="address"
            label="Endereço*"
            defaultValue={values.address}
            error={errors?.address}
          />
          <FormField
            name="cpf"
            label="CPF do Responsável*"
            defaultValue={values.cpf}
            error={errors?.cpf}
          />
          <Select
            name="tipoDoc"
            label="Tipo de Documento*"
            placeholder="Tipo utilizado no campo CPF/CNPJ"
            defaultValue={values.tipoDoc}
            options={[
              { value: '0', label: '0 - CPF' },
              { value: '1', label: '1 - CNPJ' }
            ]}
            error={errors?.tipoDoc}
          />
          <FormField
            name="cpfCnpj"
            label="CPF/CNPJ*"
            defaultValue={values.cpfCnpj}
            error={errors?.cpfCnpj}
          />
          <FormField
            name="cei"
            label="CEI*"
            defaultValue={values.cei}
            error={errors?.cei}
          />
          <FormField
            name="registration"
            label="Inscrição"
            defaultValue={values.registration}
            error={errors?.registration}
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
