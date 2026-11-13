import { expect, test } from '@playwright/test'

import type { User } from '@/infra/database/types'
import { adminUserModel } from '@/models/admin-user/model'
import { userModel } from '@/models/user/model'
import {
  createEmployee,
  createReportFile,
  createReportRows
} from '@/tests/_utils/secullum-report'

// After the last mocked punch (2026-03-25): with hundreds of punches in the period, `next dev` takes
// longer than the test timeout to render the report after each action
const PERIOD = { inicio: '2026-04-06', fim: '2026-04-11' }
const ADJUSTMENTS_COLUMN = 7
const BALANCE_COLUMN = 8

let user: User

test.beforeAll(async () => {
  const adminUser = await adminUserModel.findUniqueById(
    process.env.ADMIN_USER_ID!
  )
  const users = await userModel.findManyByCompanyId(adminUser.companyId!)
  user = users[7]
})

test.describe('Hours report', () => {
  test('Adds an adjustment to the balance and closes and reopens the period', async ({
    page
  }) => {
    await page.goto(`/relatorio-de-horas?${new URLSearchParams(PERIOD)}`)
    const table = page.getByRole('table', { name: 'Relatório de horas' })
    const row = table.getByRole('row').filter({ hasText: user.name })

    await row.getByRole('button', { name: `Ações de ${user.name}` }).click()
    await page.getByRole('menuitem', { name: 'Adicionar ajuste' }).click()
    const sheet = page.getByRole('dialog', { name: 'Adicionar ajuste' })
    await expect(sheet.getByLabel('Data')).toHaveValue(PERIOD.fim)
    await sheet.getByLabel('Horas').fill('00:00')
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(sheet.getByText('O ajuste não pode ser zero')).toBeVisible()
    await expect(sheet.getByText('Informe o motivo')).toBeVisible()

    await sheet.getByLabel('Horas').fill('01:30')
    await sheet.getByLabel('Motivo').fill('Hora extra autorizada')
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(sheet).toBeHidden()
    await expect(row.getByRole('cell').nth(ADJUSTMENTS_COLUMN)).toHaveText(
      '01:30'
    )
    await expect(row.getByRole('cell').nth(BALANCE_COLUMN)).toHaveText('01:30')
    await expect(
      table.getByRole('row').nth(1).getByRole('cell').first()
    ).toHaveText(user.name)

    await page.getByRole('button', { name: 'Fechar período' }).click()
    await page
      .getByRole('alertdialog', { name: 'Fechar período?' })
      .getByRole('button', { name: 'Fechar' })
      .click()
    await expect(page.getByText('Período fechado.')).toBeVisible()
    await expect(row.getByRole('cell').nth(BALANCE_COLUMN)).toHaveText('01:30')
    await expect(
      row.getByRole('button', { name: `Ações de ${user.name}` })
    ).toBeHidden()

    await page.getByRole('button', { name: 'Reabrir período' }).click()
    await page
      .getByRole('alertdialog', { name: 'Reabrir período?' })
      .getByRole('button', { name: 'Reabrir' })
      .click()
    await expect(
      page.getByRole('button', { name: 'Fechar período' })
    ).toBeVisible()
    await expect(
      row.getByRole('button', { name: `Ações de ${user.name}` })
    ).toBeVisible()
  })

  test('Imports the initial balance and discards it', async ({ page }) => {
    const file = createReportFile(
      createReportRows({
        period: '01/04/2026 até 05/04/2026',
        employees: [
          createEmployee({
            name: user.name,
            totals: { Faltas: '1:00', 'Ex60%': '5:30', Ajuste: '0:30' },
            days: []
          })
        ]
      })
    )
    await page.goto(`/relatorio-de-horas?${new URLSearchParams(PERIOD)}`)

    await page.getByLabel('Importar saldo inicial').setInputFiles({
      name: file.name,
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await file.arrayBuffer())
    })
    await expect(
      page.getByText(
        'Saldo inicial até 05/04/2026, importado do relatório do Secullum.'
      )
    ).toBeVisible()
    const row = page
      .getByRole('table', { name: 'Relatório de horas' })
      .getByRole('row')
      .filter({ hasText: user.name })
    await expect(row.getByRole('cell').nth(BALANCE_COLUMN)).toHaveText('05:00')

    await page.getByRole('button', { name: 'Descartar saldo inicial' }).click()
    await page
      .getByRole('alertdialog', { name: 'Descartar saldo inicial?' })
      .getByRole('button', { name: 'Descartar' })
      .click()
    await expect(
      page.getByRole('button', { name: 'Fechar período' })
    ).toBeVisible()
    await expect(page.getByText('Importar saldo inicial')).toBeVisible()
  })
})
