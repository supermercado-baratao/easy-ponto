import { MainContent } from './_components/main-content'
import { getHoursReportPageData } from './data'

// Remove this line when authentication is implemented and the ADMIN_USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const getFirstValue = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value)

const HoursReport = async ({
  searchParams
}: PageProps<'/relatorio-de-horas'>) => {
  const { inicio, fim, ordem } = await searchParams
  const data = await getHoursReportPageData({
    initialDate: getFirstValue(inicio),
    finalDate: getFirstValue(fim),
    order: getFirstValue(ordem)
  })
  return <MainContent {...data} />
}

export default HoursReport
