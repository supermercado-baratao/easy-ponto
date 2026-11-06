'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { Loader } from '@/app/components/ui/custom/loader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/app/components/ui/shadcn/select'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'

import { getPunchRecordsHref } from '../utils'

export const UserSelect = ({
  options,
  pis,
  period
}: {
  options: { value: string; label: string }[]
  pis: string
  period: TPunchRecordPeriod
}) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleValueChange = (value: string | null): void => {
    if (!value) return
    startTransition(() => {
      router.push(getPunchRecordsHref({ pis: value, ...period }))
    })
  }

  return (
    <>
      <Select items={options} value={pis} onValueChange={handleValueChange}>
        <SelectTrigger
          aria-label="Funcionário"
          className="w-full min-w-0 font-medium sm:w-80"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Loader open={pending} />
    </>
  )
}
