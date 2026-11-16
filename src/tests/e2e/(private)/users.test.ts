import { expect, test } from '@playwright/test'

import { deviceUsers } from '@/tests/_mocks/device-users'

const { name } = deviceUsers.at(-1)!

test.describe('Users', () => {
  test('Edits the status of a user and filters the list by it', async ({
    page
  }) => {
    await page.goto('/funcionarios')
    const table = page.getByRole('table', { name: 'Funcionários' })
    await expect(table.locator('tbody tr')).toHaveCount(deviceUsers.length)

    await table.getByRole('button', { name: `Editar ${name}` }).click()
    const sheet = page.getByRole('dialog', { name: 'Editar funcionário' })
    await sheet.getByLabel('Cargo').fill('Repositor')
    await sheet.getByRole('combobox', { name: 'Situação' }).click()
    await page.getByRole('option', { name: 'Desligado' }).click()
    await sheet.getByLabel('Admissão').fill('2025-02-03')
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(sheet).toBeHidden()

    await expect(table.locator('tbody tr')).toHaveCount(deviceUsers.length - 1)
    await expect(
      table.getByRole('row', { name: new RegExp(name) })
    ).toHaveCount(0)

    await page.getByRole('combobox', { name: 'Situação' }).click()
    await page.getByRole('option', { name: 'Desligado' }).click()
    await page.getByRole('button', { name: 'Filtrar' }).click()
    await expect(page).toHaveURL(/\/funcionarios\?situacao=desligado$/)
    await expect(
      table.getByRole('row', { name: new RegExp(name) }).locator('th, td')
    ).toHaveText([
      `Registros de ponto de ${name}`,
      'Repositor',
      '—',
      '03/02/2025',
      'Desligado',
      ''
    ])

    await page.getByLabel('Nome').fill(name.slice(0, 4).toUpperCase())
    await page.getByRole('combobox', { name: 'Cargo' }).click()
    await page.getByRole('option', { name: 'Repositor' }).click()
    await page.getByRole('button', { name: 'Filtrar' }).click()
    await expect(page).toHaveURL(/cargo=Repositor/)
    await expect(table.locator('tbody tr')).toHaveCount(1)

    await page.getByLabel('Nome').fill('nobody with this name')
    await page.getByRole('button', { name: 'Filtrar' }).click()
    await expect(page).toHaveURL(/nome=nobody/)
    await expect(
      page.getByText('Nenhum funcionário encontrado com esses filtros')
    ).toBeVisible()
  })
})
