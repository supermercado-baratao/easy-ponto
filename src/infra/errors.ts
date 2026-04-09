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
    statusCode,
    action
  }: ErrorOptions & { statusCode?: number; action?: string }) {
    super('Um erro interno não esperado aconteceu', {
      cause
    })
    this.name = 'InternalServerError'
    this.action = action || 'Entre em contato com o suporte.'
    this.statusCode = statusCode || 500
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
    message,
    action,
    statusCode
  }: ErrorOptions & {
    message?: string
    action?: string
    statusCode?: number
  }) {
    super(message || 'Um erro de validação ocorreu.', {
      cause
    })
    this.name = 'ValidationError'
    this.action = action || 'Ajuste os dados enviados e tente novamente.'
    this.statusCode = statusCode || 400
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
