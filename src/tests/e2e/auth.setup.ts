import { expect, test as setup } from '@playwright/test'

import { ADMIN_STORAGE_STATE } from '@/tests/_utils/e2e-auth'
import { MOCKED_ADMIN } from '@/tests/orchestrator'

setup('Signs in as the admin', async ({ page }) => {
  await page.goto('/entrar')
  const panel = page.getByRole('tabpanel')
  await panel.getByRole('textbox', { name: 'E-mail' }).fill(MOCKED_ADMIN.email)
  await panel.getByLabel('Senha', { exact: true }).fill(MOCKED_ADMIN.password)
  await panel.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL('/registros-de-ponto')
  await page.context().storageState({ path: ADMIN_STORAGE_STATE })
})
