import { expect, type Page, test } from '@playwright/test'

import type { Holiday, User } from '@/infra/database/types'
import { holidayModel } from '@/models/holiday/model'
import { userModel } from '@/models/user/model'
import orchestrator from '@/tests/orchestrator'

const FULL_DAY = ['08:00', '12:00', '14:00', '18:00']

let user: User
let holiday: Holiday

test.beforeAll(async () => {
  const companyId = await orchestrator.findMockedCompanyId()
  const users = await userModel.findManyByCompanyId(companyId)
  user = users[8]
  // The cycle starts on a Sunday, so its days follow the weekdays
  await orchestrator.assignShift({
    companyId,
    userId: user.id,
    startDate: '2035-08-05',
    days: [
      [],
      FULL_DAY,
      FULL_DAY,
      FULL_DAY,
      FULL_DAY,
      FULL_DAY,
      ['08:00', '12:00']
    ]
  })
  holiday = await holidayModel.create({
    companyId,
    date: '2035-08-15',
    name: 'Feriado do calendário',
    scope: 'municipal',
    recurrence: 'once'
  })
})

test.afterAll(async () => {
  await holidayModel.remove({ id: holiday.id, companyId: holiday.companyId })
})

const openCalendar = async (page: Page): Promise<void> => {
  await page.goto(
    `/calendario?${new URLSearchParams({ mes: '2035-08', nome: user.name })}`
  )
  await page
    .getByRole('table', { name: 'Resumo do mês de cada funcionário' })
    .getByRole('link', { name: user.name })
    .click()
  await expect(page).toHaveURL(/funcionario=/)
}

const adjustDay = async (
  page: Page,
  day: number,
  choice: string
): Promise<void> => {
  await page
    .getByRole('button', { name: new RegExp(`^Ajustar o dia ${day}:`) })
    .click()
  const sheet = page.getByRole('dialog')
  await sheet.getByRole('combobox', { name: 'Dia' }).click()
  await page.getByRole('option', { name: choice }).click()
  if (choice === 'Outra carga') {
    await sheet.getByLabel('Entrada 1').fill('09:00')
    await sheet.getByLabel('Saída 1').fill('13:00')
    await sheet.getByLabel('Entrada 2').fill('')
    await sheet.getByLabel('Saída 2').fill('')
  }
  await sheet.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Dia salvo com sucesso!')).toBeVisible()
  await expect(sheet).toBeHidden()
}

test.describe('Calendar', () => {
  test('Shows the days of the employee schedule in the month', async ({
    page
  }) => {
    await openCalendar(page)

    const summary = page
      .getByRole('region', { name: 'Resumo do mês' })
      .getByRole('definition')
    await expect(summary).toHaveText(['22', '4', '1', '0', '164:00'])
    const grid = page.getByRole('table', {
      name: `Dias do mês de ${user.name}`
    })
    await expect(grid.locator('tbody tr').first()).toContainText('Sem escala')
    await expect(
      grid.getByRole('button', {
        name: /^Ajustar o dia 15: Feriado do calendário,/
      })
    ).toBeVisible()

    const row = page
      .getByRole('table', { name: 'Resumo do mês de cada funcionário' })
      .getByRole('row', { name: new RegExp(user.name) })
    await expect(row.locator('td')).toHaveText([
      /./,
      '22',
      '4',
      '1',
      '0',
      '164:00'
    ])

    await page.getByRole('link', { name: 'Próximo mês' }).click()
    await expect(
      page.getByRole('heading', { name: 'Setembro de 2035' })
    ).toBeVisible()
    await expect(page).toHaveURL(/funcionario=/)
  })

  test('Adjusts a day and brings it back to the schedule', async ({ page }) => {
    await openCalendar(page)
    const summary = page
      .getByRole('region', { name: 'Resumo do mês' })
      .getByRole('definition')

    await adjustDay(page, 13, 'Folga')
    await expect(summary).toHaveText(['21', '5', '1', '1', '156:00'])
    await expect(
      page.getByRole('button', { name: 'Ajustar o dia 13: Folga (ajustado)' })
    ).toBeVisible()

    await adjustDay(page, 18, 'Outra carga')
    await expect(summary).toHaveText(['21', '5', '1', '2', '156:00'])
    await expect(
      page.getByRole('button', {
        name: 'Ajustar o dia 18: 09:00–13:00, carga 04:00 (ajustado)'
      })
    ).toBeVisible()

    await adjustDay(page, 13, 'Seguir a escala')
    await adjustDay(page, 18, 'Seguir a escala')
    await expect(summary).toHaveText(['22', '4', '1', '0', '164:00'])
  })
})
