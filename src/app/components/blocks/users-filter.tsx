'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, type ReactNode, useTransition } from 'react'

import { Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { Label } from '@/app/components/ui/shadcn/label'
import { STATUS_LABELS, STATUS_PARAMS } from '@/app/utils/user-status'
import type { JobFunction, UserGroup } from '@/infra/database/types'
import { USER_STATUSES } from '@/models/user/utils'
import { getGroupLabel, sortGroupsByPath } from '@/models/user-group/utils'

const STATUS_OPTIONS = [
  { value: null, label: 'Ativos' },
  ...USER_STATUSES.map((status) => ({
    value: STATUS_PARAMS[status],
    label: STATUS_LABELS[status]
  })),
  { value: STATUS_PARAMS.all, label: 'Todos' }
]

export type TUsersFilterValues = {
  name: string
  position: string | null
  status: string | null
  group: string | null
  jobFunction: string | null
}

export const UsersFilter = <T extends TUsersFilterValues>({
  path,
  positions,
  groups,
  jobFunctions,
  filters,
  children
}: {
  path: string
  positions: string[]
  groups: UserGroup[]
  jobFunctions: JobFunction[]
  filters: T
  children?: ReactNode
}) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // The native GET puts every field in the URL, even the empty ones and the defaults
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const parameters = new URLSearchParams()
    const formData = new FormData(event.currentTarget)
    for (const [key, value] of formData) {
      if (typeof value === 'string' && value.trim()) {
        parameters.set(key, value.trim())
      }
    }
    const query = parameters.toString()
    startTransition(() => {
      router.push(query ? `${path}?${query}` : path)
    })
  }

  return (
    <>
      {/* The key resets the uncontrolled fields when the filters change through a link or the history */}
      <form
        key={JSON.stringify(filters)}
        action={path}
        role="search"
        aria-label="Filtros"
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-4"
      >
        <div className="grid gap-3">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            name="nome"
            type="search"
            defaultValue={filters.name}
            className="w-64"
          />
        </div>
        <Select
          id="cargo"
          name="cargo"
          label="Cargo na folha"
          placeholder="Cargo na folha"
          options={[
            { value: null, label: 'Todos' },
            ...positions.map((position) => ({
              value: position,
              label: position
            }))
          ]}
          defaultValue={filters.position}
          className="w-56"
        />
        {jobFunctions.length > 0 && (
          <Select
            id="funcao"
            name="funcao"
            label="Função"
            placeholder="Função"
            options={[
              { value: null, label: 'Todas' },
              ...jobFunctions.map(({ name }) => ({ value: name, label: name }))
            ]}
            defaultValue={filters.jobFunction}
            className="w-56"
          />
        )}
        {groups.length > 0 && (
          <Select
            id="grupo"
            name="grupo"
            label="Grupo"
            placeholder="Grupo"
            options={[
              { value: null, label: 'Todos' },
              ...sortGroupsByPath(groups).map((group) => ({
                value: group.name,
                label: getGroupLabel(groups, group.id)
              }))
            ]}
            defaultValue={filters.group}
            className="w-56"
          />
        )}
        <Select
          id="situacao"
          name="situacao"
          label="Situação"
          placeholder="Situação"
          options={STATUS_OPTIONS}
          defaultValue={filters.status}
          className="w-44"
        />
        {children}
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>
      <Loader open={pending} />
    </>
  )
}
