import { NotFoundError, ValidationError } from '@/infra/errors'

export class UserGroupNotFoundError extends NotFoundError {
  constructor(cause: string) {
    super({ message: 'O grupo não foi encontrado.', cause })
    this.name = 'UserGroupNotFoundError'
  }
}

export class UserGroupHasChildrenError extends ValidationError {
  constructor(name: string) {
    super({
      message: `O grupo ${name} tem grupos dentro dele.`,
      action: 'Remova ou mova os grupos de dentro dele antes.'
    })
    this.name = 'UserGroupHasChildrenError'
  }
}

export class UserGroupInRestrictionError extends ValidationError {
  constructor(name: string) {
    super({
      message: `O grupo ${name} tem um limite de folga.`,
      action: 'Remova o limite em Regras de Folga antes.'
    })
    this.name = 'UserGroupInRestrictionError'
  }
}
