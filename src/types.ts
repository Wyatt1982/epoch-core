import type { Gender } from './bazi/calc'

export type ChartLocationInput = {
  city: string
  latitude: number
  longitude: number
}

export type ChartRequestInput = {
  name: string
  gender: Gender
  year: number
  month: number
  day: number
  hour: number
  minute: number
  hourIndex: number | null
  birthTimeUnknown: boolean
  city: string
  latitude: number
  longitude: number
  timezoneOffset: number
  timezoneOffsetStandard: number
  timezoneName: string | null
  dstInEffect: boolean
  currentLocation: ChartLocationInput
  visitorId?: string
}

export type JsonObject = Record<string, unknown>

export interface ChartLocation extends ChartLocationInput {
  timezone_offset?: number | null
  timezone_offset_standard?: number | null
  timezone_offset_at_birth?: number | null
  timezone_name?: string | null
  dst_in_effect?: boolean | null
}

export interface ChartBirthProfile {
  solar: string | null
  lunar: string | null
  chinese_date: string | null
  time_zhi: string | null
  birth_time_known: boolean
}

export interface ChartProfile {
  name: string
  gender: Gender
  birth_time_known: boolean
  birth_datetime_local: string | null
  birth_datetime_utc: string | null
  birth: ChartBirthProfile
  birth_location: ChartLocation
  current_location: ChartLocationInput
  is_relocated: boolean
}

export interface UsageStats {
  enabled: boolean
  provider: string | null
  persistence: string | null
  total_charts_generated: number | null
  total_unique_visitors: number | null
  visitor_ordinal: number | null
  visitor_id_basis: string | null
  note: string | null
}

export interface RectificationInfo {
  needed: boolean
  reason: string
  strategy: string
  hourly_palaces?: unknown[]
  [key: string]: unknown
}

export interface ChartSummary {
  bazi: {
    four_pillars: string | null
    day_master: string | null
    day_master_element: string | null
    day_master_strength_hint?: string | null
    current_da_yun: string | null
  }
  ziwei: {
    life_house_zh: string | null
    body_house_zh: string | null
    soul: string | null
    body: string | null
  }
  western: {
    sun_sign_zh: string | null
    ascendant_zh: string | null
    midheaven_zh: string | null
  }
  jyotish: {
    lagna_sign_zh: string | null
    moon_nakshatra_zh: string | null
    current_maha_dasha: string | null
    current_antar_dasha?: string | null
  }
  numerology: {
    life_path_number: number | null
    life_path_is_master: boolean
    life_path_keyword: string | null
  }
}

export interface NumerologyModule {
  module: 'numerology'
  system: 'Pythagorean'
  life_path: {
    number: number
    is_master: boolean
    label: string
    keyword: string
    description: string
  }
  birthday: {
    number: number
    is_master: boolean
    label: string
    keyword: string
  }
  personal_year: {
    number: number
    year: number
    label: string
    keyword: string
  }
}

export interface WesternAngle {
  key?: string | null
  label_zh: string | null
  symbol?: string | null
  sign: string | null
  sign_zh: string | null
  sign_degree?: number | null
  degree_formatted?: string | null
  absolute_degree: number
  [key: string]: unknown
}

export interface WesternPlanet {
  symbol?: string | null
  sign: string | null
  sign_zh: string | null
  sign_degree: number | null
  degree_formatted: string | null
  absolute_degree: number
  house: number | null
  retrograde: boolean
  dignity?: string | null
  dignity_zh?: string | null
  sun_relation?: string | null
  element?: string | null
  modality?: string | null
  [key: string]: unknown
}

export interface WesternHouse {
  name_zh: string | null
  cusp_sign: string | null
  cusp_sign_zh: string | null
  cusp_degree: number | null
  absolute_degree: number
  ruler: string | null
  ruler_zh: string | null
  almuten?: string | null
  ruler_house: number | null
  ruler_fly_to: number | null
  is_intercepted: boolean
  intercepted_sign: string | null
  planets_in_house: string[]
  [key: string]: unknown
}

export interface WesternAspect {
  planet_a: string | null
  planet_a_zh?: string | null
  planet_a_absolute_degree: number | null
  planet_b: string | null
  planet_b_zh?: string | null
  planet_b_absolute_degree: number | null
  aspect: string | null
  aspect_zh: string | null
  orb: number | null
  is_applying: boolean | null
  nature: 'harmonious' | 'tense' | 'neutral' | null
  [key: string]: unknown
}

