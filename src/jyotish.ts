type SweLike = {
  SE_SUN: number
  SE_MOON: number
  SE_MERCURY: number
  SE_VENUS: number
  SE_MARS: number
  SE_JUPITER: number
  SE_SATURN: number
  SE_TRUE_NODE: number
  SEFLG_SWIEPH: number
  SEFLG_SPEED: number
  SEFLG_SIDEREAL: number
  SE_SIDM_LAHIRI: number
  set_sid_mode: (sidMode: number, t0: number, ayanT0: number) => void
  calc_ut: (julianDay: number, planet: number, flags: number) => Float64Array
  houses: (julianDay: number, latitude: number, longitude: number, hsys: string) => {
    cusps: Float64Array
    ascmc: Float64Array
  }
  get_ayanamsa_ut: (julianDay: number) => number
}

type BuildJyotishInput = {
  swe: SweLike | null
  julianDayUT: number | null
  birthDateUtc: Date | null
  latitude: number
  longitude: number
  birthTimeKnown: boolean
}

type PlanetRecord = {
  key: string
  sign: string
  sign_zh: string
  sign_sa: string
  absolute_degree: number
  house: number
  retrograde: boolean
  nakshatra: string
  nakshatra_zh: string
  nakshatra_pada: number
  nakshatra_lord: string
  degree_in_nakshatra: number
  is_combust: boolean
  is_vargottama: boolean
  note: string | null
}

const ZODIAC_SPAN = 30
const NAKSHATRA_SPAN = 360 / 27
const PADA_SPAN = 360 / 108
const DASHA_ORDER = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'] as const
const DASHA_YEARS: Record<(typeof DASHA_ORDER)[number], number> = {
  ketu: 7,
  venus: 20,
  sun: 6,
  moon: 10,
  mars: 7,
  rahu: 18,
  jupiter: 16,
  saturn: 19,
  mercury: 17,
}

const SIGNS = [
  { key: 'aries', key_zh: '牡羊座', key_sa: 'Mesha', lord: 'mars', modality: 'cardinal' },
  { key: 'taurus', key_zh: '金牛座', key_sa: 'Vrishabha', lord: 'venus', modality: 'fixed' },
  { key: 'gemini', key_zh: '雙子座', key_sa: 'Mithuna', lord: 'mercury', modality: 'mutable' },
  { key: 'cancer', key_zh: '巨蟹座', key_sa: 'Karka', lord: 'moon', modality: 'cardinal' },
  { key: 'leo', key_zh: '獅子座', key_sa: 'Simha', lord: 'sun', modality: 'fixed' },
  { key: 'virgo', key_zh: '處女座', key_sa: 'Kanya', lord: 'mercury', modality: 'mutable' },
  { key: 'libra', key_zh: '天秤座', key_sa: 'Tula', lord: 'venus', modality: 'cardinal' },
  { key: 'scorpio', key_zh: '天蠍座', key_sa: 'Vrischika', lord: 'mars', modality: 'fixed' },
  { key: 'sagittarius', key_zh: '射手座', key_sa: 'Dhanu', lord: 'jupiter', modality: 'mutable' },
  { key: 'capricorn', key_zh: '摩羯座', key_sa: 'Makara', lord: 'saturn', modality: 'cardinal' },
  { key: 'aquarius', key_zh: '水瓶座', key_sa: 'Kumbha', lord: 'saturn', modality: 'fixed' },
  { key: 'pisces', key_zh: '雙魚座', key_sa: 'Meena', lord: 'jupiter', modality: 'mutable' },
] as const

