// 命理計算用常數集中地。原本散落在 buildChartPayload.ts 頂部。

export const STEM_TO_ELEMENT: Record<string, string> = {
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

export const ZHI_TO_ELEMENT: Record<string, string> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
}

export const WESTERN_SIGNS = [
  { key: 'aries', key_zh: '牡羊座', element: 'fire', modality: 'cardinal' },
  { key: 'taurus', key_zh: '金牛座', element: 'earth', modality: 'fixed' },
  { key: 'gemini', key_zh: '雙子座', element: 'air', modality: 'mutable' },
  { key: 'cancer', key_zh: '巨蟹座', element: 'water', modality: 'cardinal' },
  { key: 'leo', key_zh: '獅子座', element: 'fire', modality: 'fixed' },
  { key: 'virgo', key_zh: '處女座', element: 'earth', modality: 'mutable' },
  { key: 'libra', key_zh: '天秤座', element: 'air', modality: 'cardinal' },
  { key: 'scorpio', key_zh: '天蠍座', element: 'water', modality: 'fixed' },
  { key: 'sagittarius', key_zh: '射手座', element: 'fire', modality: 'mutable' },
  { key: 'capricorn', key_zh: '摩羯座', element: 'earth', modality: 'cardinal' },
  { key: 'aquarius', key_zh: '水瓶座', element: 'air', modality: 'fixed' },
  { key: 'pisces', key_zh: '雙魚座', element: 'water', modality: 'mutable' },
] as const

export const WESTERN_PLANETS = [
  { key: 'sun', swe_key: 'SE_SUN', label_zh: '太陽', symbol: '☉' },
  { key: 'moon', swe_key: 'SE_MOON', label_zh: '月亮', symbol: '☽' },
  { key: 'mercury', swe_key: 'SE_MERCURY', label_zh: '水星', symbol: '☿' },
  { key: 'venus', swe_key: 'SE_VENUS', label_zh: '金星', symbol: '♀' },
  { key: 'mars', swe_key: 'SE_MARS', label_zh: '火星', symbol: '♂' },
  { key: 'jupiter', swe_key: 'SE_JUPITER', label_zh: '木星', symbol: '♃' },
  { key: 'saturn', swe_key: 'SE_SATURN', label_zh: '土星', symbol: '♄' },
  { key: 'uranus', swe_key: 'SE_URANUS', label_zh: '天王星', symbol: '♅' },
  { key: 'neptune', swe_key: 'SE_NEPTUNE', label_zh: '海王星', symbol: '♆' },
  { key: 'pluto', swe_key: 'SE_PLUTO', label_zh: '冥王星', symbol: '♇' },
] as const

export const PLANET_LABELS_ZH = WESTERN_PLANETS.reduce<Record<string, string>>((accumulator, planet) => {
  accumulator[planet.key] = planet.label_zh
  return accumulator
}, {
  asc: '上升',
  dsc: '下降',
  mc: '天頂',
  ic: '天底',
  north_node: '北交點',
  south_node: '南交點',
  part_of_fortune: '幸運點',
  vertex: '宿命點',
})

export const PLANET_SYMBOLS = WESTERN_PLANETS.reduce<Record<string, string>>((accumulator, planet) => {
  accumulator[planet.key] = planet.symbol
  return accumulator
}, {
  asc: 'ASC',
  dsc: 'DSC',
  mc: 'MC',
  ic: 'IC',
  north_node: '☊',
  south_node: '☋',
  part_of_fortune: '⊗',
  vertex: 'Vx',
})

export const WESTERN_HOUSE_NAMES = [
  '',
  '命宮',
  '財帛宮',
  '兄弟宮',
  '田宅宮',
  '子女宮',
  '奴僕宮',
  '夫妻宮',
  '疾厄宮',
  '遷移宮',
  '官祿宮',
  '福德宮',
  '玄秘宮',
] as const

export type HousePlanetPlacementMap = Record<string, { house: number }>

export const SIGN_RULERS_TRADITIONAL: Record<string, string> = {
  aries: 'mars',
  taurus: 'venus',
  gemini: 'mercury',
  cancer: 'moon',
  leo: 'sun',
  virgo: 'mercury',
  libra: 'venus',
  scorpio: 'mars',
  sagittarius: 'jupiter',
  capricorn: 'saturn',
  aquarius: 'saturn',
  pisces: 'jupiter',
}