export interface WesternMeta {
  birth_datetime_local: string | null
  birth_datetime_utc: string | null
  timezone_name: string | null
  utc_offset_at_birth: string | null
  dst_in_effect?: boolean | null
  birth_location: ChartLocationInput | null
  current_location: ChartLocationInput | null
  is_relocated: boolean
  house_system_primary: string | null
  house_system_secondary: string | null
  sect: 'diurnal' | 'nocturnal' | null
  [key: string]: unknown
}

export interface WesternModule {
  module: 'western'
  meta: WesternMeta
  angles: Record<string, WesternAngle> | null
  planets: {
    placidus: Record<string, WesternPlanet>
    whole_sign: Record<string, WesternPlanet>
  }
  aspects: WesternAspect[]
  houses: {
    placidus: Record<string, WesternHouse>
    whole_sign: Record<string, WesternHouse>
  }
  relocated: {
    based_on: string | null
    note: string | null
    angles: Record<string, WesternAngle> | null
    houses: {
      placidus: Record<string, WesternHouse>
      whole_sign: Record<string, WesternHouse>
    }
  } | null
  reading_contexts?: Record<string, unknown>
  [key: string]: unknown
}

export interface BaziStem {
  text?: string | null
  element?: string | null
  ten_god?: string | null
}

export interface BaziHiddenStem {
  text?: string | null
  element?: string | null
  ten_god?: string | null
}

export interface BaziBranch {
  text?: string | null
  element?: string | null
  hidden_stems?: BaziHiddenStem[]
}

export interface BaziShenShaBucket {
  auspicious: string[]
  neutral: string[]
  inauspicious: string[]
}

export interface BaziPillar {
  pillar?: string
  text?: string | null
  heavenly_stem?: BaziStem | null
  earthly_branch?: BaziBranch | null
  na_yin?: string | null
  di_shi?: string | null
  xun?: string | null
  xun_kong?: string | null
  known?: boolean
  shen_sha: BaziShenShaBucket
}

export interface BaziDaYunPeriod {
  index: number | null
  gan_zhi: string | null
  start_year: number | null
  end_year: number | null
  start_age: number | null
  end_age: number | null
  xun?: string | null
  xun_kong?: string | null
  [key: string]: unknown
}

export interface BaziSeasonContext {
  month_branch: string | null
  season: string | null
  season_zh: string | null
  season_commander: 'wood' | 'fire' | 'earth' | 'metal' | 'water' | null
  season_commander_zh: string | null
  relation_to_day_master: string | null
  relation_to_day_master_zh: string | null
  day_master_strength_hint: string | null
  day_master_strength_hint_zh: string | null
  supporting_elements: string[]
  weakening_elements: string[]
  note: string | null
}

export interface BaziLiuNianItem {
  year: number | null
  age: number | null
  gan_zhi: string | null
  xun: string | null
  xun_kong: string | null
  interactions?: string[]
  [key: string]: unknown
}

export interface BaziModule {
  module: 'bazi'
  summary: {
    four_pillars: string | null
    day_master: string | null
    day_master_element: string | null
    day_master_strength_hint?: string | null
  }
  lunar_date: string | null
  four_pillars: {
    year: BaziPillar
    month: BaziPillar
    day: BaziPillar
    time: BaziPillar
  }
  da_yun: {
    start_offset: {
      years: number | null
      months: number | null
      days: number | null
      hours: number | null
    } | null
    start_solar_date: string | null
    direction: string | null
    periods: BaziDaYunPeriod[]
    current: BaziDaYunPeriod | null
    current_liu_nian: BaziLiuNianItem[]
  }
  five_elements: Record<string, number> | null
  five_elements_note?: string | null
  season_context?: BaziSeasonContext | null
  pattern?: string | null
  shen_sha_summary: BaziShenShaBucket & {
    source: string | null
    coverage_note?: string | null
  }
  [key: string]: unknown
}

export interface ZiweiStar {
  name: string | null
  name_zh: string | null
  [key: string]: unknown
}

