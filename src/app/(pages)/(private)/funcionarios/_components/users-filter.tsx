'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useTransition } from 'react'

import { Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { Label } from '@/app/components/ui/shadcn/label'
import { USER_STATUSES } from '@/models/user/utils'

import { STATUS_LABELS, STATUS_PARAMS } from './utils'

const STATUS_OPTIONS = [
  { value: null, label: 'Ativos' },
  ...USER_STATUSES.map((status) => ({
    value: STATUS_PARAMS[status],
    label: STATUS_LABELS[status]
  })),
  { value: STATUS_PARAMS.all, label: 'Todos' }
]

export const UsersFilter = ({
  positions,
  filters
}: {
  positions: string[]
  filters: { name: string; position: string | null; status: string | null }
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
      router.push(query ? `/funcionarios?${query}` : '/funcionarios')
    })
  }

  return (
    <>
      {/* The key resets the uncontrolled fields when the filters change through a link or the history */}
      <form
        key={`${filters.name}|${filters.position}|${filters.status}`}
        action="/funcionarios"
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
          label="Cargo"
          placeholder="Cargo"
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
        <Select
          id="situacao"
          name="situacao"
          label="Situação"
          placeholder="Situação"
          options={STATUS_OPTIONS}
          defaultValue={filters.status}
          className="w-44"
        />
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>
      <Loader open={pending} />
    </>
  )
}
