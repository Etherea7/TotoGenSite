'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { CalendarIcon, BarChart3Icon, PieChartIcon } from 'lucide-react'
import { format } from 'date-fns'

interface DateRange {
  from?: Date
  to?: Date
}

interface RangeData {
  range: string
  count: number
  percentage: number
  color: string
  [key: string]: string | number
}

interface NumberRangeResponse {
  success: boolean
  data: RangeData[]
  totalNumbers: number
  totalDraws: number
  dateRange?: {
    startDate?: string
    endDate?: string
  }
  message?: string
  error?: string
}

const RANGE_COLORS = [
  '#D97706', // gold-dark
  '#DC2626', // lucky-red
  '#F59E0B', // gold-mid
  '#991B1B', // lucky-red-dark
  '#FFD700'  // gold
]

interface RangeTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: RangeData
  }>
  label?: string
}

const RangeTooltip = memo(function RangeTooltip({ active, payload, label }: RangeTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-gray-900">Range: {label}</p>
        <p className="text-amber-600 font-medium">
          Count: {payload[0].value}
        </p>
        <p className="text-sm text-gray-600">
          Percentage: {data.percentage.toFixed(1)}%
        </p>
      </div>
    )
  }

  return null
})

interface PieTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: RangeData
  }>
}

const PieTooltip = memo(function PieTooltip({ active, payload }: PieTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-gray-900">Range: {data.range}</p>
        <p className="text-amber-600 font-medium">
          Count: {data.count}
        </p>
        <p className="text-sm text-gray-600">
          Percentage: {data.percentage.toFixed(1)}%
        </p>
      </div>
    )
  }

  return null
})

export function NumberRangeChart() {
  const [data, setData] = useState<RangeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [includeAdditional, setIncludeAdditional] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({})
  const [totalNumbers, setTotalNumbers] = useState(0)
  const [totalDraws, setTotalDraws] = useState(0)
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')
  const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
  const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        includeAdditional: includeAdditional.toString()
      })

      if (startDate) {
        params.append('startDate', startDate)
      }
      if (endDate) {
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/number-ranges?${params.toString()}`)
      const result: NumberRangeResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      if (result.success) {
        // Add colors to the data
        const dataWithColors = result.data.map((item, index) => ({
          ...item,
          color: RANGE_COLORS[index % RANGE_COLORS.length]
        }))

        setData(dataWithColors)
        setTotalNumbers(result.totalNumbers)
        setTotalDraws(result.totalDraws)
      } else {
        setError(result.error || 'Failed to load data')
      }
    } catch (err) {
      console.error('Error fetching number range data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [endDate, includeAdditional, startDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const chartData = useMemo(() => data, [data])

  const toggleIncludeAdditional = useCallback(() => {
    setIncludeAdditional(prev => !prev)
  }, [])

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range)
  }, [])

  const clearDateRange = useCallback(() => {
    setDateRange({})
  }, [])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading number range data...</p>
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
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Number Range Distribution
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Distribution of lottery numbers across different ranges
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setChartType('bar')}
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
              >
                <BarChart3Icon className="h-4 w-4 mr-1" />
                Bar Chart
              </Button>
              <Button
                onClick={() => setChartType('pie')}
                variant={chartType === 'pie' ? 'default' : 'outline'}
                size="sm"
              >
                <PieChartIcon className="h-4 w-4 mr-1" />
                Pie Chart
              </Button>
            </div>
          </div>

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
            <span>Total Numbers: {totalNumbers.toLocaleString()}</span>
            <span>Total Draws: {totalDraws.toLocaleString()}</span>
            <span>
              {includeAdditional ? 'Winning + Additional Numbers' : 'Winning Numbers Only'}
            </span>
          </div>

          {/* Chart */}
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%" debounce={80}>
              {chartType === 'bar' ? (
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    axisLine={{ stroke: '#e4e4e7' }}
                    tickLine={{ stroke: '#e4e4e7' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    axisLine={{ stroke: '#e4e4e7' }}
                    tickLine={{ stroke: '#e4e4e7' }}
                  />
                  <Tooltip animationDuration={120} content={<RangeTooltip />} />
                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  >
                    {chartData.map((entry) => (
                      <Cell key={`cell-${entry.range}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent as number * 100).toFixed(1)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="range"
                    isAnimationActive={false}
                  >
                    {chartData.map((entry) => (
                      <Cell key={`cell-${entry.range}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip animationDuration={120} content={<PieTooltip />} />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
            {chartData.map((range) => (
              <div key={range.range} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold" style={{ color: range.color }}>
                  {range.count}
                </div>
                <div className="text-sm text-muted-foreground">
                  {range.range}
                </div>
                <div className="text-xs text-muted-foreground">
                  {range.percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="text-xs text-muted-foreground">
            <p>• Each range represents lottery numbers that fall within specific numeric boundaries</p>
            <p>• Data includes frequency of appearance in {includeAdditional ? 'winning and additional' : 'winning'} number positions</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
