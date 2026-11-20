import { faker } from '@faker-js/faker'
import { expect, type Page, test } from '@playwright/test'
import { CPF } from 'validation-br/cpf'

import type { User } from '@/infra/database/types'
import { dayjs, wallClockNow } from '@/infra/dayjs'
import { accountModel } from '@/models/account/model'
import { getDefaultPassword } from '@/models/account/utils'
import { companyModel } from '@/models/company/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import { SIGNED_OUT_STORAGE_STATE } from '@/tests/_utils/e2e-auth'
import orchestrator from '@/tests/orchestrator'

test.use({ storageState: SIGNED_OUT_STORAGE_STATE })

const firstDay = wallClockNow().startOf('month').format('YYYY-MM-DD')

let employee: User
let coworker: User

test.beforeAll(async () => {
  // Another company keeps the employee lists of the private tests as the mocks create them
  const { id: companyId } = await companyModel.create(
    orchestrator.createCompanyData()
  )
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(0, 2), companyId).map((user) => ({
      ...user,
      name: faker.person.fullName(),
      cpf: CPF.fake().value
    }))
  )
  await accountModel.createEmployeeAccounts(companyId)
  ;[employee, coworker] = await userModel.findManyByCompanyId(companyId)
  await accountModel.completePasswordChange(employee.authUserId!)

  await punchRecordModel.createManyNonExistentInAfd(
    [
      { pis: employee.pis, time: '08:00' },
      { pis: employee.pis, time: '12:00' },
      { pis: coworker.pis, time: '09:15' }
    ].map(({ pis, time }) => ({
      companyId,
      pis,
      datetime: dayjs(`${firstDay}T${time}`).toDate()
    }))
  )
})

const signIn = async (page: Page): Promise<void> => {
  await page.goto('/entrar')
  const panel = page.getByRole('tabpanel')
  await page.getByRole('tab', { name: 'CPF' }).click()
  await panel.getByRole('textbox', { name: 'CPF' }).fill(employee.cpf!)
  await panel
    .getByLabel('Senha', { exact: true })
    .fill(getDefaultPassword(employee.name, employee.cpf!))
  await panel.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/meu-ponto')
}

test.describe('Employee area', () => {
  test('Shows only the punch records of the signed-in employee', async ({
    page
  }) => {
    await signIn(page)
    const table = page.getByRole('table', { name: 'Registros do mês' })
    const firstRow = table.getByRole('row', {
      name: dayjs(firstDay).format('DD/MM/YYYY')
    })

    await expect(firstRow).toContainText('08:00*')
    await expect(firstRow).toContainText('12:00*')
    await expect(firstRow).not.toContainText('09:15')
    await expect(
      page.getByRole('heading', { name: 'Totais do mês' })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /^Ações de / })).toHaveCount(
      0
    )

    await page.goto(`/meu-ponto?pis=${coworker.pis}`)
    await expect(firstRow).toContainText('08:00*')
    await expect(firstRow).not.toContainText('09:15')
  })

  test('Lets the keyboard reach the scroll area of the records', async ({
    page
  }) => {
    await signIn(page)
    const region = page.getByRole('region', { name: 'Registros do mês' })

    await expect(region).toHaveAttribute('tabindex', '0')
    await region.focus()
    await expect(region).toBeFocused()
    await expect(
      region.getByRole('table', { name: 'Registros do mês' })
    ).toBeVisible()
  })

  test('Navigates to the previous month', async ({ page }) => {
    await signIn(page)
    await page.getByRole('link', { name: 'Mês anterior' }).click()

    const previousMonth = dayjs(firstDay).subtract(1, 'month')
    await expect(page).toHaveURL(
      `/meu-ponto?mes=${previousMonth.format('YYYY-MM')}`
    )
    await expect(
      page.getByRole('table', { name: 'Registros do mês' })
    ).not.toContainText('08:00')
  })
})
