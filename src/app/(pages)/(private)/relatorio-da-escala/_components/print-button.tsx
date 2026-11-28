'use client'

import { Printer } from 'lucide-react'

import { Button } from '@/app/components/ui/shadcn/button'

export const PrintButton = () => (
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="print:hidden"
    onClick={() => print()}
  >
    <Printer aria-hidden="true" />
    Imprimir
  </Button>
)
