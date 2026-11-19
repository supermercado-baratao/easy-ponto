import { cn } from 'cn'
import Link from 'next/link'

import { FormCard } from '@/app/components/ui/custom/form'
import { buttonVariants } from '@/app/components/ui/shadcn/button'
import { CardContent } from '@/app/components/ui/shadcn/card'

import { ChangePasswordForm } from './_components/change-password-form/form'
import { getChangePasswordPageData } from './data'

const ChangePassword = async () => {
  const { mustChangePassword, homePath } = await getChangePasswordPageData()

  return (
    <FormCard
      title="Trocar senha"
      titleAs="h1"
      description={
        mustChangePassword
          ? 'Crie uma nova senha para continuar.'
          : 'Informe a senha atual e a nova senha.'
      }
    >
      <CardContent>
        <ChangePasswordForm />
        {!mustChangePassword && (
          <Link
            href={homePath}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'mt-4 w-full'
            )}
          >
            Voltar
          </Link>
        )}
      </CardContent>
    </FormCard>
  )
}

export default ChangePassword
