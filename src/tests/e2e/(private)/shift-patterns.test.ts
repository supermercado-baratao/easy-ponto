import { expect, test } from '@playwright/test'

test.describe('Shift patterns', () => {
  test('Creates a pattern from a template, adds a version and removes them', async ({
    page
  }) => {
    await page.goto('/escalas')
    await expect(page.getByText('Nenhuma escala cadastrada')).toBeVisible()

    await page.getByRole('button', { name: 'Cadastrar escala' }).click()
    const createSheet = page.getByRole('dialog', { name: 'Cadastrar escala' })
    await createSheet.getByLabel('Nome').fill('Revezamento noturno')
    await createSheet.getByRole('combobox', { name: 'Modelo' }).click()
    await page.getByRole('option', { name: '12x36' }).click()
    await expect(createSheet.getByLabel('Dias do ciclo')).toHaveValue('2')
    await expect(createSheet.getByLabel('Dia 1 – Entrada 1')).toHaveValue(
      '07:00'
    )
    await expect(createSheet.getByLabel('Dia 2 – Entrada 1')).toHaveValue('')
    await createSheet.getByLabel('Dia 1 – Entrada 1').fill('19:00')
    await createSheet.getByLabel('Dia 1 – Saída 1').fill('07:00')
    await createSheet.getByLabel('Dias do ciclo').fill('')
    await expect(createSheet.getByLabel('Dia 1 – Entrada 1')).toBeHidden()
    await createSheet.getByLabel('Dias do ciclo').fill('2')
    await expect(createSheet.getByLabel('Dia 1 – Entrada 1')).toHaveValue(
      '19:00'
    )
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(createSheet).toBeHidden()
    await expect(page.getByText('Escala salva com sucesso!')).toBeVisible()

    const section = page.getByRole('region', { name: 'Revezamento noturno' })
    await expect(
      section.getByText('Ciclo de 2 dias: 1 de trabalho e 1 de folga')
    ).toBeVisible()
    const table = section.getByRole('table')
    await expect(
      table.getByRole('row', { name: /Dia 1/ }).locator('th, td')
    ).toHaveText(['Dia 1', '19:00', '07:00+1 do dia seguinte', '—', '—'])
    await expect(
      table.getByRole('row', { name: /Dia 2/ }).locator('th, td')
    ).toHaveText(['Dia 2', 'Folga'])

    await section
      .getByRole('button', { name: 'Nova versão de Revezamento noturno' })
      .click()
    const versionSheet = page.getByRole('dialog', { name: 'Nova versão' })
    await expect(versionSheet.getByLabel('Dia 1 – Saída 1')).toHaveValue(
      '07:00'
    )
    await versionSheet.getByRole('combobox', { name: 'Modelo' }).click()
    await page.getByRole('option', { name: '6x1 (44 horas semanais)' }).click()
    await versionSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      versionSheet.getByText('Já existe uma versão com essa data')
    ).toBeVisible()
    await expect(versionSheet.getByLabel('Dias do ciclo')).toHaveValue('7')
    await expect(versionSheet.getByLabel('Dia 6 – Saída 2')).toHaveValue(
      '16:20'
    )

    await versionSheet.getByLabel('Vigente a partir de').fill('2030-01-01')
    await versionSheet.getByLabel('Dia 1 – Saída 1').fill('07:00')
    await versionSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      versionSheet.getByText('A jornada do dia deve durar menos de 24 horas')
    ).toBeVisible()
    await expect(versionSheet.getByLabel('Dia 1 – Entrada 2')).toBeFocused()

    await versionSheet.getByLabel('Dia 1 – Saída 1').fill('12:00')
    await versionSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(versionSheet).toBeHidden()
    const futureVersion = section.getByRole('region', {
      name: 'A partir de 01/01/2030 · Futura'
    })
    await expect(
      futureVersion.getByText('Ciclo de 7 dias: 6 de trabalho e 1 de folga')
    ).toBeVisible()
    await expect(
      section.getByRole('region', { name: /Em vigor$/ })
    ).toHaveCount(1)

    await futureVersion
      .getByRole('button', {
        name: 'Remover a versão de 01/01/2030 de Revezamento noturno'
      })
      .click()
    const versionDialog = page.getByRole('alertdialog', {
      name: 'Remover versão?'
    })
    await versionDialog.getByRole('button', { name: 'Remover' }).click()
    await expect(versionDialog).toBeHidden()
    await expect(page.getByText('Versão removida com sucesso!')).toBeVisible()
    await expect(
      section.getByRole('button', {
        name: 'Nova versão de Revezamento noturno'
      })
    ).toBeFocused()
    await expect(futureVersion).toHaveCount(0)
    await expect(
      section.getByRole('button', { name: /^Remover a versão de / })
    ).toHaveCount(0)

    await section
      .getByRole('button', { name: 'Remover Revezamento noturno' })
      .click()
    const dialog = page.getByRole('alertdialog', { name: 'Remover escala?' })
    await dialog.getByRole('button', { name: 'Remover' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText('Escala removida com sucesso!')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Cadastrar escala' })
    ).toBeFocused()
    await expect(page.getByText('Nenhuma escala cadastrada')).toBeVisible()
  })
})
