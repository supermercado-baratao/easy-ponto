import { expect, test } from '@playwright/test'

test.describe('Landing Page', () => {
  test('Opens the punch records from the sign in link', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', {
        name: 'O ponto da sua loja, do relógio ao banco de horas',
        level: 1
      })
    ).toBeVisible()

    await page.getByRole('link', { name: 'Entrar' }).first().click()

    await expect(page).toHaveURL('/registros-de-ponto')
    await expect(
      page.getByRole('combobox', { name: 'Funcionário' })
    ).toBeVisible()
  })
})
