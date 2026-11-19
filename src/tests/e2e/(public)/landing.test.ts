import { expect, test } from '@playwright/test'

import {
  ADMIN_STORAGE_STATE,
  SIGNED_OUT_STORAGE_STATE
} from '@/tests/_utils/e2e-auth'

test.describe('Landing Page', () => {
  test.describe('Signed out', () => {
    test.use({ storageState: SIGNED_OUT_STORAGE_STATE })

    test('Opens the sign-in page from the sign-in link', async ({ page }) => {
      await page.goto('/')

      await expect(
        page.getByRole('heading', {
          name: 'O ponto da sua loja, do relógio ao banco de horas',
          level: 1
        })
      ).toBeVisible()

      await page.getByRole('link', { name: 'Entrar' }).first().click()

      await expect(page).toHaveURL('/entrar')
      await expect(page.getByRole('tab', { name: 'E-mail' })).toBeVisible()
    })
  })

  test.describe('Signed in', () => {
    test.use({ storageState: ADMIN_STORAGE_STATE })

    test('Sends the admin to the punch records', async ({ page }) => {
      await page.goto('/')

      await expect(page).toHaveURL('/registros-de-ponto')
      await expect(
        page.getByRole('combobox', { name: 'Funcionário' })
      ).toBeVisible()
    })
  })
})
