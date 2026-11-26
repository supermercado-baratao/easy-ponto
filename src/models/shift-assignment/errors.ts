import { dayjs } from '@/infra/dayjs'
import { NotFoundError, ValidationError } from '@/infra/errors'

import type { TShiftConflict } from './utils'

export class ShiftAssignmentNotFoundError extends NotFoundError {
  constructor(cause: string) {
    super({ message: 'O vínculo com a escala não foi encontrado.', cause })
    this.name = 'ShiftAssignmentNotFoundError'
  }
}

export class ShiftAdjustmentNotFoundError extends NotFoundError {
  constructor(cause: string) {
    super({ message: 'O ajuste do dia não foi encontrado.', cause })
    this.name = 'ShiftAdjustmentNotFoundError'
  }
}

const CONFLICT_MESSAGES: Record<TShiftConflict['reason'], string> = {
  overlap:
    'os horários desta escala se sobrepõem aos de outra escala do funcionário',
  'too-many-pairs':
    'as escalas do funcionário passam de 3 pares de horários no dia'
}

export class ShiftConflictError extends ValidationError {
  constructor({ date, reason }: TShiftConflict) {
    super({
      message: `Em ${dayjs(date).format('DD/MM/YYYY')}, ${CONFLICT_MESSAGES[reason]}.`,
      action:
        'Encerre a outra escala antes, mude o dia do ciclo ou escolha outra escala.',
      cause: date
    })
    this.name = 'ShiftConflictError'
  }
}
