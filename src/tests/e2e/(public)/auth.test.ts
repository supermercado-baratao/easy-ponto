import { faker } from '@faker-js/faker'
import { expect, test } from '@playwright/test'
import { CPF } from 'validation-br/cpf'

import { accountModel } from '@/models/account/model'
import { getDefaultPassword } from '@/models/account/utils'
import { companyModel } from '@/models/company/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import { SIGNED_OUT_STORAGE_STATE } from '@/tests/_utils/e2e-auth'
import orchestrator, { MOCKED_ADMIN } from '@/tests/orchestrator'

test.use({ storageState: SIGNED_OUT_STORAGE_STATE })

const employee = {
  name: `${faker.person.firstName()} Conceição`,
  cpf: CPF.fake().value
}

test.beforeAll(async () => {
  // Another company keeps the employee lists of the private tests as the mocks create them
  const { id: companyId } = await companyModel.create(
    orchestrator.createCompanyData()
  )
  await userModel.createMany(
    mapDeviceUserToUser(
      [{ ...deviceUsers[0], name: employee.name }],
      companyId
    ).map((user) => ({ ...user, cpf: employee.cpf }))
  )
  await accountModel.createEmployeeAccounts(companyId)
})

test.describe('Authentication', () => {
  test('Sends a visitor of a private page to the sign-in page', async ({
    page
  }) => {
    await page.goto('/registros-de-ponto')

    await expect(page).toHaveURL('/entrar')
    await expect(page.getByRole('tab', { name: 'E-mail' })).toBeVisible()
  })

  test('Shows an error for a wrong password', async ({ page }) => {
    await page.goto('/entrar')
    const panel = page.getByRole('tabpanel')
    await panel
      .getByRole('textbox', { name: 'E-mail' })
      .fill(MOCKED_ADMIN.email)
    await panel.getByLabel('Senha', { exact: true }).fill('senha-errada')
    await panel.getByRole('button', { name: 'Entrar' }).click()

    await expect(panel.getByText('E-mail ou senha incorretos')).toBeVisible()
    await expect(panel.getByRole('textbox', { name: 'E-mail' })).toHaveValue(
      MOCKED_ADMIN.email
    )
    await expect(page).toHaveURL('/entrar')
  })

  test('Asks the employee for a new password on the first access', async ({
    page
  }) => {
    const newPassword = 'nova-senha-do-funcionario'
    await page.goto('/entrar')
    const panel = page.getByRole('tabpanel')
    await page.getByRole('tab', { name: 'CPF' }).click()
    await panel.getByRole('textbox', { name: 'CPF' }).fill(employee.cpf)
    await panel
      .getByLabel('Senha', { exact: true })
      .fill(getDefaultPassword(employee.name, employee.cpf))
    await panel.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL('/trocar-senha')
    await page
      .getByLabel('Senha atual')
      .fill(getDefaultPassword(employee.name, employee.cpf))
    await page.getByLabel('Nova senha', { exact: true }).fill(newPassword)
    await page.getByLabel('Confirme a nova senha').fill(newPassword)
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page).toHaveURL('/meu-ponto')
    await expect(
      page.getByRole('heading', { name: `Olá, ${employee.name}` })
    ).toBeVisible()

    await page.goto('/registros-de-ponto')
    await expect(page).toHaveURL('/meu-ponto')

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL('/entrar')
  })
})
