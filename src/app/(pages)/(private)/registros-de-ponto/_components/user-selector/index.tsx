'use client'

import { User } from '@prisma/client'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import { Button, Combobox } from '@/app/components'

export const UserSelector = ({ users }: { users: User[] }) => {
  const router = useRouter()
  const pathname = usePathname()

  const segments = pathname.split('/')
  const lastSegment = segments[segments.length - 1]
  const currentPis = lastSegment !== 'registros-de-ponto' ? lastSegment : null

  if (!currentPis && !users.length) {
    router.push(`/registros-de-ponto/${users[0].pis}`)
    return null
  }

  const currentUser = users.find((user) => user.pis === currentPis)
  const currentIndex = currentUser ? users.indexOf(currentUser) : -1

  const navigateTo = (pis: string) => {
    router.push(`/registros-de-ponto/${pis}`)
  }

  const handleValueChange = (value: unknown) => {
    const user = users.find((user) => user.id === value)
    if (user) navigateTo(user.pis)
  }

  const handlePrevious = () => {
    if (currentIndex > 0) navigateTo(users[currentIndex - 1].pis)
  }

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < users.length - 1) {
      navigateTo(users[currentIndex + 1].pis)
    }
  }

  const isPrevButtonDisabled = currentIndex <= 0
  const isNextButtonDisabled =
    currentIndex === -1 || currentIndex === users.length - 1

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={isPrevButtonDisabled}
      >
        <ArrowLeft />
      </Button>
      <Combobox
        name="user"
        placeholder="Selecione um usuário"
        value={currentUser?.name}
        onValueChange={handleValueChange}
        items={users.map((user) => ({ value: user.id, label: user.name }))}
      />
      <Button
        variant="outline"
        onClick={handleNext}
        disabled={isNextButtonDisabled}
      >
        <ArrowRight />
      </Button>
    </div>
  )
}
