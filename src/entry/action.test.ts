import { beforeEach, describe, expect, test, vi } from 'vitest'
import { z } from 'zod'

import { NotFoundError, ValidationError } from '@/infra/errors'

import { handleAction } from './action'
import { handleFormAction } from './form-action'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

const fail = (error: unknown) => async (): Promise<never> => {
  throw error
}

describe('handleAction', () => {
  test('Returns the data of the action', async () => {
    expect(await handleAction(async () => 3)).toEqual({
      data: 3,
      success: true,
      fatalError: false
    })
  })

  test('Returns the message and action of a known error', async () => {
    const state = await handleAction(fail(new NotFoundError({})))

    expect(state).toEqual({
      success: false,
      fatalError: false,
      message: 'O registro não foi encontrado.',
      action: 'Atualize a página: ele pode ter sido alterado ou removido.'
    })
  })

  test('Hides the message of an unexpected error', async () => {
    const state = await handleAction(fail(new Error('password=secret')))

    expect(state).toMatchObject({ success: false, fatalError: true })
    expect(state.message).toBeUndefined()
    expect(state.action).toBeUndefined()
  })
})

describe('handleFormAction', () => {
  const formData = new FormData()
  const previousError = { message: 'Erro anterior', action: 'Faça algo' }

  test('Returns the first message of each invalid field', async () => {
    const schema = z.object({ name: z.string().min(3, 'Nome curto') })
    const nameData = new FormData()
    nameData.set('name', 'Jo')

    const state = await handleFormAction(
      async (data: { name?: string }) => schema.parse(data),
      previousError,
      nameData
    )

    expect(state).toEqual({
      success: false,
      fatalError: false,
      errors: { name: 'Nome curto' },
      message: undefined,
      action: undefined
    })
  })

  test('Returns the message and action of a known error without the field errors', async () => {
    const state = await handleFormAction(
      fail(new ValidationError({ message: 'Inválido', action: 'Corrija' })),
      { errors: { name: 'Nome curto' } },
      formData
    )

    expect(state).toEqual({
      success: false,
      fatalError: false,
      errors: undefined,
      message: 'Inválido',
      action: 'Corrija'
    })
  })

  test('Clears the message of a previous error after an unexpected one', async () => {
    const state = await handleFormAction(
      fail(new Error('Unexpected')),
      previousError,
      formData
    )

    expect(state).toMatchObject({ success: false, fatalError: true })
    expect(state.message).toBeUndefined()
  })

  test('Clears the message of a previous error after a success', async () => {
    const state = await handleFormAction(async () => 1, previousError, formData)

    expect(state).toMatchObject({ success: true, data: 1 })
    expect(state.message).toBeUndefined()
  })
})
