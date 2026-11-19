import { FormCard } from '@/app/components/ui/custom/form'
import { CardContent } from '@/app/components/ui/shadcn/card'

import { SetupForm } from './_components/setup-form/form'
import { redirectWhenSetUp } from './data'

const Setup = async () => {
  await redirectWhenSetUp()

  return (
    <FormCard
      title="Configuração inicial"
      titleAs="h1"
      description="Cadastre a empresa e a conta de quem vai administrá-la."
    >
      <CardContent>
        <SetupForm />
      </CardContent>
    </FormCard>
  )
}

export default Setup
