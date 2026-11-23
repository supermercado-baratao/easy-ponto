import type { LucideIcon } from 'lucide-react'

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/app/components/ui/shadcn/empty'

export const PageMessage = ({
  icon: Icon,
  title,
  titleAs: Title = 'h1',
  description,
  children
}: {
  icon: LucideIcon
  title: string
  titleAs?: 'h1' | 'h2'
  description: React.ReactNode
  children?: React.ReactNode
}) => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Icon aria-hidden />
      </EmptyMedia>
      <EmptyTitle className="text-lg">
        <Title>{title}</Title>
      </EmptyTitle>
      <EmptyDescription>{description}</EmptyDescription>
    </EmptyHeader>
    {children && (
      <EmptyContent className="flex-row justify-center">
        {children}
      </EmptyContent>
    )}
  </Empty>
)
