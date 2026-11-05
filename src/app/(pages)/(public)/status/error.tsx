'use client'

import './style.css'

import { Typography } from '@/app/components/ui/custom/typography'
import { DottedMap } from '@/app/components/ui/magic-ui/dotted-map'

import { Wrapper } from './_components/wrapper'

const Error = () => {
  return (
    <Wrapper className="justify-center">
      <div className="max-w-[30rem] text-center">
        <Typography component="h1" variant="h4" className="mb-2">
          Sistema Offline
        </Typography>
        <Typography component="p">
          Estamos enfrentando problemas para carregar o sistema. Por favor,
          aguarde um momento até que o problema seja resolvido.
        </Typography>
      </div>
      <DottedMap className="dotted-map" />
    </Wrapper>
  )
}

export default Error
