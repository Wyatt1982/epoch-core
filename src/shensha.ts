type PillarKey = 'year' | 'month' | 'day' | 'time'

type PillarLike = {
  text?: string | null
  heavenly_stem?: {
    text?: string | null
  } | null
  earthly_branch?: {
    text?: string | null
  } | null
}

type ShenShaBuckets = {
  auspicious: string[]
  neutral: string[]
  inauspicious: string[]
}

export const TIANYI: Record<string, string[]> = {
  甲: ['丑', '未'],
  乙: ['子', '申'],
  丙: ['亥', '酉'],
  丁: ['亥', '酉'],
  戊: ['丑', '未'],
  己: ['子', '申'],
  庚: ['丑', '未'],
  辛: ['寅', '午'],
  壬: ['卯', '巳'],
  癸: ['卯', '巳'],
}

export const WENCHANG: Record<string, string> = {
  甲: '巳',
  乙: '午',
  丙: '申',
  丁: '酉',
  戊: '申',
  己: '酉',
  庚: '亥',
  辛: '子',
  壬: '寅',
  癸: '卯',
}

export const YIMA: Record<string, string> = {
  寅: '申',
  午: '申',
  戌: '申',
  申: '寅',
  子: '寅',
  辰: '寅',
  巳: '亥',
  酉: '亥',
  丑: '亥',
  亥: '巳',
  卯: '巳',
  未: '巳',
}

export const TAOHUA: Record<string, string> = {
  寅: '卯',
  午: '卯',
  戌: '卯',
  申: '酉',
  子: '酉',
  辰: '酉',
  巳: '午',
  酉: '午',
  丑: '午',
  亥: '子',
  卯: '子',
  未: '子',
}

export const JIANGXING: Record<string, string> = {
  寅: '午',
  午: '午',
  戌: '午',
  申: '子',
  子: '子',
  辰: '子',
  巳: '酉',
  酉: '酉',
  丑: '酉',
  亥: '卯',
  卯: '卯',
  未: '卯',
}

export const HUAGAI: Record<string, string> = {
  寅: '戌',
  午: '戌',
  戌: '戌',
  申: '辰',
  子: '辰',
  辰: '辰',
  巳: '丑',
  酉: '丑',
  丑: '丑',
  亥: '未',
  卯: '未',
  未: '未',
}

export const YANGREN: Record<string, string> = {
  甲: '卯',
  乙: '寅',
  丙: '午',
  丁: '巳',
  戊: '午',
  己: '巳',
  庚: '酉',
  辛: '申',
  壬: '子',
  癸: '亥',
}

export const KUIGANG = new Set(['庚辰', '庚戌', '壬辰', '戊戌'])

function emptyBuckets(): ShenShaBuckets {
  return {
    auspicious: [],
    neutral: [],
    inauspicious: [],
  }
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values))
}

function pushShenSha(buckets: ShenShaBuckets, tone: keyof ShenShaBuckets, label: string) {
  if (!buckets[tone].includes(label)) {
    buckets[tone].push(label)
  }
}

function pillarBranch(pillar: PillarLike) {
  return pillar.earthly_branch?.text ?? pillar.text?.slice(1) ?? null
}

function pillarStem(pillar: PillarLike) {
  return pillar.heavenly_stem?.text ?? pillar.text?.slice(0, 1) ?? null
}

export function computeShenShaByPillars(pillars: Record<PillarKey, PillarLike>) {
  const decorated = {
    year: { ...pillars.year, shen_sha: emptyBuckets() },
    month: { ...pillars.month, shen_sha: emptyBuckets() },
    day: { ...pillars.day, shen_sha: emptyBuckets() },
    time: { ...pillars.time, shen_sha: emptyBuckets() },
  }

  const dayStem = pillarStem(pillars.day)
  const yearBranch = pillarBranch(pillars.year)
  const dayText = pillars.day.text ?? ''

  const pillarEntries = Object.entries(pillars) as Array<[PillarKey, PillarLike]>

  if (dayStem && TIANYI[dayStem]) {
    for (const [key, pillar] of pillarEntries) {
      if (TIANYI[dayStem].includes(pillarBranch(pillar) ?? '')) {
        pushShenSha(decorated[key].shen_sha, 'auspicious', '天乙貴人')
      }
    }
  }

  if (dayStem && WENCHANG[dayStem]) {
    for (const [key, pillar] of pillarEntries) {
      if (pillarBranch(pillar) === WENCHANG[dayStem]) {
        pushShenSha(decorated[key].shen_sha, 'auspicious', '文昌貴人')
      }
    }
  }

  if (yearBranch && YIMA[yearBranch]) {
    for (const [key, pillar] of pillarEntries) {
      if (pillarBranch(pillar) === YIMA[yearBranch]) {
        pushShenSha(decorated[key].shen_sha, 'neutral', '驛馬')
      }
    }
  }

  if (yearBranch && TAOHUA[yearBranch]) {
    for (const [key, pillar] of pillarEntries) {
      if (pillarBranch(pillar) === TAOHUA[yearBranch]) {
        pushShenSha(decorated[key].shen_sha, 'inauspicious', '桃花')
      }
    }
  }

  if (yearBranch && JIANGXING[yearBranch]) {
    for (const [key, pillar] of pillarEntries) {
      if (pillarBranch(pillar) === JIANGXING[yearBranch]) {
        pushShenSha(decorated[key].shen_sha, 'auspicious', '將星')
      }
    }
  }

  if (yearBranch && HUAGAI[yearBranch]) {
    for (const [key, pillar] of pillarEntries) {
      if (pillarBranch(pillar) === HUAGAI[yearBranch]) {
        pushShenSha(decorated[key].shen_sha, 'neutral', '華蓋')
      }
    }
  }

  if (dayStem && YANGREN[dayStem]) {
    for (const [key, pillar] of pillarEntries) {
      if (pillarBranch(pillar) === YANGREN[dayStem]) {
        pushShenSha(decorated[key].shen_sha, 'inauspicious', '羊刃')
      }
    }
  }

  if (KUIGANG.has(dayText)) {
    pushShenSha(decorated.day.shen_sha, 'auspicious', '魁罡')
  }

  const allBuckets = Object.values(decorated).map(item => item.shen_sha)

  return {
    pillars: decorated,
    shen_sha_summary: {
      auspicious: uniqueList(allBuckets.flatMap(item => item.auspicious)),
      neutral: uniqueList(allBuckets.flatMap(item => item.neutral)),
      inauspicious: uniqueList(allBuckets.flatMap(item => item.inauspicious)),
      source: 'shensha-v1',
      coverage_note: '第一批：天乙貴人、文昌貴人、驛馬、桃花、將星、華蓋、羊刃、魁罡',
    },
  }
}
