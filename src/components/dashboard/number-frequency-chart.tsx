'use client'

import { useState, useEffect, useRef } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { ArrowUpIcon, ArrowDownIcon, SearchIcon, CalendarIcon } from 'lucide-react'
import type { NumberFrequency, NumberFrequencyResponse } from '@/app/api/number-frequency/route'
import { format } from 'date-fns'

interface ChartData extends NumberFrequency {
  isHighlighted?: boolean
}

interface DateRange {
  from?: Date
  to?: Date
}

export function NumberFrequencyChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [includeAdditional, setIncludeAdditional] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchNumber, setSearchNumber] = useState('')
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null)
  const [totalDraws, setTotalDraws] = useState(0)
  const [dateRange, setDateRange] = useState<DateRange>({})

  const chartRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [includeAdditional, dateRange])

  useEffect(() => {
    // Sort data when sortOrder changes
    if (data.length > 0) {
      const sortedData = [...data].sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.frequency - b.frequency
        } else {
          return b.frequency - a.frequency
        }
      })
      setData(sortedData)
    }
  }, [sortOrder])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        includeAdditional: includeAdditional.toString()
      })

      if (dateRange.from) {
        params.append('startDate', format(dateRange.from, 'yyyy-MM-dd'))
      }
      if (dateRange.to) {
        params.append('endDate', format(dateRange.to, 'yyyy-MM-dd'))
      }

      const response = await fetch(`/api/number-frequency?${params.toString()}`)
      const result: NumberFrequencyResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      if (result.success) {
        // Sort data by frequency (descending by default)
        const sortedData = result.data.sort((a, b) => b.frequency - a.frequency)
        setData(sortedData)
        setTotalDraws(result.totalDraws)
      } else {
        setError(result.error || 'Failed to load data')
      }
    } catch (err) {
      console.error('Error fetching number frequency:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const number = parseInt(searchNumber)
    if (isNaN(number) || number < 1 || number > 49) {
      alert('Please enter a valid number between 1 and 49')
      return
    }

    setHighlightedNumber(number)

    // Update chart data with highlighting
    const updatedData = data.map(item => ({
      ...item,
      isHighlighted: item.number === number
    }))
    setData(updatedData)

    // Find the index of the number in the sorted data
    const targetIndex = updatedData.findIndex(item => item.number === number)

    if (targetIndex !== -1 && scrollContainerRef.current) {
      // Calculate approximate position (each bar is about 60px wide with padding)
      const barWidth = 60
      const targetPosition = targetIndex * barWidth

      // Center the target in the viewport
      const containerWidth = scrollContainerRef.current.clientWidth
      const scrollPosition = Math.max(0, targetPosition - containerWidth / 2)

      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
    }
  }

  const clearHighlight = () => {
    setHighlightedNumber(null)
    setSearchNumber('')
    const updatedData = data.map(item => ({
      ...item,
      isHighlighted: false
    }))
    setData(updatedData)
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const toggleIncludeAdditional = () => {
    setIncludeAdditional(prev => !prev)
  }

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range)
  }

  const clearDateRange = () => {
    setDateRange({})
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900">Number: {label}</p>
          <p className="text-blue-600 font-medium">
            Total Appearances: {payload[0].value}
          </p>
          {includeAdditional && (
            <>
              <p className="text-sm text-gray-600">
                Winning Numbers: {data.winningCount}
              </p>
              <p className="text-sm text-gray-600">
                Additional Numbers: {data.additionalCount || 0}
              </p>
            </>
          )}
          <p className="text-sm text-gray-600">
            Frequency: {((payload[0].value / totalDraws) * 100).toFixed(2)}%
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading number frequency data...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          <p className="mb-4">Error: {error}</p>
          <Button onClick={fetchData} variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="space-y-4">
        {/* Top row - Main controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 items-center">
            <Button
              onClick={toggleIncludeAdditional}
              variant={includeAdditional ? "default" : "outline"}
              size="sm"
            >
              {includeAdditional ? 'Including' : 'Excluding'} Additional Numbers
            </Button>

            <Button
              onClick={toggleSortOrder}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              Sort by Frequency
              {sortOrder === 'desc' ? <ArrowDownIcon size={16} /> : <ArrowUpIcon size={16} />}
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="Enter number (1-49)"
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                className="w-40"
                min={1}
                max={49}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="sm" variant="outline">
                <SearchIcon size={16} />
              </Button>
            </div>

            {highlightedNumber && (
              <Button onClick={clearHighlight} size="sm" variant="ghost">
                Clear Search
              </Button>
            )}
          </div>
        </div>

        {/* Second row - Date filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder="All time"
            className="w-64"
          />
          {(dateRange.from || dateRange.to) && (
            <Button onClick={clearDateRange} size="sm" variant="ghost">
              Clear Date Range
            </Button>
          )}
        </div>
      </div>

      {/* Chart Info */}
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Total Draws: {totalDraws.toLocaleString()}</span>
        <span>
          {includeAdditional ? 'Winning + Additional Numbers' : 'Winning Numbers Only'}
        </span>
      </div>

      {/* Scrollable Chart Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto border rounded-lg bg-white p-4"
        style={{ maxHeight: '500px' }}
      >
        <div style={{ minWidth: `${data.length * 60}px`, height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="number"
                tick={{ fontSize: 12, fill: '#71717a' }}
                axisLine={{ stroke: '#e4e4e7' }}
                tickLine={{ stroke: '#e4e4e7' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#71717a' }}
                axisLine={{ stroke: '#e4e4e7' }}
                tickLine={{ stroke: '#e4e4e7' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="frequency"
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isHighlighted
                      ? "#ef4444"  // Red for highlighted
                      : "#3b82f6"  // Blue for normal bars
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="text-xs text-muted-foreground">
        <p>• Numbers 1-49 showing frequency of appearance in historical draws</p>
        <p>• Scroll horizontally to view all numbers, or use search to jump to specific numbers</p>
        {highlightedNumber && (
          <p className="text-red-500">• Number {highlightedNumber} is highlighted in red</p>
        )}
      </div>
    </div>
  )
}