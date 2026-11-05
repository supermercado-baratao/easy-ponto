import { getOpenedConnections } from './data'

const LandingPage = async () => {
  const openedConnections = await getOpenedConnections()
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Landing Page</h1>
      <p className="mt-2 text-sm text-gray-500">
        Conexões abertas: {openedConnections}
      </p>
    </div>
  )
}

export default LandingPage
