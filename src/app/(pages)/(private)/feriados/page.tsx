import { MainContent } from './_components/main-content'
import { getHolidaysPageData } from './data'

const Holidays = async ({ searchParams }: PageProps<'/feriados'>) => {
  const { ano } = await searchParams
  const data = await getHolidaysPageData({
    year: Array.isArray(ano) ? ano[0] : ano
  })
  return <MainContent {...data} />
}

export default Holidays
