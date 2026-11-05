'use client'

import { ComponentProps, ReactNode } from 'react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/app/components/ui/shadcn/card'
import { Input } from '@/app/components/ui/shadcn/input'
import { Label } from '@/app/components/ui/shadcn/label'
import {
  Select as _Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/app/components/ui/shadcn/select'
import { cn } from '@/lib/utils'

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

export const Select = ({
  options,
  placeholder,
  label,
  error,
  name,
  defaultValue,
  className,
  ...props
}: {
  name: string
  defaultValue?: string
  placeholder: string
  label?: string
  options: { value: string; label: string }[]
  error?: string
} & ComponentProps<'div'>) => {
  return (
    <div
      className={cn('grid gap-3', className)}
      {...props}
      aria-invalid={!!error}
    >
      <Label htmlFor={name} className={error ? 'text-destructive' : 'inherit'}>
        {label}
      </Label>
      <_Select key={defaultValue} name={name} defaultValue={defaultValue}>
        <SelectTrigger className="w-full" aria-invalid={!!error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{placeholder}</SelectLabel>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </_Select>
      <p className="text-destructive relative bottom-3">{error}</p>
    </div>
  )
}
