import { MainContent } from './_components/main-content'
import { getAgendaPageData } from './data'

const getFirstValue = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value)

const Agenda = async ({ searchParams }: PageProps<'/expedientes'>) => {
  const { nome, cargo, situacao, horario } = await searchParams
  const data = await getAgendaPageData({
    name: getFirstValue(nome),
    position: getFirstValue(cargo),
    status: getFirstValue(situacao),
    time: getFirstValue(horario)
  })
  return <MainContent {...data} />
}

export default Agenda
