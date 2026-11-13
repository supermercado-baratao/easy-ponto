import { ValidationError } from '@/infra/errors'

export class HoursBankCloseError extends ValidationError {
  constructor(message: string) {
    super({
      message,
      action: 'Ajuste o período e tente novamente.'
    })
    this.name = 'HoursBankCloseError'
  }
}

export class HoursBankReopenError extends ValidationError {
  constructor() {
    super({
      message: 'Só o último período fechado pode ser reaberto.',
      action: 'Reabra antes os períodos fechados depois dele.'
    })
    this.name = 'HoursBankReopenError'
  }
}

export class HoursBankAdjustmentClosedError extends ValidationError {
  constructor() {
    super({
      message: 'Esse ajuste está num período fechado.',
      action: 'Reabra o período para mudar o ajuste.'
    })
    this.name = 'HoursBankAdjustmentClosedError'
  }
}

export class HoursBankInitialBalanceError extends ValidationError {
  constructor() {
    super({
      message:
        'O saldo inicial só pode ser importado antes do primeiro fechamento.',
      action:
        'Reabra os períodos fechados para importar o saldo inicial de novo.'
    })
    this.name = 'HoursBankInitialBalanceError'
  }
}
