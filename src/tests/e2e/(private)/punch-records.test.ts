import { expect, type Page, test } from '@playwright/test'

import type { User } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { adminUserModel } from '@/models/admin-user/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { userModel } from '@/models/user/model'

const PERIOD = { initialDate: '2025-10-01', finalDate: '2025-10-31' }
const MANUAL_PUNCH_DATETIME = '2025-10-15T23:00:00.000Z'

let users: User[]

const getHref = (pis: string, { initialDate, finalDate } = PERIOD): string =>
  `/registros-de-ponto?${new URLSearchParams({ pis, inicio: initialDate, fim: finalDate })}`

const expectSelectedUser = async (page: Page, user: User): Promise<void> => {
  await expect(page).toHaveURL(getHref(user.pis))
  await expect(
    page.getByRole('heading', { name: user.name, level: 2 })
  ).toBeAttached()
  await expect(
    page.getByRole('combobox', { name: 'Funcionário' })
  ).toContainText(user.name)
}

test.beforeAll(async () => {
  const adminUser = await adminUserModel.findUniqueById(
    process.env.ADMIN_USER_ID!
  )
  users = await userModel.findManyByCompanyId(adminUser.companyId!)
  await punchRecordModel.createManyNonExistentInAfd([
    { pis: users[0].pis, datetime: new Date(MANUAL_PUNCH_DATETIME) }
  ])
})

test.describe('Punch Records Page', () => {
  test('Shows the first employee when no employee is chosen', async ({
    page
  }) => {
    await page.goto('/registros-de-ponto')

    await expect(
      page.getByRole('heading', { name: users[0].name, level: 2 })
    ).toBeAttached()
    await expect(
      page.getByRole('link', { name: 'Funcionário anterior' })
    ).toHaveAttribute('aria-disabled', 'true')
  })

  test('Switches the employee through the arrows', async ({ page }) => {
    await page.goto(getHref(users[0].pis))

    await page
      .getByRole('link', { name: `Próximo funcionário: ${users[1].name}` })
      .click()
    await expectSelectedUser(page, users[1])

    await page
      .getByRole('link', { name: `Funcionário anterior: ${users[0].name}` })
      .click()
    await expectSelectedUser(page, users[0])
  })

  test('Switches the employee through the select', async ({ page }) => {
    await page.goto(getHref(users[0].pis))

    await page.getByRole('combobox', { name: 'Funcionário' }).click()
    await page.getByRole('option', { name: users[2].name, exact: true }).click()

    await expectSelectedUser(page, users[2])
  })

  test('Filters the punch records by period', async ({ page }) => {
    const period = { initialDate: '2025-11-01', finalDate: '2025-11-07' }
    const user = users[1]
    await page.goto(getHref(user.pis))

    await page.getByLabel('Início').fill(period.initialDate)
    await page.getByLabel('Fim').fill(period.finalDate)
    await page.getByRole('button', { name: 'Filtrar' }).click()

    await expect(page).toHaveURL(getHref(user.pis, period))
    const days = await punchRecordModel.findManyByDay({
      pis: user.pis,
      ...period
    })
    const rows = page
      .getByRole('table', { name: 'Registros de ponto' })
      .locator('tbody tr')
    await expect(rows).toHaveCount(days.length)
    const columns = Math.max(
      4,
      ...days.map(({ punchRecords }) => punchRecords.length)
    )
    for (const [index, { date, punchRecords }] of days.entries()) {
      const times = punchRecords.map(({ datetime }) =>
        dayjs(datetime).format('HH:mm')
      )
      await expect(rows.nth(index).getByRole('cell')).toHaveText([
        dayjs(date).format('DD/MM/YYYY'),
        dayjs(date).format('ddd'),
        ...times,
        ...Array.from({ length: columns - times.length }, () => '')
      ])
    }
  })

  test('Marks the punch records added by hand', async ({ page }) => {
    await page.goto(getHref(users[0].pis))

    const table = page.getByRole('table', { name: 'Registros de ponto' })
    await expect(table.getByText('* Batida inserida manualmente')).toBeVisible()
    const row = table.getByRole('row').filter({ hasText: '15/10/2025' })
    await expect(
      row.getByRole('cell', { name: '23:00 (inserida manualmente)' })
    ).toBeVisible()

    await page.goto(getHref(users[1].pis))

    await expect(
      page.getByRole('table', { name: 'Registros de ponto' })
    ).toBeVisible()
    await expect(page.getByText('* Batida inserida manualmente')).toHaveCount(0)
  })
})
