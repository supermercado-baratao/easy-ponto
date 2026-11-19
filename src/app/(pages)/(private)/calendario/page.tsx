import { MainContent } from './_components/main-content'
import { getCalendarPageData } from './data'

const Calendar = async ({ searchParams }: PageProps<'/calendario'>) => {
  const { mes } = await searchParams
  const data = await getCalendarPageData({
    month: Array.isArray(mes) ? mes[0] : mes
  })
  return <MainContent {...data} />
}

export default Calendar
