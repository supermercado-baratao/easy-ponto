'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/app/components/ui/shadcn/select'
import {
  DEFAULT_TIME_CARD_REPORT_FORMAT,
  TIME_CARD_REPORT_FORMAT_LABELS,
  TIME_CARD_REPORT_FORMATS
} from '@/models/time-card-report/utils'

const FORMAT_OPTIONS = TIME_CARD_REPORT_FORMATS.map((format) => ({
  value: format,
  label: TIME_CARD_REPORT_FORMAT_LABELS[format]
}))

export const ReportFormatSelect = ({ disabled }: { disabled?: boolean }) => (
  <Select
    name="format"
    defaultValue={DEFAULT_TIME_CARD_REPORT_FORMAT}
    items={FORMAT_OPTIONS}
    disabled={disabled}
  >
    <SelectTrigger aria-label="Sistema de origem">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {FORMAT_OPTIONS.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
