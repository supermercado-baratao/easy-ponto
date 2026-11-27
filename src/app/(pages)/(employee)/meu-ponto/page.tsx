import Link from 'next/link'

import { MonthNavigation } from '@/app/components/blocks/month-navigation'
import { PunchRecordsTable } from '@/app/components/blocks/punch-records-table'
import { Typography } from '@/app/components/ui/custom/typography'
import { buttonVariants } from '@/app/components/ui/shadcn/button'
import { CHANGE_PASSWORD_PATH, EMPLOYEE_HOME_PATH } from '@/entry/session'

import { MonthTotals } from './_components/month-totals'
import { getEmployeeHomePageData } from './data'

const EmployeeHome = async ({ searchParams }: PageProps<'/meu-ponto'>) => {
  const { mes } = await searchParams
  const { name, companyName, month, journey } = await getEmployeeHomePageData({
    month: Array.isArray(mes) ? mes[0] : mes
  })

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Typography component="h1" variant="h4">
            Olá, {name}
          </Typography>
          <Typography component="p" variant="base" muted>
            Seus registros de ponto em {companyName}
          </Typography>
        </div>
        <Link
          href={CHANGE_PASSWORD_PATH}
          className={buttonVariants({ variant: 'outline' })}
        >
          Trocar senha
        </Link>
      </div>
      {journey ? (
        <>
          <MonthNavigation month={month} path={EMPLOYEE_HOME_PATH} />
          <MonthTotals
            totals={journey.totals}
            overtimePercentages={journey.overtimePercentages}
          />
          {/* The table's scroll area is already the region named by the heading */}
          <section className="flex flex-col gap-3">
            <h3 id="month-records-title" className="text-base font-medium">
              Registros do mês
            </h3>
            <PunchRecordsTable
              days={journey.days}
              justifications={journey.justifications}
              overtimePercentages={journey.overtimePercentages}
              labelledBy="month-records-title"
            />
          </section>
        </>
      ) : (
        <div>
          <Typography component="p" variant="h6">
            Cadastro de funcionário não encontrado
          </Typography>
          <Typography component="p" variant="base">
            Peça ao administrador da empresa para conferir o seu cadastro
          </Typography>
        </div>
      )}
    </main>
  )
}

export default EmployeeHome
