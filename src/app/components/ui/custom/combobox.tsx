import { ComponentProps } from 'react'

import {
  Combobox as _Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '../shadcn-ui/combobox'

type TComboboxProps = {
  placeholder?: string
  noItemsFoundText?: string
  items: { value: string; label: string; [key: string]: any }[]
} & ComponentProps<typeof _Combobox>

export const Combobox = ({
  placeholder,
  noItemsFoundText = 'Nenhum item encontrado',
  ...props
}: TComboboxProps) => {
  return (
    <_Combobox {...props}>
      <ComboboxInput placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>{noItemsFoundText}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </_Combobox>
  )
}
