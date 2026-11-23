import { KnownError, ValidationError } from '@/infra/errors'

const CHECK_DEVICE_ACTION =
  'Confira se o relógio de ponto está ligado e conectado à rede e se o endereço IP em Configurações está correto.'

export class DeviceNotConfiguredError extends ValidationError {
  constructor() {
    super({
      message: 'O relógio de ponto não está cadastrado.',
      action: 'Cadastre o relógio de ponto em Configurações.'
    })
    this.name = 'DeviceNotConfiguredError'
  }
}

export class UnsupportedDeviceModelError extends ValidationError {
  constructor(model: string) {
    super({
      message: 'O modelo do relógio de ponto não é suportado.',
      action: 'Escolha um dos modelos disponíveis em Configurações.',
      cause: `Device model ${model} has no adapter`
    })
    this.name = 'UnsupportedDeviceModelError'
  }
}

export class DeviceAuthenticationError extends KnownError {
  constructor(cause: unknown) {
    super({
      message: 'O login ou a senha do relógio de ponto estão incorretos.',
      action: 'Corrija o login e a senha em Configurações e tente novamente.',
      statusCode: 401,
      cause
    })
    this.name = 'DeviceAuthenticationError'
  }
}

export class DeviceUnreachableError extends KnownError {
  constructor(cause: unknown) {
    super({
      message: 'O relógio de ponto não foi encontrado na rede.',
      action: CHECK_DEVICE_ACTION,
      statusCode: 503,
      cause
    })
    this.name = 'DeviceUnreachableError'
  }
}

export class DeviceTimeoutError extends KnownError {
  constructor(cause: unknown) {
    super({
      message: 'O relógio de ponto demorou demais para responder.',
      action: CHECK_DEVICE_ACTION,
      statusCode: 504,
      cause
    })
    this.name = 'DeviceTimeoutError'
  }
}

export class DeviceResponseError extends KnownError {
  constructor(cause: unknown) {
    super({
      message: 'O relógio de ponto respondeu de um jeito inesperado.',
      action:
        'Confira se o modelo escolhido em Configurações é o do relógio de ponto e tente novamente.',
      statusCode: 502,
      cause
    })
    this.name = 'DeviceResponseError'
  }
}
