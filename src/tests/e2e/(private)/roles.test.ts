import { faker } from '@faker-js/faker'
import { expect, test } from '@playwright/test'

import { VIEWER_ROLE } from '@/models/account/utils'
import { SIGNED_OUT_STORAGE_STATE } from '@/tests/_utils/e2e-auth'
import orchestrator from '@/tests/orchestrator'

test.use({ storageState: SIGNED_OUT_STORAGE_STATE })

const viewer = {
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password({ length: 12 })
}

test.beforeAll(async () => {
  await orchestrator.createMember({
    ...viewer,
    companyId: await orchestrator.findMockedCompanyId(),
    role: VIEWER_ROLE
  })
})

test.beforeEach(async ({ page }) => {
  await page.goto('/entrar')
  const panel = page.getByRole('tabpanel')
  await panel.getByRole('textbox', { name: 'E-mail' }).fill(viewer.email)
  await panel.getByLabel('Senha', { exact: true }).fill(viewer.password)
  await panel.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/registros-de-ponto')
})

test.describe('Viewer', () => {
  test('Sees the punch records without the editing actions', async ({
    page
  }) => {
    await expect(
      page.getByRole('table', { name: 'Registros de ponto' })
    ).toBeVisible()

    await expect(page.getByRole('button', { name: 'Sincronizar' })).toHaveCount(
      0
    )
    await expect(page.getByRole('button', { name: /^Ações de / })).toHaveCount(
      0
    )
    await expect(page.getByRole('link', { name: 'Configurações' })).toHaveCount(
      0
    )
  })

  test('Sees the pending items without dismissing them', async ({ page }) => {
    await page.goto('/pendencias')
    const unscheduled = page.getByRole('region', {
      name: /^Funcionários sem escala/
    })
    await expect(
      unscheduled.getByRole('link', { name: /^Ver: / }).first()
    ).toBeVisible()

    await expect(
      page.getByRole('button', { name: /^Dispensar: / })
    ).toHaveCount(0)
    await expect(page.getByRole('link', { name: /^Resolver: / })).toHaveCount(0)
  })

  test('Sees the employees, the holidays and the shift patterns without the editing actions', async ({
    page
  }) => {
    await page.goto('/funcionarios')
    await expect(
      page.getByRole('table', { name: 'Funcionários' })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /^Editar / })).toHaveCount(0)

    await page.goto('/feriados')
    await expect(page.getByRole('heading', { name: 'Feriados' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Cadastrar feriado' })
    ).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: /^Adicionar feriados nacionais/ })
    ).toHaveCount(0)

    await page.goto('/escalas')
    await expect(page.getByRole('heading', { name: 'Escalas' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Cadastrar escala' })
    ).toHaveCount(0)
  })

  test('Sees the hours report without closing the period', async ({ page }) => {
    await page.goto('/relatorio-de-horas')
    await expect(
      page.getByRole('table', { name: 'Relatório de horas' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Fechar período' })
    ).toHaveCount(0)
  })

  test('Is sent from the settings and the members to the punch records', async ({
    page
  }) => {
    await expect(page.getByRole('link', { name: 'Membros' })).toHaveCount(0)

    await page.goto('/configuracoes')
    await expect(page).toHaveURL('/registros-de-ponto')

    await page.goto('/membros')
    await expect(page).toHaveURL('/registros-de-ponto')
  })
})
