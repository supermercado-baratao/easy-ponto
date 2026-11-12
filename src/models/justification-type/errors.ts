import { ValidationError } from '@/infra/errors'

export class JustificationTypeInUseError extends ValidationError {
  constructor(code: string) {
    super({
      message: `O tipo ${code} está em uso em justificativas.`,
      action: 'Remova ou mude o tipo dessas justificativas antes.'
    })
    this.name = 'JustificationTypeInUseError'
  }
}
