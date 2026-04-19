import { astro } from 'iztro'
import { calculateBazi, type Gender } from './bazi/calc'
import type { IztroAstrolabe, IztroStar } from './iztroTypes'
import { TIME_ZHI_OPTIONS } from './timeZhi'

export interface RectificationHourDifference {
  hour_index: number
  hour_name: string
  life_house_branch: string
  life_house_stars: string
  ascendant: string
}

export interface RectificationData {
  hourly_palaces: RectificationHourDifference[]
  bazi_without_time: {
    year: string
    month: string
    day: string
    day_master: string
    day_master_element: string
  }
}

const HOUR_ASCENDANT_HINTS = [
  '天蠍座或射手座上升',
  '射手座或摩羯座上升',
  '摩羯座或水瓶座上升',
  '水瓶座或雙魚座上升',
  '雙魚座或牡羊座上升',
  '牡羊座或金牛座上升',
  '金牛座或雙子座上升',
  '雙子座或巨蟹座上升',
  '巨蟹座或獅子座上升',
  '獅子座或處女座上升',
  '處女座或天秤座上升',
  '天秤座或天蠍座上升',
] as const

function joinStarNames(stars: IztroStar[] | undefined) {
  if (!Array.isArray(stars) || stars.length === 0) return '空宮'
  return stars
    .map(star => star.name)
    .filter((name): name is string => Boolean(name))
    .join('、')
}

export function calculateRectification(input: {
  year: number
  month: number
  day: number
  gender: Gender
}): RectificationData {
  const hourlyPalaces = TIME_ZHI_OPTIONS.map((option, hourIndex) => {
    const astrolabe = astro.bySolar(`${input.year}-${input.month}-${input.day}`, hourIndex, input.gender, true, 'zh-TW') as unknown as IztroAstrolabe
    const lifePalace = astrolabe.palace('命宮')
    const lifeHouseStars = joinStarNames(lifePalace?.majorStars)

    return {
      hour_index: hourIndex,
      hour_name: option.label,
      life_house_branch: lifePalace?.earthlyBranch ?? '',
      life_house_stars: lifeHouseStars,
      ascendant: HOUR_ASCENDANT_HINTS[hourIndex],
    }
  })

  // hourIndex 在此處僅影響時柱（第四柱），但 baziWithoutTime 只取前三柱
  // （year/month/day/dayMaster/dayMasterElement），所以任何 hourIndex 都不影響結果。
  // 使用 0（子時）而非先前的 6（午時），避免未來維護者誤以為午時有特殊意義。
  const bazi = calculateBazi({
    year: input.year,
    month: input.month,
    day: input.day,
    hourIndex: 0,
    gender: input.gender,
  })

  return {
    hourly_palaces: hourlyPalaces,
    bazi_without_time: {
      year: bazi.year,
      month: bazi.month,
      day: bazi.day,
      day_master: bazi.dayMaster,
      day_master_element: bazi.dayMasterElement,
    },
  }
}
