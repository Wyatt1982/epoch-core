// 生命靈數模組：組合計算結果與描述
import {
  calculateLifePath,
  calculateBirthdayNumber,
  calculatePersonalYear,
} from './calc'
import {
  LIFE_PATH_DESCRIPTIONS,
  BIRTHDAY_KEYWORDS,
  PERSONAL_YEAR_KEYWORDS,
} from './descriptions'
import type { NumerologyModule, ChartRequestInput } from '../types'

export function buildNumerologyModule(input: ChartRequestInput): NumerologyModule {
  const { year, month, day } = input
  const currentYear = new Date().getFullYear()

  const lifePathResult = calculateLifePath(year, month, day)
  const birthdayResult = calculateBirthdayNumber(day)
  const personalYearResult = calculatePersonalYear(month, day, currentYear)

  const lifePathDesc = LIFE_PATH_DESCRIPTIONS[lifePathResult.number] ?? {
    keyword: `靈數 ${lifePathResult.number}`,
    description: '',
  }
  const birthdayKeyword =
    BIRTHDAY_KEYWORDS[birthdayResult.number] ?? `生日數 ${birthdayResult.number}`
  const personalYearKeyword =
    PERSONAL_YEAR_KEYWORDS[personalYearResult.number] ?? `個人年 ${personalYearResult.number}`

  return {
    module: 'numerology',
    system: 'Pythagorean',
    life_path: {
      number: lifePathResult.number,
      is_master: lifePathResult.isMaster,
      label: `生命靈數 ${lifePathResult.number}`,
      keyword: lifePathDesc.keyword,
      description: lifePathDesc.description,
    },
    birthday: {
      number: birthdayResult.number,
      is_master: birthdayResult.isMaster,
      label: `生日數 ${birthdayResult.number}`,
      keyword: birthdayKeyword,
    },
    personal_year: {
      number: personalYearResult.number,
      year: personalYearResult.year,
      label: `${personalYearResult.year} 個人年 ${personalYearResult.number}`,
      keyword: personalYearKeyword,
    },
  }
}
