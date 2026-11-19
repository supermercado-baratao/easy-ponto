import { FormCard } from '@/app/components/ui/custom/form'
import { CardContent } from '@/app/components/ui/shadcn/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/app/components/ui/shadcn/tabs'

import { CpfSignInForm } from './_components/cpf-sign-in-form/form'
import { EmailSignInForm } from './_components/email-sign-in-form/form'
import { redirectSignedInUser } from './data'

const SignIn = async () => {
  await redirectSignedInUser()

  return (
    <FormCard
      title="Entrar"
      titleAs="h1"
      description="Acesse o Easy Ponto da sua empresa."
    >
      <CardContent>
        <Tabs defaultValue="email">
          <TabsList className="w-full">
            <TabsTrigger value="email">E-mail</TabsTrigger>
            <TabsTrigger value="cpf">CPF</TabsTrigger>
          </TabsList>
          <TabsContent value="email" keepMounted className="pt-4">
            <EmailSignInForm />
          </TabsContent>
          <TabsContent value="cpf" keepMounted className="pt-4">
            <CpfSignInForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </FormCard>
  )
}

export default SignIn
