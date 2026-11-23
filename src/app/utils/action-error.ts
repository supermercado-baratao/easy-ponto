import { toast } from 'sonner'

import type { TActionError } from '@/entry/action'

export const showActionError = ({
  fatalError,
  message,
  action
}: TActionError): boolean => {
  if (message) {
    toast.error(message, { description: action })
    return true
  }
  if (!fatalError) return false
  toast.error('Um erro inesperado aconteceu!', {
    description: 'Atualize a página e tente novamente.'
  })
  return true
}
