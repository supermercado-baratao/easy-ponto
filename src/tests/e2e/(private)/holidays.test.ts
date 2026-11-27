import { expect, type Locator, type Page, test } from '@playwright/test'

const pick = async (
  page: Page,
  scope: Locator,
  combobox: string,
  option: string
): Promise<void> => {
  await scope.getByRole('combobox', { name: combobox }).click()
  await page.getByRole('option', { name: option }).click()
}

const getTable = (page: Page, year: number): Locator =>
  page.getByRole('table', { name: `Feriados de ${year}` })

test.describe.configure({ mode: 'serial' })

test.describe('Holidays', () => {
  test('Adds the national holidays and the holidays of the company', async ({
    page
  }) => {
    await page.goto('/feriados?ano=2026')
    await expect(
      page.getByText('Nenhum feriado cadastrado em 2026')
    ).toBeVisible()

    await page
      .getByRole('button', { name: 'Adicionar feriados nacionais' })
      .click()
    const table = getTable(page, 2026)
    await expect(table.locator('tbody tr')).toHaveCount(13)
    await expect(
      table.getByRole('row', { name: /Paixão de Cristo/ }).locator('th, td')
    ).toHaveText([
      '03/04/2026',
      'sex',
      'Paixão de Cristo',
      'Nacional',
      'Móvel · 2 dias antes da Páscoa',
      ''
    ])

    await page.getByRole('button', { name: 'Cadastrar feriado' }).click()
    const createSheet = page.getByRole('dialog', { name: 'Cadastrar feriado' })
    await createSheet.getByLabel('Data').fill('2026-12-25')
    await createSheet.getByLabel('Nome').fill('Aniversário da cidade')
    await pick(page, createSheet, 'Abrangência', 'Municipal')
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
    await pick(page, createSheet, 'Repetição', 'Todo ano no mesmo dia')
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(createSheet).toBeHidden()
    await expect(
      table
        .getByRole('row', { name: /Aniversário da cidade/ })
        .locator('th, td')
    ).toHaveText([
      '19/03/2026',
      'qui',
      'Aniversário da cidade',
      'Municipal',
      'Todo ano',
      ''
    ])

    await page.getByRole('button', { name: 'Cadastrar feriado' }).click()
    await createSheet.getByLabel('Nome').fill('Festa da cidade')
    await pick(page, createSheet, 'Abrangência', 'Municipal')
    await pick(page, createSheet, 'Repetição', 'Móvel (a partir da Páscoa)')
    await createSheet.getByLabel('Dias').fill('48')
    await expect(createSheet.getByText('Em 2026: 23/05/2026')).toBeVisible()
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(createSheet).toBeHidden()
    await expect(
      table.getByRole('row', { name: /Festa da cidade/ }).locator('th, td')
    ).toHaveText([
      '23/05/2026',
      'sáb',
      'Festa da cidade',
      'Municipal',
      'Móvel · 48 dias depois da Páscoa',
      ''
    ])

    await page.getByRole('link', { name: 'Próximo ano' }).click()
    const nextYearTable = getTable(page, 2027)
    await expect(
      nextYearTable.getByRole('row', { name: /Paixão de Cristo/ })
    ).toContainText('26/03/2027')
    await expect(
      nextYearTable.getByRole('row', { name: /Festa da cidade/ })
    ).toContainText('15/05/2027')
    await expect(
      nextYearTable.getByRole('row', { name: /Aniversário da cidade/ })
    ).toContainText('19/03/2027')
  })

  test('Changes and removes a holiday from a year on, keeping the earlier years', async ({
    page
  }) => {
    await page.goto('/feriados?ano=2027')
    const table = getTable(page, 2027)

    await table
      .getByRole('button', {
        name: 'Editar Aniversário da cidade (19/03/2027)'
      })
      .click()
    const editSheet = page.getByRole('dialog', { name: 'Editar feriado' })
    await expect(
      editSheet.getByRole('combobox', { name: 'Aplicar a mudança' })
    ).toContainText('A partir de 2027')
    await editSheet.getByLabel('Data').fill('2027-03-20')
    await editSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(editSheet).toBeHidden()
    const anniversary = table.getByRole('row', {
      name: /Aniversário da cidade/
    })
    await expect(anniversary).toContainText('20/03/2027')
    await expect(anniversary).toContainText('Todo ano · desde 2027')

    await table
      .getByRole('button', { name: 'Remover Festa da cidade (15/05/2027)' })
      .click()
    const dialog = page.getByRole('alertdialog', { name: 'Remover feriado?' })
    await dialog
      .getByRole('button', { name: 'Remover a partir de 2027' })
      .click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText('Feriado removido com sucesso!')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Adicionar feriados nacionais' })
    ).toBeFocused()
    await expect(
      table.getByRole('row', { name: /Festa da cidade/ })
    ).toHaveCount(0)

    await page.getByRole('link', { name: 'Ano anterior' }).click()
    const previousYearTable = getTable(page, 2026)
    const previousAnniversary = previousYearTable.getByRole('row', {
      name: /Aniversário da cidade/
    })
    await expect(previousAnniversary).toContainText('19/03/2026')
    await expect(previousAnniversary).toContainText('Todo ano · até 2026')
    await expect(
      previousYearTable.getByRole('row', { name: /Festa da cidade/ })
    ).toContainText('Móvel · 48 dias depois da Páscoa · até 2026')

    await previousYearTable
      .getByRole('button', { name: 'Remover Festa da cidade (23/05/2026)' })
      .click()
    await dialog
      .getByRole('button', { name: 'Remover de todos os anos' })
      .click()
    await expect(dialog).toBeHidden()
    await expect(
      previousYearTable.getByRole('row', { name: /Festa da cidade/ })
    ).toHaveCount(0)
  })
})
