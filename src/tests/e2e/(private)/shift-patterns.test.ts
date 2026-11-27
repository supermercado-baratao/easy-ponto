import { expect, test } from '@playwright/test'

import { deviceUsers } from '@/tests/_mocks/device-users'

test.describe('Shift patterns', () => {
  test('Creates a pattern from a template, adds a version and removes them', async ({
    page
  }) => {
    await page.goto('/escalas')

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
    await expect(
      page.getByRole('region', { name: 'Revezamento noturno' })
    ).toHaveCount(0)
  })

  test('Links an employee to a pattern, keeps the pattern while linked and unlinks', async ({
    page
  }) => {
    const { name } = deviceUsers[0]
    await page.goto('/escalas')
    await page.getByRole('button', { name: 'Cadastrar escala' }).click()
    const createSheet = page.getByRole('dialog', { name: 'Cadastrar escala' })
    await createSheet.getByLabel('Nome').fill('Plantão 12x36')
    await createSheet.getByRole('combobox', { name: 'Modelo' }).click()
    await page.getByRole('option', { name: '12x36' }).click()
    await createSheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(createSheet).toBeHidden()

    await page.goto('/funcionarios')
    const table = page.getByRole('table', { name: 'Funcionários' })
    await table.getByRole('button', { name: `Escalas de ${name}` }).click()
    const sheet = page.getByRole('dialog')
    await expect(
      sheet.getByText('Nenhuma escala ligada a este funcionário')
    ).toBeVisible()
    await sheet.getByRole('button', { name: 'Ligar a uma escala' }).click()
    await expect(sheet.getByRole('combobox', { name: 'Escala' })).toBeFocused()
    await sheet.getByRole('combobox', { name: 'Escala' }).click()
    await page.getByRole('option', { name: 'Plantão 12x36' }).click()
    await sheet.getByLabel('Início', { exact: true }).fill('2020-01-06')
    await sheet
      .getByRole('combobox', { name: 'Dia do ciclo no início' })
      .click()
    await page.getByRole('option', { name: 'Dia 2: folga' }).click()
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      page.getByText('Escala do funcionário salva com sucesso!')
    ).toBeVisible()
    const history = sheet.getByRole('list', { name: 'Histórico de escalas' })
    await expect(history.getByRole('listitem')).toHaveText([
      /Plantão 12x36\s*Desde 06\/01\/2020, a partir do dia 2 do ciclo/
    ])

    await sheet
      .getByRole('button', {
        name: 'Editar a escala Plantão 12x36 (Desde 06/01/2020)'
      })
      .click()
    await sheet.getByLabel('Fim (opcional)').fill('2020-01-01')
    await sheet.getByRole('button', { name: 'Salvar' }).click()
    await expect(
      sheet.getByText('O fim deve ser depois do início')
    ).toBeVisible()
    await expect(sheet.getByLabel('Fim (opcional)')).toBeFocused()
    await sheet.getByRole('button', { name: 'Cancelar' }).click()
    await expect(
      sheet.getByRole('button', {
        name: 'Editar a escala Plantão 12x36 (Desde 06/01/2020)'
      })
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(
      table.getByRole('row', { name: new RegExp(name) })
    ).toContainText('Plantão 12x36')

    await page.goto('/escalas')
    await page
      .getByRole('region', { name: 'Plantão 12x36' })
      .getByRole('button', { name: 'Remover Plantão 12x36' })
      .click()
    await page
      .getByRole('alertdialog', { name: 'Remover escala?' })
      .getByRole('button', { name: 'Remover' })
      .click()
    await expect(
      page.getByText('A escala Plantão 12x36 está ligada a 1 funcionário.')
    ).toBeVisible()

    await page.goto('/funcionarios')
    await table.getByRole('button', { name: `Escalas de ${name}` }).click()
    await sheet
      .getByRole('button', {
        name: 'Remover a escala Plantão 12x36 (Desde 06/01/2020)'
      })
      .click()
    await page
      .getByRole('alertdialog', { name: 'Remover a escala do funcionário?' })
      .getByRole('button', { name: 'Remover' })
      .click()
    await expect(
      page.getByText('Escala removida do funcionário com sucesso!')
    ).toBeVisible()
    await expect(
      sheet.getByRole('button', { name: 'Ligar a uma escala' })
    ).toBeFocused()
    await expect(
      sheet.getByText('Nenhuma escala ligada a este funcionário')
    ).toBeVisible()

    await page.goto('/escalas')
    await page
      .getByRole('region', { name: 'Plantão 12x36' })
      .getByRole('button', { name: 'Remover Plantão 12x36' })
      .click()
    await page
      .getByRole('alertdialog', { name: 'Remover escala?' })
      .getByRole('button', { name: 'Remover' })
      .click()
    await expect(
      page.getByRole('region', { name: 'Plantão 12x36' })
    ).toHaveCount(0)
  })
})
