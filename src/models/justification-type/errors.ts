import { ValidationError } from '@/infra/errors'

export class JustificationTypeInUseError extends ValidationError {
  constructor(name: string) {
    super({
      message: `O tipo ${name} está em uso em justificativas.`,
      action: 'Remova ou mude o tipo dessas justificativas antes.'
    })
    this.name = 'JustificationTypeInUseError'
  }
}
