import { astro } from 'iztro'
import type { BirthInput } from '../bazi/calc'
import type { IztroAstrolabe, IztroStar } from '../iztroTypes'

export interface ZiweiResult {
  lifeHouse: string
  bodyHousePalace?: string
  // Prompt 用：各宮主星列表
  stars?: Partial<
    Record<
      | '命宮'
      | '財帛'
      | '官祿'
      | '夫妻'
      | '遷移'
      | '福德'
      | '田宅'
      | '疾厄',
      string
    >
  >
  // 以下欄位目前用於 Prompt 生成（驗證腳本只檢查 lifeHouse，但我們盡量補齊）
  lifeStar?: string
  mingZhu?: string
  shenZhu?: string
  currentDaXian?: string
  daXianYears?: string
}

function joinStarNames(stars: IztroStar[] | undefined) {
  if (!Array.isArray(stars) || stars.length === 0) return ''
  return stars
    .map(star => star.name)
    .filter((name): name is string => Boolean(name))
    .join('、')
}

export function calculateZiwei(input: BirthInput): ZiweiResult {
  const dateStr = `${input.year}-${input.month}-${input.day}`

  // hourIndex 統一採：0=子,1=丑,...,10=戌,11=亥
  const astrolabe = astro.bySolar(dateStr, input.hourIndex, input.gender, true, 'zh-TW') as unknown as IztroAstrolabe

  const lifePalace = astrolabe.palace('命宮')
  const lifeHouse = lifePalace?.earthlyBranch ?? ''
  const bodyPalace = astrolabe.palace('身宮')
  const bodyHousePalace = bodyPalace?.earthlyBranch ?? ''

  // 後續用於 Prompt 的資訊：嘗試從 palace/star 物件讀取（若 API 變動就回退空字串）
  const lifeStar = joinStarNames(lifePalace?.majorStars)

  const pickMajorStars = (palaceName: string) => {
    try {
      const palace = astrolabe.palace(palaceName)
      return joinStarNames(palace?.majorStars)
    } catch {
      return ''
    }
  }

  const stars: ZiweiResult['stars'] = {
    命宮: pickMajorStars('命宮'),
    財帛: pickMajorStars('財帛'),
    官祿: pickMajorStars('官祿'),
    夫妻: pickMajorStars('夫妻'),
    遷移: pickMajorStars('遷移'),
    福德: pickMajorStars('福德'),
    田宅: pickMajorStars('田宅'),
    疾厄: pickMajorStars('疾厄'),
  }

  // 命主/身主：iztro 物件直接暴露（不需要用 star('命主') 這類可能因版本而變動的名稱）
  const mingZhu: string = astrolabe?.soul ?? ''
  const shenZhu: string = astrolabe?.body ?? ''

  // 目前大限：找出其 decadal.range 覆蓋「目前年齡」的宮位
  // 這個專案前端/驗證主要以「實歲（西元年相減）」作為 currentAge 口徑。
  const currentYear = new Date().getFullYear()
  const currentAge = currentYear - input.year

  const horoscope = typeof astrolabe?.horoscope === 'function' ? astrolabe.horoscope() : null
  const palaceNames: string[] = horoscope?.decadal?.palaceNames ?? []
  let currentDaXian = ''
  let daXianYears = ''

  for (const palName of palaceNames) {
    const palace = astrolabe.palace(palName)
    const range = palace?.decadal?.range
    if (Array.isArray(range) && range.length === 2) {
      const [start, end] = range
      if (start <= currentAge && currentAge <= end) {
        currentDaXian = palName
        daXianYears = `${start}-${end}`
        break
      }
    }
  }

  return {
    lifeHouse,
    lifeStar,
    mingZhu,
    shenZhu,
    bodyHousePalace,
    stars,
    currentDaXian,
    daXianYears,
  }
}
