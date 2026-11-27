import { expect, type Locator, type Page, test } from '@playwright/test'

import { deviceUsers } from '@/tests/_mocks/device-users'

const [{ name }] = deviceUsers

const pick = async (
  page: Page,
  scope: Page | Locator,
  combobox: string,
  option: string
): Promise<void> => {
  await scope.getByRole('combobox', { name: combobox }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

test.describe('Groups and functions', () => {
  test('Gives an employee a section and another function and filters by them', async ({
    page
  }) => {
    await page.goto('/grupos')
    await page.getByRole('button', { name: 'Cadastrar grupo' }).click()
    let sheet = page.getByRole('dialog', { name: 'Cadastrar grupo' })
    await sheet.getByLabel('Nome').fill('Reposição')
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(sheet).toBeHidden()

    await page.getByRole('button', { name: 'Cadastrar grupo' }).click()
    sheet = page.getByRole('dialog', { name: 'Cadastrar grupo' })
    await sheet.getByLabel('Nome').fill('Cereais')
    await pick(page, sheet, 'Dentro de', 'Reposição')
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(sheet).toBeHidden()
    await expect(
      page
        .getByRole('table', { name: 'Grupos' })
        .getByRole('row', { name: /Cereais/ })
        .locator('th, td')
    ).toHaveText(['Cereais', 'Reposição', '0', ''])

    await page.goto('/funcoes')
    await page.getByRole('button', { name: 'Cadastrar função' }).click()
    sheet = page.getByRole('dialog', { name: 'Cadastrar função' })
    await sheet.getByLabel('Nome').fill('Operador de caixa')
    await sheet.getByLabel('Nível').fill('2')
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(sheet).toBeHidden()

    await page.goto('/funcionarios')
    const table = page.getByRole('table', { name: 'Funcionários' })
    await table.getByRole('button', { name: `Editar ${name}` }).click()
    sheet = page.getByRole('dialog', { name: 'Editar funcionário' })
    await sheet
      .getByRole('checkbox', { name: 'Operador de caixa (nível 2)' })
      .click()
    await sheet.getByRole('checkbox', { name: 'Reposição › Cereais' }).click()
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(sheet).toBeHidden()

    const row = table.getByRole('row', { name: new RegExp(name) })
    await expect(row.getByRole('cell').nth(1)).toHaveText('Operador de caixa')
    await expect(row.getByRole('cell').nth(2)).toHaveText('Reposição › Cereais')

    await pick(page, page, 'Grupo', 'Reposição')
    await page.getByRole('button', { name: 'Filtrar' }).click()
    await expect(page).toHaveURL(/grupo=Reposi%C3%A7%C3%A3o/)
    await expect(table.locator('tbody tr')).toHaveCount(1)
    await expect(row).toBeVisible()

    await page.goto('/funcionarios')
    await pick(page, page, 'Função', 'Operador de caixa')
    await page.getByRole('button', { name: 'Filtrar' }).click()
    await expect(page).toHaveURL(/funcao=Operador/)
    await expect(table.locator('tbody tr')).toHaveCount(1)
    await expect(row).toBeVisible()
  })
})
