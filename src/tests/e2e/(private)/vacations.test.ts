import { expect, test } from '@playwright/test'

import type { User } from '@/infra/database/types'
import { adminUserModel } from '@/models/admin-user/model'
import { userModel } from '@/models/user/model'

let first: User
let second: User

test.beforeAll(async () => {
  const adminUser = await adminUserModel.findUniqueById(
    process.env.ADMIN_USER_ID!
  )
  const users = await userModel.findManyByCompanyId(adminUser.companyId!)
  ;[first, second] = users.slice(6, 8)
})

test.describe('Vacations', () => {
  test('Plans the vacation month of each employee and shows the year by month', async ({
    page
  }) => {
    await page.goto('/ferias?ano=2031')
    const table = page.getByRole('table', {
      name: 'Planejamento das férias de 2031'
    })
    const july = page.getByRole('listitem', { name: 'Julho' })
    const getRow = (user: User) => table.getByRole('row', { name: user.name })

    for (const [user, month] of [
      [first, 'Julho'],
      [second, 'Julho']
    ] as const) {
      await page
        .getByRole('button', { name: `Planejar as férias de ${user.name}` })
        .click()
      const sheet = page.getByRole('dialog', { name: 'Planejar férias' })
      await sheet.getByRole('combobox', { name: 'Mês' }).click()
      await page.getByRole('option', { name: month }).click()
      await sheet.getByRole('button', { name: 'Salvar' }).click()
      await expect(sheet).toBeHidden()
    }
    await expect(july).toContainText('2 funcionários')
    await expect(july.getByText(first.name)).toBeVisible()
    await expect(getRow(first).locator('th, td')).toHaveText([
      first.name,
      first.position ?? '—',
      'Julho',
      'Planejadas',
      'Registrar'
    ])

    await page
      .getByRole('button', { name: `Planejar as férias de ${second.name}` })
      .click()
    const sheet = page.getByRole('dialog', { name: 'Planejar férias' })
    await sheet.getByRole('combobox', { name: 'Mês' }).click()
    await page.getByRole('option', { name: 'Janeiro' }).click()
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(sheet).toBeHidden()
    await expect(july).toContainText('1 funcionário')
    await expect(
      page.getByRole('listitem', { name: 'Janeiro' }).getByText(second.name)
    ).toBeVisible()

    await page
      .getByRole('button', { name: `Planejar as férias de ${first.name}` })
      .click()
    await sheet.getByRole('combobox', { name: 'Mês' }).click()
    await page.getByRole('option', { name: 'Sem planejamento' }).click()
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(sheet).toBeHidden()
    await expect(july).toContainText('Ninguém de férias')
    await expect(getRow(first).getByRole('cell').nth(2)).toHaveText(
      'Sem planejamento'
    )

    await page.getByRole('link', { name: 'Próximo ano' }).click()
    await expect(
      page.getByRole('table', { name: 'Planejamento das férias de 2032' })
    ).toBeVisible()
    await expect(page.getByRole('listitem', { name: 'Janeiro' })).toContainText(
      'Ninguém de férias'
    )
  })
})
