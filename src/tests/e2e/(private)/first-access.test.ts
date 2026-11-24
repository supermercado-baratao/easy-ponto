import { faker } from '@faker-js/faker'
import { expect, type Page, test } from '@playwright/test'

import { OWNER_ROLE, VIEWER_ROLE } from '@/models/account/utils'
import { companyModel } from '@/models/company/model'
import { SIGNED_OUT_STORAGE_STATE } from '@/tests/_utils/e2e-auth'
import orchestrator from '@/tests/orchestrator'

test.use({ storageState: SIGNED_OUT_STORAGE_STATE })

const createAccount = () => ({
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password({ length: 12 })
})

const owner = createAccount()
const viewer = createAccount()

test.beforeAll(async () => {
  // A company of its own, without the device, keeps the mocked company as the other tests expect it
  const { id: companyId } = await companyModel.create(
    orchestrator.createCompanyData()
  )
  await orchestrator.createMember({ ...owner, companyId, role: OWNER_ROLE })
  await orchestrator.createMember({ ...viewer, companyId, role: VIEWER_ROLE })
})

const signIn = async (
  page: Page,
  { email, password }: { email: string; password: string }
): Promise<void> => {
  await page.goto('/entrar')
  const panel = page.getByRole('tabpanel')
  await panel.getByRole('textbox', { name: 'E-mail' }).fill(email)
  await panel.getByLabel('Senha', { exact: true }).fill(password)
  await panel.getByRole('button', { name: 'Entrar' }).click()
}

test.describe('Company without the device', () => {
  test('Sends the owner to the settings', async ({ page }) => {
    await signIn(page, owner)

    await expect(page).toHaveURL('/configuracoes')
    await expect(page.getByRole('status')).toContainText(
      'Configure o Easy Ponto para começar'
    )

    await page.goto('/registros-de-ponto')
    await expect(page).toHaveURL('/configuracoes')
  })

  test('Keeps the viewer on the punch records', async ({ page }) => {
    await signIn(page, viewer)

    await expect(page).toHaveURL('/registros-de-ponto')
  })
})
