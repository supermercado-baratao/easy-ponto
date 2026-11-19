import { expect, test } from '@playwright/test'

import type { Holiday } from '@/infra/database/types'
import { holidayModel } from '@/models/holiday/model'
import orchestrator from '@/tests/orchestrator'

let holiday: Holiday

test.beforeAll(async () => {
  const companyId = await orchestrator.findMockedCompanyId()
  holiday = await holidayModel.create({
    companyId,
    date: '2035-08-15',
    name: 'Feriado do calendário',
    scope: 'municipal'
  })
})

test.afterAll(async () => {
  await holidayModel.remove({ id: holiday.id, companyId: holiday.companyId })
})

test.describe('Calendar', () => {
  test('Shows the workload of each day, week and month', async ({ page }) => {
    await page.goto('/calendario?mes=2035-08')
    await expect(
      page.getByRole('heading', { name: 'Agosto de 2035' })
    ).toBeVisible()

    const summary = page.getByRole('region', { name: 'Resumo do mês' })
    await expect(summary.getByRole('definition')).toHaveText([
      '26',
      '200:00',
      '190:40',
      '09:20'
    ])

    const table = page.getByRole('table', {
      name: 'Carga horária de cada dia do mês'
    })
    await expect(table.locator('tbody tr td:last-child')).toHaveText([
      '32:00',
      '47:20',
      '36:40',
      '44:00',
      '40:00'
    ])
    await expect(
      table.getByRole('cell', { name: '15 Feriado do calendário' })
    ).toBeVisible()

    await page.getByRole('link', { name: 'Próximo mês' }).click()
    await expect(
      page.getByRole('heading', { name: 'Setembro de 2035' })
    ).toBeVisible()
  })
})
