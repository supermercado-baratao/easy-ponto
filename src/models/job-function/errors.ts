import { NotFoundError, ValidationError } from '@/infra/errors'

export class JobFunctionNotFoundError extends NotFoundError {
  constructor(cause: string) {
    super({ message: 'A função não foi encontrada.', cause })
    this.name = 'JobFunctionNotFoundError'
  }
}

export class JobFunctionInUseError extends ValidationError {
  constructor(name: string, count: number) {
    super({
      message:
        count === 1
          ? `A função ${name} está atribuída a 1 funcionário.`
          : `A função ${name} está atribuída a ${count} funcionários.`,
      action: 'Tire a função desses funcionários em Funcionários antes.'
    })
    this.name = 'JobFunctionInUseError'
  }
}
