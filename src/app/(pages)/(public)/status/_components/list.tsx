import { Typography } from '@/app/components'

export type TListItem = {
  label: string
  value: string | number
}

type TListProps = {
  items: TListItem[]
}

export const List = ({ items }: TListProps) => {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <li
          key={item.label}
          className="bg-accent rounded-sm py-2 px-8 flex flex-col text-center items-center gap-1"
        >
          <Typography component="strong" variant="caption">
            {item.label}
          </Typography>
          {item.value}
        </li>
      ))}
    </ul>
  )
}
