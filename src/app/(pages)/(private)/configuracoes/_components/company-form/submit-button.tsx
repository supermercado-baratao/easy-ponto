import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'

export const SubmitButton = ({ pending }: { pending: boolean }) => (
  <Button
    type="submit"
    form="company-form"
    className="flex-1"
    disabled={pending}
  >
    {pending ? <Loader mode="inline" /> : 'Salvar'}
  </Button>
)
