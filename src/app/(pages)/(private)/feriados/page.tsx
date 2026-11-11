import { MainContent } from './_components/main-content'
import { getHolidaysPageData } from './data'

// Remove this line when authentication is implemented and the ADMIN_USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const Holidays = async ({ searchParams }: PageProps<'/feriados'>) => {
  const { ano } = await searchParams
  const data = await getHolidaysPageData({
    year: Array.isArray(ano) ? ano[0] : ano
  })
  return <MainContent {...data} />
}

export default Holidays