export const DIGNITY_TABLE: Record<string, Record<string, string>> = {
  sun: { leo: 'domicile', aries: 'exaltation', aquarius: 'detriment', libra: 'fall' },
  moon: { cancer: 'domicile', taurus: 'exaltation', capricorn: 'detriment', scorpio: 'fall' },
  mercury: { gemini: 'domicile', virgo: 'exaltation', sagittarius: 'detriment', pisces: 'fall' },
  venus: { taurus: 'domicile', libra: 'domicile', pisces: 'exaltation', scorpio: 'detriment', aries: 'fall' },
  mars: { aries: 'domicile', scorpio: 'domicile', capricorn: 'exaltation', libra: 'detriment', cancer: 'fall' },
  jupiter: { sagittarius: 'domicile', pisces: 'domicile', cancer: 'exaltation', gemini: 'detriment', capricorn: 'fall' },
  saturn: { capricorn: 'domicile', aquarius: 'domicile', libra: 'exaltation', cancer: 'detriment', aries: 'fall' },
  uranus: { aquarius: 'domicile', scorpio: 'exaltation', leo: 'detriment', taurus: 'fall' },
  neptune: { pisces: 'domicile', cancer: 'exaltation', virgo: 'detriment', capricorn: 'fall' },
  pluto: { scorpio: 'domicile', aries: 'exaltation', taurus: 'detriment', libra: 'fall' },
}

export const DIGNITY_LABELS_ZH: Record<string, string> = {
  domicile: '廟',
  exaltation: '旺',
  detriment: '陷',
  fall: '弱',
  peregrine: '客',
}

export const ASPECT_TYPES = [
  { key: 'conjunction', key_zh: '合相', angle: 0, orb: 8, nature: 'harmonious' },
  { key: 'sextile', key_zh: '六分相', angle: 60, orb: 4, nature: 'harmonious' },
  { key: 'square', key_zh: '四分相', angle: 90, orb: 6, nature: 'tense' },
  { key: 'trine', key_zh: '三分相', angle: 120, orb: 6, nature: 'harmonious' },
  { key: 'quincunx', key_zh: '梅花相', angle: 150, orb: 3, nature: 'neutral' },
  { key: 'opposition', key_zh: '對分相', angle: 180, orb: 6, nature: 'tense' },
] as const

export const WHITELIST_ADJECTIVE_STARS = new Set([
  '紅鸞', '天喜', '天刑', '天姚', '孤辰', '寡宿', '天馬', '祿存', '地劫', '地空', '擎羊', '陀羅',
])

export const STEM_SIHUA_MAP: Record<string, Array<{ star: string; sihua: string }>> = {
  甲: [{ star: '廉貞', sihua: '祿' }, { star: '破軍', sihua: '權' }, { star: '武曲', sihua: '科' }, { star: '太陽', sihua: '忌' }],
  乙: [{ star: '天機', sihua: '祿' }, { star: '天梁', sihua: '權' }, { star: '紫微', sihua: '科' }, { star: '太陰', sihua: '忌' }],
  丙: [{ star: '天同', sihua: '祿' }, { star: '天機', sihua: '權' }, { star: '文昌', sihua: '科' }, { star: '廉貞', sihua: '忌' }],
  丁: [{ star: '太陰', sihua: '祿' }, { star: '天同', sihua: '權' }, { star: '天機', sihua: '科' }, { star: '巨門', sihua: '忌' }],
  戊: [{ star: '貪狼', sihua: '祿' }, { star: '太陰', sihua: '權' }, { star: '右弼', sihua: '科' }, { star: '天機', sihua: '忌' }],
  己: [{ star: '武曲', sihua: '祿' }, { star: '貪狼', sihua: '權' }, { star: '天梁', sihua: '科' }, { star: '文曲', sihua: '忌' }],
  庚: [{ star: '太陽', sihua: '祿' }, { star: '武曲', sihua: '權' }, { star: '太陰', sihua: '科' }, { star: '天同', sihua: '忌' }],
  辛: [{ star: '巨門', sihua: '祿' }, { star: '太陽', sihua: '權' }, { star: '文曲', sihua: '科' }, { star: '文昌', sihua: '忌' }],
  壬: [{ star: '天梁', sihua: '祿' }, { star: '紫微', sihua: '權' }, { star: '左輔', sihua: '科' }, { star: '武曲', sihua: '忌' }],
  癸: [{ star: '破軍', sihua: '祿' }, { star: '巨門', sihua: '權' }, { star: '太陰', sihua: '科' }, { star: '貪狼', sihua: '忌' }],
}

