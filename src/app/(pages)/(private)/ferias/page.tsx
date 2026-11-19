import { MainContent } from './_components/main-content'
import { getVacationsPageData } from './data'

const Vacations = async ({ searchParams }: PageProps<'/ferias'>) => {
  const { ano } = await searchParams
  const data = await getVacationsPageData({
    year: Array.isArray(ano) ? ano[0] : ano
  })
  return <MainContent {...data} />
}

export default Vacations
