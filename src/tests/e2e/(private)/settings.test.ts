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

  test('Shows the model of the saved device', async ({ page }) => {
    await page.goto('/configuracoes')

    await expect(
      page.locator('#device-form').getByRole('combobox', {
        name: 'Modelo do relógio'
      })
    ).toContainText('Control iD iDClass')
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

  test('Keeps the typed journey rules and focuses the invalid field after a validation error', async ({
    page
  }) => {
    await page.goto('/configuracoes')
    const form = page.locator('#journey-rules-form')
    const card = page.locator('[data-slot="card"]').filter({ has: form })

    await form.getByLabel('Tolerância por batida (minutos)').fill('10')
    await form.getByLabel('Tolerância por dia (minutos)').fill('5')
    await card.getByRole('button', { name: 'Salvar' }).click()

    const daily = form.getByLabel('Tolerância por dia (minutos)')
    await expect(daily).toHaveAttribute('aria-invalid', 'true')
    await expect(daily).toBeFocused()
    await expect(daily).toHaveValue('5')
    await expect(
      form.getByLabel('Tolerância por batida (minutos)')
    ).toHaveValue('10')
  })

  test('Saves the overtime bands of a day kind', async ({ page }) => {
    await page.goto('/configuracoes')
    const form = page.locator('#overtime-bands-form')
    const card = page.locator('[data-slot="card"]').filter({ has: form })
    const workday = form.getByRole('group', { name: 'Dia útil' })

    await workday
      .getByRole('button', { name: 'Adicionar faixa (Dia útil)' })
      .click()
    await workday
      .getByLabel('1ª faixa: até quantas horas extras no dia')
      .fill('02:00')
    await workday.getByLabel('Adicional da 1ª faixa (%)').fill('50')
    await workday.getByLabel('Adicional das demais horas (%)').fill('100')
    await card.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Adicionais salvos com sucesso!')).toBeVisible()

    await page.reload()
    await expect(
      workday.getByLabel('1ª faixa: até quantas horas extras no dia')
    ).toHaveValue('02:00')
    await expect(workday.getByLabel('Adicional da 1ª faixa (%)')).toHaveValue(
      '50'
    )
    await expect(
      workday.getByLabel('Adicional das demais horas (%)')
    ).toHaveValue('100')
  })
})
