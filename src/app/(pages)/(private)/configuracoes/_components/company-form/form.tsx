'use client'

import { useEffect, useState } from 'react'
import { useFormState } from 'react-dom'
import { toast } from 'sonner'

import {
  CardContent,
  CardFooter,
  Field,
  FormCard,
  FormField,
  Select
} from '@/app/components'
import type {
  Company,
  DeviceCredentials
} from '@/infra/database/generated/client'

import { save } from './actions'
import { ImportButton } from './import-button'
import { SubmitButton } from './submit-button'
import { TCompanyState } from './types'

type TCompanyFormProps = {
  adminUserId: string
  company: Company | null
  deviceCredentials: DeviceCredentials | null
  setCompany: (company: Company) => void
}

export const CompanyForm = ({
  adminUserId,
  company,
  deviceCredentials,
  setCompany
}: TCompanyFormProps) => {
  const initialState: TCompanyState = {
    data: company
  }
  const [state, formAction, pending] = useFormState(save, initialState)
  const [formState, setFormState] = useState(initialState.data)

  useEffect(() => {
    if (state.success) {
      toast.success('Dados salvos com sucesso!')
      // eslint-disable-next-line react-hooks/set-state-in-effect -- #11 reworks this state
      setFormState(state.data)
      setCompany(state.data as Company)
      return
    }

    if (state.fatalError) {
      toast.error('Um erro inesperado aconteceu!', {
        description: 'Atualize a página e tente novamente.'
      })
      return
    }
  }, [pending])

  return (
    <FormCard
      title="Empresa"
      description="Adicione as informações da empresa."
      className="h-fit"
    >
      <CardContent>
        <form id="company-form" action={formAction} noValidate>
          <FormField
            name="name"
            label="Nome*"
            defaultValue={formState?.name}
            error={state.errors?.name}
          />
          <FormField
            name="address"
            label="Endereço*"
            defaultValue={formState?.address}
            error={state.errors?.address}
          />
          <FormField
            name="cpf"
            label="CPF do Responsável*"
            defaultValue={formState?.cpf}
            error={state.errors?.cpf}
          />
          <Select
            name="tipoDoc"
            label="Tipo de Documento*"
            placeholder="Tipo utilizado no campo CPF/CNPJ"
            defaultValue={formState?.tipoDoc.toString()}
            options={[
              { value: '0', label: '0 - CPF' },
              { value: '1', label: '1 - CNPJ' }
            ]}
            error={state.errors?.tipoDoc}
          />
          <FormField
            name="cpfCnpj"
            label="CPF/CNPJ*"
            defaultValue={formState?.cpfCnpj}
            error={state.errors?.cpfCnpj}
          />
          <FormField
            name="cei"
            label="CEI*"
            defaultValue={formState?.cei}
            error={state.errors?.cei}
          />
          <FormField
            name="registration"
            label="Inscrição"
            defaultValue={formState?.registration ?? ''}
            error={state.errors?.registration}
          />
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          {deviceCredentials && (
            <ImportButton
              adminUserId={adminUserId}
              deviceCredentials={deviceCredentials}
              pending={pending}
              setFormState={setFormState}
            />
          )}
          <SubmitButton pending={pending} />
        </Field>
      </CardFooter>
    </FormCard>
  )
}
