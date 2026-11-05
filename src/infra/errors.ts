export type TErrorResponse = {
  name: string
  message: string
  action: string
  statusCode: number
}

export class InternalServerError extends Error {
  public action: string
  public statusCode: number

  constructor({
    cause,
    statusCode = 500,
    action = 'Entre em contato com o suporte.'
  }: ErrorOptions & { statusCode?: number; action?: string }) {
    super('Um erro interno não esperado aconteceu', {
      cause
    })
    this.name = 'InternalServerError'
    this.action = action
    this.statusCode = statusCode
  }

  toJSON(): TErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode
    }
  }
}

export class ValidationError extends Error {
  public action: string
  public statusCode: number

  constructor({
    cause,
    message = 'Um erro de validação ocorreu.',
    action = 'Ajuste os dados enviados e tente novamente.',
    statusCode = 400
  }: ErrorOptions & {
    message?: string
    action?: string
    statusCode?: number
  }) {
    super(message, {
      cause
    })
    this.name = 'ValidationError'
    this.action = action
    this.statusCode = statusCode
  }

  toJSON(): TErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode
    }
  }
}
