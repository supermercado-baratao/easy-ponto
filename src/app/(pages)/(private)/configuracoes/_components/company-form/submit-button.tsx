import { Button, Loader } from '@/app/components'

export const SubmitButton = ({ pending }: { pending: boolean }) => (
  <Button
    type="submit"
    form="company-form"
    className="flex-1"
    disabled={pending}
  >
    {!pending ? 'Salvar' : <Loader mode="inline" />}
  </Button>
)
