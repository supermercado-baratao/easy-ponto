import { getOpenedConnections } from './data'

const LandingPage = async () => {
  const openedConnections = await getOpenedConnections()
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="font-bold text-2xl">Landing Page</h1>
      <p className="mt-2 text-gray-500 text-sm">
        Conexões abertas: {openedConnections}
      </p>
    </div>
  )
}

export default LandingPage
