import { faker } from '@faker-js/faker'
import { expect, test } from '@playwright/test'

import { MOCKED_ADMIN } from '@/tests/orchestrator'

test.describe('Members', () => {
  test('Adds a member, changes the role and removes them from the company', async ({
    page
  }) => {
    const member = {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase()
    }
    await page.goto('/membros')
    const table = page.getByRole('table', { name: 'Membros' })
    await expect(
      table.getByRole('row', { name: new RegExp(MOCKED_ADMIN.email) })
    ).toContainText('Proprietário')
    await expect(
      page.getByRole('button', { name: `Ações de ${MOCKED_ADMIN.name}` })
    ).toHaveCount(0)

    await page.getByRole('button', { name: 'Adicionar membro' }).click()
    const sheet = page.getByRole('dialog', { name: 'Adicionar membro' })
    await sheet.getByLabel('Nome').fill(member.name)
    await sheet.getByLabel('E-mail').fill(MOCKED_ADMIN.email)
    await sheet.getByRole('combobox', { name: 'Papel' }).click()
    await page.getByRole('option', { name: 'Visualizador' }).click()
    await sheet.getByLabel('Senha temporária').fill('senha-temporaria')
    await sheet.getByRole('button', { name: 'Adicionar' }).click()
    await expect(
      sheet.getByText('Esse e-mail já é de um membro da empresa')
    ).toBeVisible()
    await expect(sheet.getByLabel('Nome')).toHaveValue(member.name)
    await expect(sheet.getByLabel('Senha temporária')).toHaveValue('')

    await sheet.getByLabel('E-mail').fill(member.email)
    await sheet.getByLabel('Senha temporária').fill('senha-temporaria')
    await sheet.getByRole('button', { name: 'Adicionar' }).click()
    await expect(sheet).toBeHidden()
    const row = table.getByRole('row', { name: new RegExp(member.email) })
    await expect(row.locator('th, td')).toHaveText([
      member.name,
      member.email,
      'Visualizador',
      ''
    ])

    await row.getByRole('button', { name: `Ações de ${member.name}` }).click()
    await page.getByRole('menuitem', { name: 'Tornar admin' }).click()
    await expect(row).toContainText('Admin')

    const actions = row.getByRole('button', {
      name: `Ações de ${member.name}`
    })
    await actions.click()
    await page.getByRole('menuitem', { name: 'Remover da empresa' }).click()
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(actions).toBeFocused()

    await actions.click()
    await page.getByRole('menuitem', { name: 'Remover da empresa' }).click()
    const dialog = page.getByRole('alertdialog', {
      name: 'Remover da empresa?'
    })
    await dialog.getByRole('button', { name: 'Remover' }).click()
    await expect(dialog).toBeHidden()
    await expect(row).toHaveCount(0)
  })
})