export const TIMEZONE_BY_CITY: Record<string, string> = {
  台北: 'Asia/Taipei',
  新北: 'Asia/Taipei',
  桃園: 'Asia/Taipei',
  新竹: 'Asia/Taipei',
  台中: 'Asia/Taipei',
  台南: 'Asia/Taipei',
  高雄: 'Asia/Taipei',
  基隆: 'Asia/Taipei',
  宜蘭: 'Asia/Taipei',
  花蓮: 'Asia/Taipei',
  台東: 'Asia/Taipei',
  嘉義: 'Asia/Taipei',
  彰化: 'Asia/Taipei',
  南投: 'Asia/Taipei',
  屏東: 'Asia/Taipei',
  澎湖: 'Asia/Taipei',
  金門: 'Asia/Taipei',
  北京: 'Asia/Shanghai',
  上海: 'Asia/Shanghai',
  廣州: 'Asia/Shanghai',
  深圳: 'Asia/Shanghai',
  成都: 'Asia/Shanghai',
  武漢: 'Asia/Shanghai',
  香港: 'Asia/Hong_Kong',
  澳門: 'Asia/Macau',
  東京: 'Asia/Tokyo',
  大阪: 'Asia/Tokyo',
  札幌: 'Asia/Tokyo',
  福岡: 'Asia/Tokyo',
  首爾: 'Asia/Seoul',
  釜山: 'Asia/Seoul',
  新加坡: 'Asia/Singapore',
  曼谷: 'Asia/Bangkok',
  河內: 'Asia/Ho_Chi_Minh',
  胡志明市: 'Asia/Ho_Chi_Minh',
  吉隆坡: 'Asia/Kuala_Lumpur',
  馬尼拉: 'Asia/Manila',
  新德里: 'Asia/Kolkata',
  孟買: 'Asia/Kolkata',
  杜拜: 'Asia/Dubai',
  阿布達比: 'Asia/Dubai',
  倫敦: 'Europe/London',
  曼徹斯特: 'Europe/London',
  巴黎: 'Europe/Paris',
  柏林: 'Europe/Berlin',
  慕尼黑: 'Europe/Berlin',
  紐約: 'America/New_York',
  洛杉磯: 'America/Los_Angeles',
  芝加哥: 'America/Chicago',
  休士頓: 'America/Chicago',
  舊金山: 'America/Los_Angeles',
  檀香山: 'Pacific/Honolulu',
  多倫多: 'America/Toronto',
  溫哥華: 'America/Vancouver',
  雪梨: 'Australia/Sydney',
  墨爾本: 'Australia/Melbourne',
  布里斯本: 'Australia/Brisbane',
  阿德萊德: 'Australia/Adelaide',
  奧克蘭: 'Pacific/Auckland',
}

export const RECTIFICATION_ASK_USER_FOR = [
  '外貌、體型、臉型與第一印象',
  '與父母誰較親、誰較有權威感',
  '兄弟姊妹互動與排行角色',
  '求學表現、轉學、離家讀書年份',
  '感情、婚姻、同居或分手的重要年份',
  '工作升遷、創業、轉職與低潮年份',
  '搬家、出國、遠行、移民經驗',
  '重大病傷、手術、車禍或身心低谷年份',
] as const

export const PILLAR_LABELS_ZH = {
  year: '年柱',
  month: '月柱',
  day: '日柱',
  time: '時柱',
} as const

export const CHINESE_TO_WUXING_KEY: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
  木: 'wood',
  火: 'fire',
  土: 'earth',
  金: 'metal',
  水: 'water',
}

export const ELEMENT_GENERATES_ZH: Record<string, string> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
}

export const ELEMENT_GENERATED_BY_ZH: Record<string, string> = {
  火: '木',
  土: '火',
  金: '土',
  水: '金',
  木: '水',
}

export const ELEMENT_CONTROLS_ZH: Record<string, string> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木',
}

