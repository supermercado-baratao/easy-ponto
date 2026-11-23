import { ValidationError } from '@/infra/errors'

export class InvalidExcelFileError extends ValidationError {
  constructor(cause: Error) {
    super({
      message: 'O arquivo Excel não está no formato esperado.',
      action:
        'Verifique se o relatório foi gerado contendo os parâmetros necessários ou entre em contato com o suporte.',
      cause
    })
    this.name = 'InvalidExcelFileError'
  }
}
