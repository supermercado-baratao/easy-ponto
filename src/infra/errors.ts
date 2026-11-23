export type TErrorResponse = {
  name: string
  message: string
  action: string
  statusCode: number
}

type TKnownErrorOptions = ErrorOptions & {
  message?: string
  action?: string
  statusCode?: number
}

// A failure the user can resolve: its message and action reach the client, unlike any other error
export class KnownError extends Error {
  public action: string
  public statusCode: number

  constructor({
    cause,
    message,
    action,
    statusCode
  }: ErrorOptions & { message: string; action: string; statusCode: number }) {
    super(message, { cause })
    this.name = 'KnownError'
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

export class ValidationError extends KnownError {
  constructor({
    cause,
    message = 'Um erro de validação ocorreu.',
    action = 'Ajuste os dados enviados e tente novamente.',
    statusCode = 400
  }: TKnownErrorOptions) {
    super({ cause, message, action, statusCode })
    this.name = 'ValidationError'
  }
}

// A record missing from the company is usually one another tab changed or removed
export class NotFoundError extends KnownError {
  constructor({
    cause,
    message = 'O registro não foi encontrado.',
    action = 'Atualize a página: ele pode ter sido alterado ou removido.',
    statusCode = 404
  }: TKnownErrorOptions) {
    super({ cause, message, action, statusCode })
    this.name = 'NotFoundError'
  }
}
