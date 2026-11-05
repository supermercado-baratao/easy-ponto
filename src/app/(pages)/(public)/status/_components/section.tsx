import { Typography } from '@/app/components/ui/custom/typography'

type TSectionProps = {
  title: string
  children: React.ReactNode
} & React.ComponentProps<'section'>

export const Section = ({ title, children, ...rest }: TSectionProps) => {
  return (
    <section {...rest}>
      <Typography component="h2" variant="h6" className="mb-2">
        {title}
      </Typography>
      {children}
    </section>
  )
}