export const ELEMENT_CONTROLLED_BY_ZH: Record<string, string> = {
  土: '木',
  水: '土',
  火: '水',
  金: '火',
  木: '金',
}

export const SEASON_CONTEXT_BY_BRANCH: Record<string, { season: string; season_zh: string; season_commander_zh: string }> = {
  寅: { season: 'spring', season_zh: '春', season_commander_zh: '木' },
  卯: { season: 'spring', season_zh: '春', season_commander_zh: '木' },
  辰: { season: 'spring', season_zh: '春', season_commander_zh: '木' },
  巳: { season: 'summer', season_zh: '夏', season_commander_zh: '火' },
  午: { season: 'summer', season_zh: '夏', season_commander_zh: '火' },
  未: { season: 'summer', season_zh: '夏', season_commander_zh: '火' },
  申: { season: 'autumn', season_zh: '秋', season_commander_zh: '金' },
  酉: { season: 'autumn', season_zh: '秋', season_commander_zh: '金' },
  戌: { season: 'autumn', season_zh: '秋', season_commander_zh: '金' },
  亥: { season: 'winter', season_zh: '冬', season_commander_zh: '水' },
  子: { season: 'winter', season_zh: '冬', season_commander_zh: '水' },
  丑: { season: 'winter', season_zh: '冬', season_commander_zh: '水' },
}

export const STEM_COMBINATIONS = [
  { stems: ['甲', '己'], result_zh: '土' },
  { stems: ['乙', '庚'], result_zh: '金' },
  { stems: ['丙', '辛'], result_zh: '水' },
  { stems: ['丁', '壬'], result_zh: '木' },
  { stems: ['戊', '癸'], result_zh: '火' },
] as const

export const BRANCH_COMBINATIONS = [
  { branches: ['子', '丑'], result_zh: '土' },
  { branches: ['寅', '亥'], result_zh: '木' },
  { branches: ['卯', '戌'], result_zh: '火' },
  { branches: ['辰', '酉'], result_zh: '金' },
  { branches: ['巳', '申'], result_zh: '水' },
  { branches: ['午', '未'], result_zh: '土' },
] as const

export const BRANCH_CLASHES = [
  ['子', '午'],
  ['丑', '未'],
  ['寅', '申'],
  ['卯', '酉'],
  ['辰', '戌'],
  ['巳', '亥'],
] as const

export const BRANCH_TRINES = [
  { branches: ['寅', '午', '戌'], result_zh: '火' },
  { branches: ['亥', '卯', '未'], result_zh: '木' },
  { branches: ['申', '子', '辰'], result_zh: '水' },
  { branches: ['巳', '酉', '丑'], result_zh: '金' },
] as const

export const BRANCH_MEETINGS = [
  { branches: ['寅', '卯', '辰'], result_zh: '木' },
  { branches: ['巳', '午', '未'], result_zh: '火' },
  { branches: ['申', '酉', '戌'], result_zh: '金' },
  { branches: ['亥', '子', '丑'], result_zh: '水' },
] as const

export const BRANCH_PUNISHMENTS = [
  { branches: ['寅', '巳', '申'], label: '寅巳申三刑' },
  { branches: ['丑', '未', '戌'], label: '丑未戌三刑' },
] as const

export const BRANCH_PAIR_PUNISHMENTS = [
  ['子', '卯'],
] as const

export const BRANCH_SELF_PUNISH = new Set(['辰', '午', '酉', '亥'])

export const ZIWEI_THEME_PALACES = {
  personality: ['命宮', '身宮', '福德', '遷移'],
  career: ['命宮', '財帛', '官祿', '遷移'],
  love: ['命宮', '夫妻', '子女', '福德'],
  wealth: ['命宮', '財帛', '官祿', '田宅'],
  life_path: ['命宮', '福德', '疾厄', '玄秘'],
} as const

export const ZIWEI_SUGGESTED_PROMPT =
  '紫微斗數解讀規則：\n1. 以 majorStars 與 mutagen_mapped 為核心，minorStars 僅修飾\n2. 嚴禁因單一雜曜或亮度「陷」給出災難性預言\n3. 讀任何宮位必須同時檢視 surrounding（三方四正）\n4. 推演流年時比對流年宮位與本命宮位的重疊（疊宮）\n5. 化忌>化祿>化權>化科（影響力），化忌是「需特別處理的能量集中」非單純凶象'
