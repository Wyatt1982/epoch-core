// 命盤計算的共用工具：數學、日期、時區、星座查詢、swisseph 初始化。
import type { ChartRequestInput } from './types'
import {
  DIGNITY_LABELS_ZH,
  DIGNITY_TABLE,
  TIMEZONE_BY_CITY,
  WESTERN_SIGNS,
} from './constants'

// swisseph-wasm 沒有完整型別，退回 any 但集中在此檔案裡。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SwissEph = any

let swissEphPromise: Promise<SwissEph> | null = null

export function round(value: number, precision = 4) {
  return Number(value.toFixed(precision))
}

export function pad2(value: number) {
  return String(Math.trunc(value)).padStart(2, '0')
}

export function normalizeDegree(value: number) {
  const normalized = value % 360
  return normalized < 0 ? normalized + 360 : normalized
}

export function angularDistance(a: number, b: number) {
  const diff = Math.abs(normalizeDegree(a) - normalizeDegree(b))
  return diff > 180 ? 360 - diff : diff
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function formatUtcOffset(offset: number) {
  const sign = offset >= 0 ? '+' : '-'
  const absolute = Math.abs(offset)
  const hours = Math.floor(absolute)
  const minutes = Math.round((absolute - hours) * 60)
  return `${sign}${pad2(hours)}:${pad2(minutes)}`
}

export function formatClock(hour: number, minute: number) {
  return `${pad2(hour)}:${pad2(minute)}`
}

export function formatBirthDatetimeLocal(input: ChartRequestInput) {
  return `${input.year}-${pad2(input.month)}-${pad2(input.day)}T${formatClock(input.hour, input.minute)}:00`
}

export function toBirthUtcDate(input: ChartRequestInput) {
  const localTimestamp = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0)
  const offsetMinutes = Math.round(input.timezoneOffset * 60)
  return new Date(localTimestamp - offsetMinutes * 60 * 1000)
}

export function getSignInfo(absoluteDegree: number) {
  const normalized = normalizeDegree(absoluteDegree)
  const signIndex = Math.floor(normalized / 30)
  const sign = WESTERN_SIGNS[signIndex]
  const degreeInSign = normalized - signIndex * 30
  const degree = Math.floor(degreeInSign)
  const minutes = Math.round((degreeInSign - degree) * 60)

  return {
    sign: sign.key,
    sign_zh: sign.key_zh,
    sign_degree: round(degreeInSign, 2),
    degree_formatted: `${degree}°${pad2(minutes)}'`,
    absolute_degree: round(normalized, 2),
    element: sign.element,
    modality: sign.modality,
    sign_index: signIndex,
  }
}

export function computeSunRelation(planetDegree: number, sunDegree: number) {
  let diff = Math.abs(planetDegree - sunDegree)
  if (diff > 180) diff = 360 - diff
  if (diff <= 0.283) return 'cazimi'
  if (diff <= 8.5) return 'combust'
  if (diff <= 17) return 'under_sunbeams'
  return 'none'
}

export function toHouseIndex(housePosition: number) {
  const value = Math.floor(housePosition)
  if (value < 1) return 12
  if (value > 12) return ((value - 1) % 12) + 1
  return value
}

export function getDignity(planetKey: string, signKey: string) {
  const dignity = DIGNITY_TABLE[planetKey]?.[signKey] ?? 'peregrine'
  return {
    dignity,
    dignity_zh: DIGNITY_LABELS_ZH[dignity] ?? '客',
  }
}

export function inferTimezoneName(city: string, timezoneOffset: number) {
  if (TIMEZONE_BY_CITY[city]) {
    return TIMEZONE_BY_CITY[city]
  }

  const fallbackByOffset: Record<string, string> = {
    '8': 'Asia/Taipei',
    '9': 'Asia/Tokyo',
    '7': 'Asia/Bangkok',
    '5.5': 'Asia/Kolkata',
    '4': 'Asia/Dubai',
    '1': 'Europe/Paris',
    '0': 'Europe/London',
    '-5': 'America/New_York',
    '-6': 'America/Chicago',
    '-8': 'America/Los_Angeles',
    '-10': 'Pacific/Honolulu',
    '10': 'Australia/Sydney',
    '9.5': 'Australia/Adelaide',
    '12': 'Pacific/Auckland',
  }

  return fallbackByOffset[String(timezoneOffset)] ?? `UTC${formatUtcOffset(timezoneOffset)}`
}

export function resolveTimezoneName(input: Pick<ChartRequestInput, 'city' | 'timezoneName' | 'timezoneOffset'>) {
  const explicit = input.timezoneName?.trim()
  if (explicit) {
    return explicit
  }

  return inferTimezoneName(input.city, input.timezoneOffset)
}

export function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}

export async function getSwissEph(): Promise<SwissEph> {
  if (!swissEphPromise) {
    swissEphPromise = (async () => {
      const module = await import('swisseph-wasm')
      const SwissEphCtor = module.default
      const swe = new SwissEphCtor()
      await swe.initSwissEph()
      return swe
    })().catch(err => {
      // 初始化失敗時重置，允許下次請求重試，避免永久 hang
      swissEphPromise = null
      throw err
    })
  }

  return swissEphPromise
}
