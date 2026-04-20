// epoch-core public API
export { buildChartResponse } from './buildChartResponse'
export { generatePrompt } from './prompt'
export { calculateRectification } from './rectification'
export { calculateBazi } from './bazi/calc'
export { buildBaziModule } from './bazi/module'
export { calculateZiwei } from './ziwei/calc'
export { buildZiweiModule } from './ziwei/module'
export { buildWesternModule } from './western/module'
export { getSunSign } from './western/sunSign'
export { buildJyotishPayload } from './jyotish'
export { buildNumerologyModule } from './numerology/module'
export { calculateLifePath, calculateBirthdayNumber, calculatePersonalYear } from './numerology/calc'
export { getHourIndexFromClock, getTimeZhiLabel, TIME_ZHI_OPTIONS } from './timeZhi'

export type {
  ChartRequestInput,
  ChartResponse,
  ChartPayload,
  BaziModule,
  ZiweiModule,
  WesternModule,
  JyotishModule,
  NumerologyModule,
  WesternAspect,
  WesternHouse,
  ZiweiSihuaConnection,
} from './types'

export type { RectificationData } from './rectification'
export type { Gender, BaziResult } from './bazi/calc'
