'use client'

import { useEffect, useRef } from 'react'

export const SelectedUserHeading = ({
  id,
  userId,
  name
}: {
  id: string
  userId: string
  name: string
}) => {
  const reference = useRef<HTMLHeadingElement>(null)

  // The grid renders above the list of employees, so the focus would stay on the link far below it
  useEffect(() => {
    reference.current?.focus()
  }, [userId])

  return (
    <h3
      ref={reference}
      id={id}
      tabIndex={-1}
      className="text-base font-medium outline-none"
    >
      {name}
    </h3>
  )
}
