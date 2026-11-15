'use client'

import { cn } from 'cn'
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
  description?: string
  error?: string
}

export const FormField = (props: TFormFieldProps) => {
  const {
    name,
    label,
    description,
    error,
    className,
    id = name,
    'aria-describedby': ariaDescribedBy,
    ...inputProps
  } = props
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const describedBy = [
    ariaDescribedBy,
    description && descriptionId,
    error && errorId
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cn('grid gap-3', className)}>
      {typeof label === 'string' ? (
        <Label htmlFor={id} className={error ? 'text-destructive' : undefined}>
          {label}
        </Label>
      ) : (
        label
      )}
      <Input
        {...inputProps}
        id={id}
        name={name}
        aria-describedby={describedBy || undefined}
        aria-invalid={!!error}
      />
      {description && (
        <p id={descriptionId} className="-mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <p id={errorId} className="relative bottom-3 text-destructive">
        {error}
      </p>
    </div>
  )
}

export const Select = ({
  options,
  placeholder,
  label,
  error,
  name,
  id = name,
  defaultValue,
  onValueChange,
  className,
  ...props
}: {
  name: string
  defaultValue?: string
  onValueChange?: (value: string | null) => void
  placeholder: string
  label?: string
  options: { value: string; label: string }[]
  error?: string
} & ComponentProps<'div'>) => {
  const errorId = `${id}-error`

  return (
    <div className={cn('grid gap-3', className)} {...props}>
      <Label htmlFor={id} className={error ? 'text-destructive' : undefined}>
        {label}
      </Label>
      <_Select
        key={defaultValue}
        name={name}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        items={options}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        >
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
      <p id={errorId} className="relative bottom-3 text-destructive">
        {error}
      </p>
    </div>
  )
}
