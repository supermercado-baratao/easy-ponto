import { NotFoundError } from '@/infra/errors'

export class RestRestrictionNotFoundError extends NotFoundError {
  constructor(cause: string) {
    super({ message: 'A restrição de folga não foi encontrada.', cause })
    this.name = 'RestRestrictionNotFoundError'
  }
}
