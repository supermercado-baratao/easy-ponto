import { NotFoundError } from '@/infra/errors'

export class PendingItemNotFoundError extends NotFoundError {
  constructor(cause: string) {
    super({
      message: 'A pendência não foi encontrada.',
      action: 'Atualize a página: ela pode ter sido resolvida.',
      cause
    })
    this.name = 'PendingItemNotFoundError'
  }
}
