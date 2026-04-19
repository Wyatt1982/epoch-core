import { Solar } from 'lunar-typescript'

export type Gender = '男' | '女'

export interface BirthInput {
  year: number
  month: number
  day: number
  hourIndex: number // 0-11（對應時辰索引，由前端/測試提供）
  gender: Gender
}

export interface BaziResult {
  year: string
  month: string
  day: string
  time: string
  dayMaster: string
  dayMasterElement: string
  // 五行分布（包含地支藏干）
  wuXing: {
    wood: number
    fire: number
    earth: number
    metal: number
    water: number
  }

  dayun?: Array<{ ganZhi: string; startAge: number }>
  currentDaYun?: string
  daYunAge?: number
}

type WuXingBuckets = BaziResult['wuXing']

type EightCharLike = {
  getYearGan(): string
  getMonthGan(): string
  getDayGan(): string
  getTimeGan(): string
  getYearZhi(): string
  getMonthZhi(): string
  getDayZhi(): string
  getTimeZhi(): string
  getYun?(gender: number): YunLike | null
}

type YunLike = {
  getDaYun?(): DaYunLike[]
}

type DaYunLike = {
  getGanZhi?(): string
  getStartAge?(): number
  getEndAge?(): number
}

type DaYunSummary = {
  ganZhi: string
  startAge: number
  endAge: number
}

function addDaysUTC(year: number, month: number, day: number, add: number) {
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + add)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}

const DAY_MASTER_ELEMENT_MAP: Record<string, string> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
}

function emptyWuXing(): WuXingBuckets {
  return { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
}

function addWuXingFromStem(buckets: WuXingBuckets, stem: string) {
  const el = DAY_MASTER_ELEMENT_MAP[stem]
  if (!el) return
  const key: keyof WuXingBuckets =
    el === '木' ? 'wood' : el === '火' ? 'fire' : el === '土' ? 'earth' : el === '金' ? 'metal' : 'water'
  buckets[key]++
}

// 地支藏干對照（依你提供的表）
const HIDDEN_STEMS_BY_ZHI: Record<string, string[]> = {
  子: ['癸'],
  丑: ['癸', '己', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '戊', '庚'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
}

function countWuXingWithZhiHidden(baZi: EightCharLike) {
  const buckets = emptyWuXing()

  // 天干
  const stems = [baZi.getYearGan(), baZi.getMonthGan(), baZi.getDayGan(), baZi.getTimeGan()].filter(Boolean)
  for (const stem of stems) addWuXingFromStem(buckets, stem)

  // 地支藏干
  const zhis = [baZi.getYearZhi(), baZi.getMonthZhi(), baZi.getDayZhi(), baZi.getTimeZhi()].filter(Boolean)
  for (const zhi of zhis) {
    const hidden = HIDDEN_STEMS_BY_ZHI[zhi] || []
    for (const hStem of hidden) addWuXingFromStem(buckets, hStem)
  }

  return buckets
}

export function toSolarInputByHourIndex(year: number, month: number, day: number, hourIndex: number) {
  // 0=子, 1=丑, 2=寅, 3=卯, 4=辰, 5=巳,
  // 6=午, 7=未, 8=申, 9=酉, 10=戌, 11=亥
  // 代表小時：除了「子」時跨午夜以外，其餘用區間起點小時即可。
  const hourByIndex: number[] = [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21]
  const minute = 0

  if (hourIndex === 0) {
    // 對齊規格：子時（23:00–01:00）跨午夜，23:00 後應算隔天
    const next = addDaysUTC(year, month, day, 1)
    return { year: next.year, month: next.month, day: next.day, hour: 0, minute }
  }

  return { year, month, day, hour: hourByIndex[hourIndex], minute }
}

export function calculateBazi(input: BirthInput): BaziResult {
  const solarInput = toSolarInputByHourIndex(input.year, input.month, input.day, input.hourIndex)

  const solar = Solar.fromYmdHms(solarInput.year, solarInput.month, solarInput.day, solarInput.hour, solarInput.minute, 0)
  const lunar = solar.getLunar()
  const baZi = lunar.getEightChar()

  const year = baZi.getYear()
  const month = baZi.getMonth()
  const day = baZi.getDay()
  const time = baZi.getTime()

  const dayMaster = day[0]
  const dayMasterElement = DAY_MASTER_ELEMENT_MAP[dayMaster] ?? ''

  // 大運（依 lunar-typescript 的 API：EightChar.getYun(gender, sect?)）
  // 這裡 gender：男=1，女=0（依你提供的規格意圖）
  const genderFlag = input.gender === '男' ? 1 : 0
  const yun = typeof baZi.getYun === 'function' ? baZi.getYun(genderFlag) : null
  const rawDaYunList = yun?.getDaYun?.() ?? []
  const dayun: DaYunSummary[] = rawDaYunList
    .map(item => ({
      ganZhi: item.getGanZhi?.() ?? '',
      startAge: item.getStartAge?.() ?? 0,
      endAge: item.getEndAge?.() ?? 0,
    }))
    .filter(item => Boolean(item.ganZhi))

  const currentYear = new Date().getFullYear()
  const currentAge = currentYear - input.year
  const current = dayun.find(item => item.startAge <= currentAge && currentAge < item.endAge)

  return {
    year,
    month,
    day,
    time,
    dayMaster,
    dayMasterElement,
    wuXing: countWuXingWithZhiHidden(baZi),
    dayun: dayun.map(item => ({ ganZhi: item.ganZhi, startAge: item.startAge })),
    currentDaYun: current?.ganZhi ?? '',
    daYunAge: current?.startAge ?? 0,
  }
}