const NAKSHATRAS = [
  { name: 'Ashwini', name_zh: '婁宿', lord: 'ketu' },
  { name: 'Bharani', name_zh: '胃宿', lord: 'venus' },
  { name: 'Krittika', name_zh: '昴宿', lord: 'sun' },
  { name: 'Rohini', name_zh: '畢宿', lord: 'moon' },
  { name: 'Mrigashira', name_zh: '觜宿', lord: 'mars' },
  { name: 'Ardra', name_zh: '參宿', lord: 'rahu' },
  { name: 'Punarvasu', name_zh: '井宿', lord: 'jupiter' },
  { name: 'Pushya', name_zh: '鬼宿', lord: 'saturn' },
  { name: 'Ashlesha', name_zh: '柳宿', lord: 'mercury' },
  { name: 'Magha', name_zh: '星宿', lord: 'ketu' },
  { name: 'Purva Phalguni', name_zh: '張宿', lord: 'venus' },
  { name: 'Uttara Phalguni', name_zh: '翼宿', lord: 'sun' },
  { name: 'Hasta', name_zh: '手宿', lord: 'moon' },
  { name: 'Chitra', name_zh: '角宿', lord: 'mars' },
  { name: 'Swati', name_zh: '亢宿', lord: 'rahu' },
  { name: 'Vishakha', name_zh: '氐宿', lord: 'jupiter' },
  { name: 'Anuradha', name_zh: '房宿', lord: 'saturn' },
  { name: 'Jyeshtha', name_zh: '心宿', lord: 'mercury' },
  { name: 'Mula', name_zh: '尾宿', lord: 'ketu' },
  { name: 'Purva Ashadha', name_zh: '箕宿', lord: 'venus' },
  { name: 'Uttara Ashadha', name_zh: '斗宿', lord: 'sun' },
  { name: 'Shravana', name_zh: '牛宿', lord: 'moon' },
  { name: 'Dhanishtha', name_zh: '女宿', lord: 'mars' },
  { name: 'Shatabhisha', name_zh: '百醫宿', lord: 'rahu' },
  { name: 'Purva Bhadrapada', name_zh: '南鳳宿', lord: 'jupiter' },
  { name: 'Uttara Bhadrapada', name_zh: '北鳳宿', lord: 'saturn' },
  { name: 'Revati', name_zh: '奎宿', lord: 'mercury' },
] as const

const PLANETS = [
  { key: 'sun', sweKey: 'SE_SUN' },
  { key: 'moon', sweKey: 'SE_MOON' },
  { key: 'mercury', sweKey: 'SE_MERCURY' },
  { key: 'venus', sweKey: 'SE_VENUS' },
  { key: 'mars', sweKey: 'SE_MARS' },
  { key: 'jupiter', sweKey: 'SE_JUPITER' },
  { key: 'saturn', sweKey: 'SE_SATURN' },
] as const

function round(value: number, precision = 4) {
  return Number(value.toFixed(precision))
}

function normalizeDegree(value: number) {
  const normalized = value % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function getSignFromDegree(absoluteDegree: number) {
  return SIGNS[Math.floor(normalizeDegree(absoluteDegree) / ZODIAC_SPAN)]
}

function getSignIndex(absoluteDegree: number) {
  return Math.floor(normalizeDegree(absoluteDegree) / ZODIAC_SPAN)
}

export function computeNakshatra(absoluteDegree: number) {
  const normalized = normalizeDegree(absoluteDegree)
  const index = Math.floor(normalized / NAKSHATRA_SPAN)
  const nak = NAKSHATRAS[index]
  const degreeInNakshatra = normalized % NAKSHATRA_SPAN
  const pada = Math.floor(degreeInNakshatra / PADA_SPAN) + 1

  return {
    ...nak,
    pada,
    degree_in_nakshatra: round(degreeInNakshatra),
  }
}

function addFractionalYears(date: Date, years: number) {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + Math.round(years * 365.2425))
  return next
}

function formatDate(date: Date | null) {
  if (!date) return null
  return date.toISOString().slice(0, 10)
}

function computeWholeSignHouse(absoluteDegree: number, lagnaSignIndex: number) {
  return ((getSignIndex(absoluteDegree) - lagnaSignIndex + 12) % 12) + 1
}

