import { expect, test } from '@playwright/test'

import type { User } from '@/infra/database/types'
import { userModel } from '@/models/user/model'
import orchestrator, { MOCKED_ADMIN } from '@/tests/orchestrator'

let user: User

test.beforeAll(async () => {
  const companyId = await orchestrator.findMockedCompanyId()
  const users = await userModel.findManyByCompanyId(companyId)
  user = users[12]
})

test.describe('Pending items', () => {
  test('Dismisses an employee without a schedule and restores it', async ({
    page
  }) => {
    const label = `${user.name} · Sem escala em vigor hoje`
    await page.goto('/pendencias')
    await expect(
      page.getByRole('link', { name: /^Pendências \(\d+ abertas?\)$/ })
    ).toBeVisible()
    const openPanel = page.getByRole('tabpanel', { name: /^Abertas/ })
    const unscheduled = openPanel.getByRole('region', {
      name: /^Funcionários sem escala/
    })
    await expect(
      unscheduled.getByRole('link', { name: `Resolver: ${label}` })
    ).toHaveAttribute(
      'href',
      `/funcionarios?${new URLSearchParams({ nome: user.name })}`
    )

    await unscheduled
      .getByRole('button', { name: `Dispensar: ${label}` })
      .click()
    await expect(
      page.getByText('Pendência dispensada com sucesso!')
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: /^Abertas/ })).toBeFocused()
    await expect(
      unscheduled.getByRole('button', { name: `Dispensar: ${label}` })
    ).toHaveCount(0)

    await page.getByRole('tab', { name: /^Dispensadas/ }).click()
    const dismissedPanel = page.getByRole('tabpanel', { name: /^Dispensadas/ })
    await expect(
      dismissedPanel.getByText(`Dispensada por ${MOCKED_ADMIN.name} em`)
    ).toBeVisible()
    await dismissedPanel
      .getByRole('button', { name: `Restaurar: ${label}` })
      .click()
    await expect(
      page.getByText('Pendência restaurada com sucesso!')
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: /^Dispensadas/ })).toBeFocused()
    await expect(
      dismissedPanel.getByText('Nenhuma pendência dispensada')
    ).toBeVisible()
  })
})
