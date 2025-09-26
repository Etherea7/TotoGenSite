'use client'

import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface DateRange {
  from?: Date
  to?: Date
}

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  className
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState<DateRange>(value || {})

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    const newRange = { ...tempRange }

    if (!newRange.from || (newRange.from && newRange.to)) {
      // First selection or resetting range
      newRange.from = date
      newRange.to = undefined
    } else if (date < newRange.from) {
      // Selected date is before start date
      newRange.from = date
      newRange.to = undefined
    } else {
      // Selected date is after start date
      newRange.to = date
    }

    setTempRange(newRange)
  }

  const handleApply = () => {
    onChange?.(tempRange)
    setIsOpen(false)
  }

  const handleClear = () => {
    const emptyRange = {}
    setTempRange(emptyRange)
    onChange?.(emptyRange)
    setIsOpen(false)
  }

  const formatRange = () => {
    if (!value?.from) return placeholder

    if (value.from && !value.to) {
      return `${format(value.from, 'MMM dd, yyyy')} - ...`
    }

    if (value.from && value.to) {
      return `${format(value.from, 'MMM dd, yyyy')} - ${format(value.to, 'MMM dd, yyyy')}`
    }

    return placeholder
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Select Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={tempRange.from ? format(tempRange.from, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined
                      setTempRange({ ...tempRange, from: date })
                    }}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={tempRange.to ? format(tempRange.to, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined
                      setTempRange({ ...tempRange, to: date })
                    }}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            <Calendar
              mode="range"
              selected={{ from: tempRange.from, to: tempRange.to }}
              onSelect={(range) => {
                if (range?.from) {
                  setTempRange({ from: range.from, to: range.to })
                }
              }}
              numberOfMonths={2}
              className="rounded-md border"
            />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleClear}>
                Clear
              </Button>
              <Button size="sm" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}