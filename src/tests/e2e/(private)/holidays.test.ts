import { expect, test } from '@playwright/test'

test.describe('Holidays', () => {
  test('Adds, edits and removes the holidays of the year', async ({ page }) => {
    await page.goto('/feriados?ano=2026')
    await expect(
      page.getByText('Nenhum feriado cadastrado em 2026')
    ).toBeVisible()

    await page
      .getByRole('button', { name: 'Adicionar feriados nacionais de 2026' })
      .click()
    const table = page.getByRole('table', { name: 'Feriados de 2026' })
    await expect(table.locator('tbody tr')).toHaveCount(13)
    await expect(
      table.getByRole('row', { name: /Paixão de Cristo/ }).locator('th, td')
    ).toHaveText([
      '03/04/2026',
      'sex',
      'Paixão de Cristo',
      'Nacional',
      'Só neste ano',
      ''
    ])

    await page.getByRole('button', { name: 'Cadastrar feriado' }).click()
    const createSheet = page.getByRole('dialog', { name: 'Cadastrar feriado' })
    await createSheet.getByLabel('Data').fill('2026-12-25')
    await createSheet.getByLabel('Nome').fill('Aniversário da cidade')
    await createSheet.getByRole('combobox', { name: 'Abrangência' }).click()
    await page.getByRole('option', { name: 'Municipal' }).click()
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      createSheet.getByText('Já existe um feriado nessa data: Natal')
    ).toBeVisible()
    await expect(createSheet.getByLabel('Nome')).toHaveValue(
      'Aniversário da cidade'
    )
    await expect(
      createSheet.getByRole('combobox', { name: 'Abrangência' })
    ).toContainText('Municipal')

    await createSheet.getByLabel('Data').fill('2026-03-19')
    await createSheet.getByRole('checkbox', { name: 'Repete todo ano' }).click()
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(createSheet).toBeHidden()
    const anniversary = table.getByRole('row', {
      name: /Aniversário da cidade/
    })
    await expect(anniversary.locator('th, td')).toHaveText([
      '19/03/2026',
      'qui',
      'Aniversário da cidade',
      'Municipal',
      'Todo ano',
      ''
    ])

    await anniversary
      .getByRole('button', {
        name: 'Editar Aniversário da cidade (19/03/2026)'
      })
      .click()
    const editSheet = page.getByRole('dialog', { name: 'Editar feriado' })
    await expect(
      editSheet.getByRole('checkbox', { name: 'Repete todo ano' })
    ).toBeChecked()
    await editSheet.getByLabel('Nome').fill('Dia de São José')
    await editSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(editSheet).toBeHidden()
    const saintJoseph = table.getByRole('row', { name: /Dia de São José/ })
    await expect(saintJoseph).toBeVisible()

    await page.getByRole('link', { name: 'Próximo ano' }).click()
    const nextYearTable = page.getByRole('table', { name: 'Feriados de 2027' })
    await expect(
      nextYearTable.getByRole('row', { name: /Dia de São José/ })
    ).toContainText('19/03/2027')
    await expect(
      nextYearTable.getByRole('row', { name: /Paixão de Cristo/ })
    ).toHaveCount(0)

    await page.getByRole('link', { name: 'Ano anterior' }).click()
    await saintJoseph
      .getByRole('button', { name: 'Remover Dia de São José (19/03/2026)' })
      .click()
    const dialog = page.getByRole('alertdialog', { name: 'Remover feriado?' })
    await dialog.getByRole('button', { name: 'Remover' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText('Feriado removido com sucesso!')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Adicionar feriados nacionais de 2026' })
    ).toBeFocused()
    await expect(saintJoseph).toHaveCount(0)
    await expect(table.locator('tbody tr')).toHaveCount(13)
  })
})