function angularDistance(a: number, b: number) {
  const diff = Math.abs(normalizeDegree(a) - normalizeDegree(b))
  return diff > 180 ? 360 - diff : diff
}

function isCombust(planetKey: string, absoluteDegree: number, sunDegree: number) {
  if (planetKey === 'sun' || planetKey === 'rahu' || planetKey === 'ketu') return false
  return angularDistance(absoluteDegree, sunDegree) <= 8.5
}

function navamsaSignIndex(absoluteDegree: number) {
  const signIndex = getSignIndex(absoluteDegree)
  const sign = SIGNS[signIndex]
  const degreeInSign = normalizeDegree(absoluteDegree) % ZODIAC_SPAN
  const padaIndex = Math.floor(degreeInSign / (ZODIAC_SPAN / 9))

  let startIndex = signIndex
  if (sign.modality === 'fixed') {
    startIndex = (signIndex + 8) % 12
  } else if (sign.modality === 'mutable') {
    startIndex = (signIndex + 4) % 12
  }

  return (startIndex + padaIndex) % 12
}

function isVargottama(absoluteDegree: number) {
  return getSignIndex(absoluteDegree) === navamsaSignIndex(absoluteDegree)
}

function nextDashaLord(current: (typeof DASHA_ORDER)[number]) {
  const currentIndex = DASHA_ORDER.indexOf(current)
  return DASHA_ORDER[(currentIndex + 1) % DASHA_ORDER.length]
}

function buildVimshottariDashas(moonNakshatra: ReturnType<typeof computeNakshatra>, birthDateUtc: Date) {
  const birthLord = moonNakshatra.lord as (typeof DASHA_ORDER)[number]
  const remainingPortion = 1 - moonNakshatra.degree_in_nakshatra / NAKSHATRA_SPAN
  const remainingYears = DASHA_YEARS[birthLord] * remainingPortion
  const mahaDashaSequence: Array<{
    planet: string
    start_date: string | null
    end_date: string | null
    duration_years: number
  }> = []

  let cursor = new Date(birthDateUtc.getTime())
  let currentLord = birthLord
  let currentDuration = remainingYears

  for (let index = 0; index < 9; index += 1) {
    const startDate = new Date(cursor.getTime())
    const endDate = addFractionalYears(startDate, currentDuration)
    mahaDashaSequence.push({
      planet: currentLord,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      duration_years: round(currentDuration, 2),
    })
    cursor = endDate
    currentLord = nextDashaLord(currentLord)
    currentDuration = DASHA_YEARS[currentLord]
  }

  const now = new Date()
  const currentMaha =
    mahaDashaSequence.find(item => {
      if (!item.start_date || !item.end_date) return false
      return new Date(item.start_date) <= now && now <= new Date(item.end_date)
    }) ?? mahaDashaSequence[0]

  const mahaLord = currentMaha.planet as (typeof DASHA_ORDER)[number]
  const mahaStart = currentMaha.start_date ? new Date(currentMaha.start_date) : birthDateUtc
  const mahaDurationYears = currentMaha.duration_years
  const mahaDurationDays = mahaDurationYears * 365.2425
  const mahaStartIndex = DASHA_ORDER.indexOf(mahaLord)

  const antarSequence = DASHA_ORDER.map((_, index) => DASHA_ORDER[(mahaStartIndex + index) % DASHA_ORDER.length]).map(lord => {
    const antarYears = (mahaDurationYears * DASHA_YEARS[lord]) / 120
    return { lord, antarYears }
  })

  let antarCursor = new Date(mahaStart.getTime())
  let currentAntar:
    | {
        planet: string
        start_date: string | null
        end_date: string | null
      }
    | null = null

  for (const antar of antarSequence) {
    const startDate = new Date(antarCursor.getTime())
    const endDate = addFractionalYears(startDate, antar.antarYears)
    if (startDate <= now && now <= endDate) {
      currentAntar = {
        planet: antar.lord,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      }
      break
    }
    antarCursor = endDate
  }

  return {
    birth_balance: {
      planet: birthLord,
      remaining_years: round(remainingYears, 2),
    },
    current_maha_dasha: {
      planet: currentMaha.planet,
      start_date: currentMaha.start_date,
      end_date: currentMaha.end_date,
    },
    current_antar_dasha: currentAntar ?? {
      planet: antarSequence[0]?.lord ?? null,
      start_date: formatDate(mahaStart),
      end_date: formatDate(addFractionalYears(mahaStart, antarSequence[0]?.antarYears ?? mahaDurationDays / 365.2425)),
    },
    maha_dasha_sequence: mahaDashaSequence,
  }
}

