import { NotFoundError } from '@/infra/errors'

export class RestRuleNotFoundError extends NotFoundError {
  constructor(cause: string) {
    super({ message: 'A regra de folga não foi encontrada.', cause })
    this.name = 'RestRuleNotFoundError'
  }
}