export interface ZiweiPalace {
  name: string | null
  name_zh: string | null
  heavenly_stem: string | null
  earthly_branch: string | null
  major_stars: ZiweiStar[]
  minor_stars: ZiweiStar[]
  adjective_stars?: ZiweiStar[]
  changsheng12: string | null
  is_original_palace?: boolean
  is_body_palace?: boolean
  [key: string]: unknown
}

export interface ZiweiHoroscopeLayer {
  name_zh: string | null
  heavenly_stem: string | null
  earthly_branch: string | null
  mutagen_mapped?: Record<string, string | null> | null
  palace_names_zh?: string[] | null
  [key: string]: unknown
}

export interface ZiweiSihuaConnection {
  from_palace?: string | null
  from_palace_zh?: string | null
  from_palace_branch: string | null
  from_stem: string | null
  star?: string | null
  star_zh?: string | null
  sihua: string | null
  to_palace?: string | null
  to_palace_zh?: string | null
  to_palace_branch: string | null
  is_self: boolean
  sihua_label: string | null
  [key: string]: unknown
}

export interface ZiweiModule {
  module: 'ziwei'
  metadata?: Record<string, unknown>
  palaces: ZiweiPalace[]
  current_horoscope?: Record<string, ZiweiHoroscopeLayer | string | null> | null
  horoscope_layers?: Record<string, ZiweiHoroscopeLayer | string | null> | null
  sihua_connections: {
    natal: ZiweiSihuaConnection[]
    decadal: ZiweiSihuaConnection[]
    yearly: ZiweiSihuaConnection[]
    monthly: ZiweiSihuaConnection[]
  } | null
  reading_contexts?: Record<string, unknown>
  [key: string]: unknown
}

export interface JyotishLagna {
  sign: string | null
  sign_zh: string | null
  sign_sa?: string | null
  nakshatra?: string | null
  nakshatra_zh?: string | null
  nakshatra_pada?: number | null
  nakshatra_lord?: string | null
  lagna_lord?: string | null
  [key: string]: unknown
}

export interface JyotishPlanet {
  sign?: string | null
  sign_zh?: string | null
  house?: number | null
  nakshatra?: string | null
  nakshatra_zh?: string | null
  nakshatra_pada?: number | null
  retrograde?: boolean
  is_combust?: boolean
  is_vargottama?: boolean
  note?: string | null
  [key: string]: unknown
}

export interface JyotishDashaItem {
  planet: string | null
  start_date?: string | null
  end_date?: string | null
  remaining_years?: number | null
  duration_years?: number | null
  [key: string]: unknown
}

export interface JyotishYoga {
  name: string | null
  name_zh?: string | null
  type?: string | null
  effect?: string | null
  strength?: string | null
  [key: string]: unknown
}

export interface JyotishModule {
  module: 'jyotish'
  meta: {
    ayanamsa_system: string | null
    ayanamsa_value: number | null
    house_system: string | null
    [key: string]: unknown
  } | null
  lagna: JyotishLagna | null
  planets: Record<string, JyotishPlanet> | null
  nakshatras?: {
    moon_nakshatra?: {
      name?: string | null
      name_zh?: string | null
      lord?: string | null
      note?: string | null
    } | null
    lagna_nakshatra?: {
      name?: string | null
      name_zh?: string | null
      lord?: string | null
      note?: string | null
    } | null
    [key: string]: unknown
  } | null
  dashas: {
    system?: string | null
    birth_balance?: JyotishDashaItem | null
    current_maha_dasha?: JyotishDashaItem | null
    current_antar_dasha?: JyotishDashaItem | null
    maha_dasha_sequence: JyotishDashaItem[]
    [key: string]: unknown
  } | null
  yogas: {
    present: JyotishYoga[]
    checked?: string[]
    absent: string[]
    [key: string]: unknown
  } | null
  reading_contexts?: Record<string, unknown>
  [key: string]: unknown
}

export interface ChartPayload {
  schema_version: '2.0.0'
  generated_at: string
  profile: ChartProfile
  summary: ChartSummary
  bazi: BaziModule
  ziwei: ZiweiModule
  western: WesternModule
  jyotish: JyotishModule
  numerology: NumerologyModule
  rectification: RectificationInfo
  usage_stats: UsageStats
  provenance: JsonObject
  reading_contexts?: Record<string, unknown>
  [key: string]: unknown
}

export type ChartResponse = {
  chart: ChartPayload
  prompt: string
}
