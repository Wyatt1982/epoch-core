export type IztroStar = {
  name?: string
  type?: string
  scope?: string
  brightness?: string | null
  mutagen?: string | null
}

export type IztroPalace = {
  index: number
  name: string
  heavenlyStem: string
  earthlyBranch: string
  isBodyPalace: boolean
  isOriginalPalace: boolean
  majorStars: IztroStar[]
  minorStars: IztroStar[]
  adjectiveStars: IztroStar[]
  changsheng12?: string
  boshi12?: string
  jiangqian12?: string
  suiqian12?: string
  decadal?: {
    range?: [number, number]
  }
  ages?: number[]
}

export type IztroSurroundedPalaces = {
  target: { name: string }
  opposite: { name: string }
  wealth: { name: string }
  career: { name: string }
}

export type IztroHoroscopeItem = {
  index?: number
  name?: string
  heavenlyStem?: string
  earthlyBranch?: string
  palaceNames?: string[]
  mutagen?: string[]
  nominalAge?: number | null
  yearlyDecStar?:
    | {
        jiangqian12: string[]
        suiqian12: string[]
      }
    | null
  stars?: IztroStar[][]
}

export type IztroHoroscope = {
  solarDate: string
  lunarDate: string
  decadal: IztroHoroscopeItem
  age: IztroHoroscopeItem
  yearly: IztroHoroscopeItem
  monthly: IztroHoroscopeItem
  daily: IztroHoroscopeItem
  hourly: IztroHoroscopeItem
}

export type IztroAstrolabe = {
  palace(name: string): IztroPalace | undefined
  palaces: IztroPalace[]
  horoscope(): IztroHoroscope
  surroundedPalaces?(name: string): IztroSurroundedPalaces | null
  solarDate: string
  lunarDate: string
  chineseDate: string
  sign: string
  zodiac: string
  time: string
  timeRange: string
  soul: string
  body: string
  fiveElementsClass: string
  earthlyBranchOfSoulPalace: string
  earthlyBranchOfBodyPalace: string
  copyright: string
}
