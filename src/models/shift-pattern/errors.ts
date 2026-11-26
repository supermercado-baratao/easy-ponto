import { NotFoundError, ValidationError } from '@/infra/errors'

export class ShiftPatternNotFoundError extends NotFoundError {
  constructor(cause: string) {
    super({ message: 'A escala não foi encontrada.', cause })
    this.name = 'ShiftPatternNotFoundError'
  }
}

export class ShiftPatternVersionNotFoundError extends NotFoundError {
  constructor(cause: string) {
    super({ message: 'A versão da escala não foi encontrada.', cause })
    this.name = 'ShiftPatternVersionNotFoundError'
  }
}

export class LastShiftPatternVersionError extends ValidationError {
  constructor(name: string) {
    super({
      message: `A escala ${name} tem só esta versão.`,
      action: 'Cadastre outra versão antes ou remova a escala.'
    })
    this.name = 'LastShiftPatternVersionError'
  }
}
