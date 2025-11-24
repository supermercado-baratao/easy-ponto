export type TErrorResponse = {
  name: string
  message: string
  action: string
  status_code: number
}

export class InternalServerError extends Error {
  public action: string
  public statusCode: number

  constructor({ cause, statusCode }: ErrorOptions & { statusCode?: number }) {
    super('Um erro interno não esperado aconteceu', {
      cause
    })
    this.name = 'InternalServerError'
    this.action = 'Entre em contato com o suporte.'
    this.statusCode = statusCode || 500
  }

  toJSON(): TErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode
    }
  }
}

export class MethodNotAllowedError extends Error {
  public action: string
  public statusCode: number

  constructor() {
    super('Método não permitido para este endpoint.')
    this.name = 'MethodNotAllowedError'
    this.action =
      'Verifique se o método HTTP enviado é válido para este endpoint.'
    this.statusCode = 405
  }

  toJSON(): TErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode
    }
  }
}

export class DeviceCommunicationError extends Error {
  public action: string
  public statusCode: number

  constructor({ cause, statusCode }: ErrorOptions & { statusCode?: number }) {
    super(
      'Um erro na comunicação com o dispositivo de controle de ponto aconteceu',
      {
        cause
      }
    )
    this.name = 'DeviceCommunicationError'
    this.action =
      'Verifique se o dispositivo está conectado e se o IP está correto.'
    this.statusCode = statusCode || 500
  }

  toJSON(): TErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode
    }
  }
}
