import { expect, test } from '@playwright/test'

test.describe('Settings', () => {
  test('Keeps the typed company data and focuses the invalid field after a validation error', async ({
    page
  }) => {
    await page.goto('/configuracoes')
    const form = page.locator('#company-form')
    const card = page.locator('[data-slot="card"]').filter({ has: form })

    await form.getByLabel('Nome*').fill('Supermercado Teste')
    await form.getByLabel('CPF do Responsável*').fill('123')
    await card.getByRole('button', { name: 'Salvar' }).click()

    const cpf = form.getByLabel('CPF do Responsável*')
    await expect(cpf).toHaveAccessibleDescription('CPF inválido')
    await expect(cpf).toHaveAttribute('aria-invalid', 'true')
    await expect(cpf).toBeFocused()
    await expect(cpf).toHaveValue('123')
    await expect(form.getByLabel('Nome*')).toHaveValue('Supermercado Teste')
  })

  test('Keeps the typed device data, except the password, and focuses the invalid field after a validation error', async ({
    page
  }) => {
    await page.goto('/configuracoes')
    const form = page.locator('#device-form')
    const card = page.locator('[data-slot="card"]').filter({ has: form })

    await form.getByLabel('Endereço IPV4').fill('999.0.0.1')
    await form.getByLabel('Login').fill('operador')
    await form.getByLabel('Senha').fill('segredo')
    await card.getByRole('button', { name: 'Salvar' }).click()

    const ip = form.getByLabel('Endereço IPV4')
    await expect(ip).toHaveAttribute('aria-invalid', 'true')
    await expect(ip).toBeFocused()
    await expect(ip).toHaveValue('999.0.0.1')
    await expect(form.getByLabel('Login')).toHaveValue('operador')
    await expect(form.getByLabel('Senha')).toHaveValue('')
  })

  test('Opens the file picker of the import from the keyboard', async ({
    page
  }) => {
    await page.goto('/configuracoes')
    const fileChooser = page.waitForEvent('filechooser')

    await page.getByRole('button', { name: 'Importar Arquivo' }).focus()
    await page.keyboard.press('Enter')

    await fileChooser
  })
})
