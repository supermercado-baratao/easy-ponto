import { expect, test } from '@playwright/test'

import type { User } from '@/infra/database/types'
import { adminUserModel } from '@/models/admin-user/model'
import { userModel } from '@/models/user/model'

const PERIOD = { inicio: '2025-10-01', fim: '2025-10-31' }

let user: User

test.beforeAll(async () => {
  const adminUser = await adminUserModel.findUniqueById(
    process.env.ADMIN_USER_ID!
  )
  const users = await userModel.findManyByCompanyId(adminUser.companyId!)
  user = users[3]
})

test.describe('Schedule', () => {
  test('Saves the schedule of the employee', async ({ page }) => {
    await page.goto(
      `/registros-de-ponto?${new URLSearchParams({ pis: user.pis, ...PERIOD })}`
    )
    const section = page.getByRole('region', { name: 'Escala de horários' })
    await expect(
      section.getByText('Nenhuma escala vigente no período')
    ).toBeVisible()

    await section.getByRole('button', { name: 'Cadastrar escala' }).click()
    const sheet = page.getByRole('dialog', { name: 'Cadastrar escala' })
    await expect(sheet.getByLabel('Vigente a partir de')).toHaveValue(
      PERIOD.inicio
    )
    const monday = sheet.getByRole('group', { name: 'Segunda' })
    await monday.getByLabel('Entrada 1').fill('07:00')
    await sheet.getByRole('button', { name: 'Salvar' }).click()

    await expect(monday).toHaveAccessibleDescription('Informe a saída')
    await expect(monday.getByLabel('Entrada 1')).toHaveValue('07:00')

    await monday.getByLabel('Saída 1').fill('11:00')
    await monday.getByLabel('Entrada 2').fill('13:00')
    await monday.getByLabel('Saída 2').fill('16:20')
    await sheet.getByRole('button', { name: 'Salvar' }).click()

    await expect(sheet).toBeHidden()
    await expect(
      section.getByText('Vigente a partir de 01/10/2025')
    ).toBeVisible()
    const rows = section.getByRole('table').locator('tbody tr')
    await expect(rows.nth(0).locator('th, td')).toHaveText([
      'Segunda',
      '07:00',
      '11:00',
      '13:00',
      '16:20'
    ])
    await expect(rows.nth(1).locator('th, td')).toHaveText(['Terça', 'Folga'])
    await expect(
      section.getByRole('button', { name: 'Editar escala' })
    ).toBeVisible()
  })
})
