'use client'

import { ComponentProps, ReactNode } from 'react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label
} from '@/app/components'
import { cn } from '@/lib'

type TFormCardProps = {
  title: string
  description: string
} & ComponentProps<'div'>

export const FormCard = ({
  title,
  description,
  children,
  className,
  ...props
}: TFormCardProps) => {
  return (
    <Card className={cn('w-full', className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children}
    </Card>
  )
}

type TFormFieldProps = ComponentProps<'input'> & {
  name: string
  label: string | ReactNode
  error?: string
}

export const FormField = (props: TFormFieldProps) => {
  const { name, label, error, className, id, ...inputProps } = props

  return (
    <div className={cn('grid gap-3', className)}>
      {typeof label === 'string' ? (
        <Label
          htmlFor={id ?? name}
          className={error ? 'text-destructive' : 'inherit'}
        >
          {label}
        </Label>
      ) : (
        label
      )}
      <Input
        {...inputProps}
        id={id ?? name}
        name={name}
        className={
          error
            ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50 focus-visible:ring-[3px]'
            : 'inherit'
        }
      />
      <p className="text-destructive relative bottom-3">{error}</p>
    </div>
  )
}
