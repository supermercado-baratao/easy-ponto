'use client'

import { Company, DeviceCredentials } from '@prisma/client'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import {
  CardContent,
  CardFooter,
  Field,
  FormCard,
  FormField,
  Select
} from '@/app/components'

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
  const [state, formAction, pending] = useActionState(save, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success('Dados salvos com sucesso!')
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
          {deviceCredentials && (
            <ImportButton
              adminUserId={adminUserId}
              deviceCredentials={deviceCredentials}
              pending={pending}
              setCompany={setCompany}
            />
          )}
          <SubmitButton pending={pending} />
        </Field>
      </CardFooter>
    </FormCard>
  )
}