function detectYogas(planets: Record<string, PlanetRecord>) {
  const moon = planets.moon
  const jupiter = planets.jupiter
  const sun = planets.sun
  const mercury = planets.mercury
  const mars = planets.mars

  const yogas = [
    {
      name: 'Gajakesari Yoga',
      name_zh: '象獅瑜伽',
      type: 'auspicious',
      effect: '智慧、聲譽、社會地位提升',
      check: angularDistance(jupiter.absolute_degree, moon.absolute_degree) <= 6 ||
        Math.abs(jupiter.house - moon.house) % 3 === 0,
      strength: angularDistance(jupiter.absolute_degree, moon.absolute_degree) <= 3 ? 'strong' : 'moderate',
    },
    {
      name: 'Budhaditya Yoga',
      name_zh: '日水瑜伽',
      type: 'auspicious',
      effect: '智識敏銳、溝通能力強',
      check: sun.house === mercury.house,
      strength: sun.house === mercury.house ? 'strong' : 'moderate',
    },
    {
      name: 'Chandra-Mangala Yoga',
      name_zh: '月火瑜伽',
      type: 'mixed',
      effect: '強烈行動力與情緒，財務起伏大',
      check: moon.house === mars.house,
      strength: moon.house === mars.house ? 'moderate' : 'light',
    },
    {
      name: 'Kemadruma Yoga',
      name_zh: '孤月瑜伽',
      type: 'inauspicious',
      effect: '情緒孤立，需刻意建立人際連結',
      check: (() => {
        const adjacent = [((moon.house - 2 + 12) % 12) + 1, (moon.house % 12) + 1]
        return !Object.values(planets).some(planet => planet.key !== 'moon' && adjacent.includes(planet.house))
      })(),
      strength: 'sensitive',
    },
  ]

  const present = yogas.filter(yoga => yoga.check).map(yoga => ({
    name: yoga.name,
    name_zh: yoga.name_zh,
    type: yoga.type,
    effect: yoga.effect,
    strength: yoga.strength,
  }))

  return {
    present,
    checked: yogas.map(yoga => yoga.name),
    absent: yogas.filter(yoga => !yoga.check).map(yoga => yoga.name),
  }
}

