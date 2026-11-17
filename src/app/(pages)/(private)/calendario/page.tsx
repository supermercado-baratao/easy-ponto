import { MainContent } from './_components/main-content'
import { getCalendarPageData } from './data'

// Remove this line when authentication is implemented and the ADMIN_USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const Calendar = async ({ searchParams }: PageProps<'/calendario'>) => {
  const { mes } = await searchParams
  const data = await getCalendarPageData({
    month: Array.isArray(mes) ? mes[0] : mes
  })
  return <MainContent {...data} />
}

export default Calendar
