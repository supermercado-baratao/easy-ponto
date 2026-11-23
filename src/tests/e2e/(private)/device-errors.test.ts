import { faker } from '@faker-js/faker'
import { expect, test } from '@playwright/test'

import { OWNER_ROLE } from '@/models/account/utils'
import { companyModel } from '@/models/company/model'
import { DEFAULT_DEVICE_MODEL } from '@/models/device/utils'
import { deviceCredentialsModel } from '@/models/device-credentials/model'
import { SIGNED_OUT_STORAGE_STATE } from '@/tests/_utils/e2e-auth'
import orchestrator from '@/tests/orchestrator'

test.use({ storageState: SIGNED_OUT_STORAGE_STATE })

const owner = {
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password({ length: 12 })
}

test.beforeAll(async () => {
  // Another company, so the mocked one keeps its device credentials
  const { id: companyId } = await companyModel.create(
    orchestrator.createCompanyData()
  )
  // Nothing listens on the HTTPS port of the test machine, so the connection is refused at once
  await deviceCredentialsModel.upsert({
    companyId,
    model: DEFAULT_DEVICE_MODEL,
    ip: '127.0.0.1',
    login: faker.internet.username(),
    password: faker.internet.password()
  })
  await orchestrator.createMember({ ...owner, companyId, role: OWNER_ROLE })
})

test.describe('Device errors', () => {
  test('Tells the editor to check the device when it is unreachable', async ({
    page
  }) => {
    await page.goto('/entrar')
    const panel = page.getByRole('tabpanel')
    await panel.getByRole('textbox', { name: 'E-mail' }).fill(owner.email)
    await panel.getByLabel('Senha', { exact: true }).fill(owner.password)
    await panel.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL('/registros-de-ponto')

    await page.getByRole('button', { name: 'Sincronizar' }).click()

    await expect(
      page.getByText('O relógio de ponto não foi encontrado na rede.')
    ).toBeVisible()
    await expect(
      page.getByText(/Confira se o relógio de ponto está ligado/)
    ).toBeVisible()
  })
})
