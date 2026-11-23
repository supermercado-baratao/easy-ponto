import { notFound } from 'next/navigation'

// The root layout lives in the (pages) group, so an unmatched URL only reaches its not-found through a route
const Unknown = () => notFound()

export default Unknown