export function buildJyotishPayload(input: BuildJyotishInput) {
  if (!input.birthTimeKnown || !input.julianDayUT || !input.birthDateUtc || !input.swe) {
    return {
      schema_version: '2.0.0',
      module: 'jyotish',
      meta: {
        ayanamsa_system: 'Lahiri',
        ayanamsa_value: null,
        house_system: 'Whole Sign',
      },
      lagna: null,
      planets: null,
      nakshatras: {
        moon_nakshatra: null,
        lagna_nakshatra: null,
      },
      dashas: {
        system: 'Vimshottari',
        birth_balance: null,
        current_maha_dasha: null,
        current_antar_dasha: null,
        maha_dasha_sequence: [],
      },
      yogas: {
        present: [],
        checked: ['Gajakesari Yoga', 'Budhaditya Yoga', 'Chandra-Mangala Yoga', 'Kemadruma Yoga'],
        absent: ['Gajakesari Yoga', 'Budhaditya Yoga', 'Chandra-Mangala Yoga', 'Kemadruma Yoga'],
      },
      reading_contexts: {
        personality: null,
        career: null,
        dasha_forecast: null,
      },
      suggested_prompt:
        '你是一位精通 Jyotish 吠陀占星的顧問，採用 Lahiri Ayanamsa。\n- 星座位置與西洋占星不同，勿混淆\n- Nakshatra 比星座更精細，優先參考\n- Dasha 是判斷「何時」發生的核心\n- yogas.present 是重點解盤特徵\n- Rahu/Ketu 永遠逆行，代表業力節點，非實體行星\n- is_vargottama true 的行星力量特別強\n- null 未啟用，勿腦補\n輸出：1.命主特質 2.核心Yoga 3.當前大運主題 4.建議方向',
      note: '出生時間未知時不輸出 Lagna 與宮位。',
    }
  }

  const swe = input.swe

  swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0)

  const siderealFlags = swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL
  const ayanamsaValue = round(swe.get_ayanamsa_ut(input.julianDayUT), 2)
  const tropicalHouses = swe.houses(input.julianDayUT, input.latitude, input.longitude, 'P')
  const lagnaAbsolute = normalizeDegree(tropicalHouses.ascmc[0] - ayanamsaValue)
  const lagnaSign = getSignFromDegree(lagnaAbsolute)
  const lagnaSignIndex = getSignIndex(lagnaAbsolute)
  const lagnaNakshatra = computeNakshatra(lagnaAbsolute)

  const planets = PLANETS.reduce<Record<string, PlanetRecord>>((accumulator, planet) => {
    const result = swe.calc_ut(input.julianDayUT!, swe[planet.sweKey], siderealFlags)
    const absoluteDegree = normalizeDegree(result[0])
    const sign = getSignFromDegree(absoluteDegree)
    const nakshatra = computeNakshatra(absoluteDegree)
    accumulator[planet.key] = {
      key: planet.key,
      sign: sign.key,
      sign_zh: sign.key_zh,
      sign_sa: sign.key_sa,
      absolute_degree: round(absoluteDegree),
      house: computeWholeSignHouse(absoluteDegree, lagnaSignIndex),
      retrograde: result[3] < 0,
      nakshatra: nakshatra.name,
      nakshatra_zh: nakshatra.name_zh,
      nakshatra_pada: nakshatra.pada,
      nakshatra_lord: nakshatra.lord,
      degree_in_nakshatra: nakshatra.degree_in_nakshatra,
      is_combust: false,
      is_vargottama: isVargottama(absoluteDegree),
      note: null,
    }
    return accumulator
  }, {})

  const rahuResult = swe.calc_ut(input.julianDayUT, swe.SE_TRUE_NODE, siderealFlags)
  const rahuDegree = normalizeDegree(rahuResult[0])
  const rahuSign = getSignFromDegree(rahuDegree)
  const rahuNakshatra = computeNakshatra(rahuDegree)
  planets.rahu = {
    key: 'rahu',
    sign: rahuSign.key,
    sign_zh: rahuSign.key_zh,
    sign_sa: rahuSign.key_sa,
    absolute_degree: round(rahuDegree),
    house: computeWholeSignHouse(rahuDegree, lagnaSignIndex),
    retrograde: true,
    nakshatra: rahuNakshatra.name,
    nakshatra_zh: rahuNakshatra.name_zh,
    nakshatra_pada: rahuNakshatra.pada,
    nakshatra_lord: rahuNakshatra.lord,
    degree_in_nakshatra: rahuNakshatra.degree_in_nakshatra,
    is_combust: false,
    is_vargottama: isVargottama(rahuDegree),
    note: '羅睺永遠逆行',
  }

  const ketuDegree = normalizeDegree(rahuDegree + 180)
  const ketuSign = getSignFromDegree(ketuDegree)
  const ketuNakshatra = computeNakshatra(ketuDegree)
  planets.ketu = {
    key: 'ketu',
    sign: ketuSign.key,
    sign_zh: ketuSign.key_zh,
    sign_sa: ketuSign.key_sa,
    absolute_degree: round(ketuDegree),
    house: computeWholeSignHouse(ketuDegree, lagnaSignIndex),
    retrograde: true,
    nakshatra: ketuNakshatra.name,
    nakshatra_zh: ketuNakshatra.name_zh,
    nakshatra_pada: ketuNakshatra.pada,
    nakshatra_lord: ketuNakshatra.lord,
    degree_in_nakshatra: ketuNakshatra.degree_in_nakshatra,
    is_combust: false,
    is_vargottama: isVargottama(ketuDegree),
    note: '凱圖為羅睺對沖點',
  }

  Object.values(planets).forEach(planet => {
    planet.is_combust = isCombust(planet.key, planet.absolute_degree, planets.sun.absolute_degree)
  })

  const moonNakshatra = computeNakshatra(planets.moon.absolute_degree)
  const dashas = buildVimshottariDashas(moonNakshatra, input.birthDateUtc)
  const yogas = detectYogas(planets)

  return {
    schema_version: '2.0.0',
    module: 'jyotish',
    meta: {
      ayanamsa_system: 'Lahiri',
      ayanamsa_value: ayanamsaValue,
      house_system: 'Whole Sign',
    },
    lagna: {
      sign: lagnaSign.key,
      sign_zh: lagnaSign.key_zh,
      sign_sa: lagnaSign.key_sa,
      nakshatra: lagnaNakshatra.name,
      nakshatra_zh: lagnaNakshatra.name_zh,
      nakshatra_pada: lagnaNakshatra.pada,
      nakshatra_lord: lagnaNakshatra.lord,
      lagna_lord: lagnaSign.lord,
    },
    planets,
    nakshatras: {
      moon_nakshatra: {
        name: moonNakshatra.name,
        name_zh: moonNakshatra.name_zh,
        lord: moonNakshatra.lord,
        note: 'Dasha 起算關鍵',
      },
      lagna_nakshatra: {
        name: lagnaNakshatra.name,
        name_zh: lagnaNakshatra.name_zh,
        lord: lagnaNakshatra.lord,
      },
    },
    dashas: {
      system: 'Vimshottari',
      ...dashas,
    },
    yogas,
    reading_contexts: {
      personality: {
        lagna: {
          sign: lagnaSign.key,
          sign_zh: lagnaSign.key_zh,
          lord: lagnaSign.lord,
        },
        moon: planets.moon,
        yogas: yogas.present,
      },
      career: {
        house_10: ((10 - 1 + lagnaSignIndex) % 12) + 1,
        saturn: planets.saturn,
        current_maha_dasha: dashas.current_maha_dasha,
        current_antar_dasha: dashas.current_antar_dasha,
      },
      dasha_forecast: {
        current_maha_dasha: dashas.current_maha_dasha,
        current_antar_dasha: dashas.current_antar_dasha,
        maha_dasha_sequence: dashas.maha_dasha_sequence,
      },
    },
    suggested_prompt:
      '你是一位精通 Jyotish 吠陀占星的顧問，採用 Lahiri Ayanamsa。\n- 星座位置與西洋占星不同，勿混淆\n- Nakshatra 比星座更精細，優先參考\n- Dasha 是判斷「何時」發生的核心\n- yogas.present 是重點解盤特徵\n- Rahu/Ketu 永遠逆行，代表業力節點，非實體行星\n- is_vargottama true 的行星力量特別強\n- null 未啟用，勿腦補\n輸出：1.命主特質 2.核心Yoga 3.當前大運主題 4.建議方向',
    note: null,
  }
}
