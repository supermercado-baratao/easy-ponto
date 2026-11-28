export const ReportSection = ({
  id,
  title,
  description,
  children
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) => (
  <section
    aria-labelledby={id}
    className="flex flex-col gap-3 print:break-inside-avoid-page"
  >
    <div className="flex flex-col gap-1">
      <h2 id={id} className="text-base font-medium">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    {children}
  </section>
)
