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
    ...inputProps
  } = props
  const descriptionId = `${id}-description`

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
        aria-describedby={description ? descriptionId : undefined}
        className={
          error
            ? 'border-destructive focus-visible:border-destructive focus-visible:ring-[3px] focus-visible:ring-destructive/50'
            : undefined
        }
      />
      {description && (
        <p id={descriptionId} className="-mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <p className="relative bottom-3 text-destructive">{error}</p>
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
    <div className={cn('grid gap-3', className)} {...props}>
      <Label htmlFor={id} className={error ? 'text-destructive' : undefined}>
        {label}
      </Label>
      <_Select
        key={defaultValue}
        name={name}
        defaultValue={defaultValue}
        items={options}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={!!error}>
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
      <p className="relative bottom-3 text-destructive">{error}</p>
    </div>
  )
}
