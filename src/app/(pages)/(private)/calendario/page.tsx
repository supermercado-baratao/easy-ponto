import { MainContent } from './_components/main-content'
import { getCalendarPageData } from './data'

const getFirstValue = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value)

const Calendar = async ({ searchParams }: PageProps<'/calendario'>) => {
  const { mes, funcionario, nome, cargo, situacao, grupo, funcao } =
    await searchParams
  const data = await getCalendarPageData({
    month: getFirstValue(mes),
    userId: getFirstValue(funcionario),
    name: getFirstValue(nome),
    position: getFirstValue(cargo),
    status: getFirstValue(situacao),
    group: getFirstValue(grupo),
    jobFunction: getFirstValue(funcao)
  })
  return <MainContent {...data} />
}

export default Calendar
