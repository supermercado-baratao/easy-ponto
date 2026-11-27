import { expect, test } from '@playwright/test'

import type { User } from '@/infra/database/types'
import { wallClockNow } from '@/infra/dayjs'
import { userModel } from '@/models/user/model'
import orchestrator from '@/tests/orchestrator'

let user: User

test.beforeAll(async () => {
  const companyId = await orchestrator.findMockedCompanyId()
  const users = await userModel.findManyByCompanyId(companyId)
  user = users[6]
  // The cycle starts today, so the agenda opens on its first day
  await orchestrator.assignShift({
    companyId,
    userId: user.id,
    startDate: wallClockNow().format('YYYY-MM-DD'),
    days: [
      ['06:10', '12:20', '14:30', '16:00'],
      ['06:10', '10:00', '11:00', '14:00'],
      []
    ]
  })
})

test.describe('Agenda', () => {
  test('Shows the shift of each employee in the coming days with the alerts', async ({
    page
  }) => {
    await page.goto(`/expedientes?${new URLSearchParams({ nome: user.name })}`)
    const table = page.getByRole('table', {
      name: 'Expedientes dos funcionários'
    })
    const cells = table
      .getByRole('row', { name: new RegExp(user.name) })
      .locator('td')

    await expect(cells.nth(0)).toHaveText(
      '06:10– às 12:2014:30– às 16:00Almoço02:10Jornada07:40Almoço acima de 2hMais de 6h sem intervalo'
    )
    await expect(cells.nth(1)).toHaveText(
      '06:10– às 10:0011:00– às 14:00Almoço01:00Jornada06:50'
    )
    await expect(cells.nth(2)).toHaveText('Folga')
    await expect(cells).toHaveCount(7)
  })

  test('Filters the employees by the entry or exit time', async ({ page }) => {
    await page.goto('/expedientes')
    const table = page.getByRole('table', {
      name: 'Expedientes dos funcionários'
    })

    await page.getByLabel('Nome').fill(user.name)
    await page.getByLabel('Entrada ou saída').fill('06:10')
    await page.getByRole('button', { name: 'Filtrar' }).click()
    await expect(page).toHaveURL(/horario=06%3A10/)
    await expect(table.locator('tbody tr')).toHaveCount(1)

    await page.getByLabel('Entrada ou saída').fill('10:00')
    await page.getByRole('button', { name: 'Filtrar' }).click()
    await expect(page).toHaveURL(/horario=10%3A00/)
    await expect(
      page.getByText('Nenhum funcionário encontrado com esses filtros')
    ).toBeVisible()
  })
})
