// 西洋占星模組：行星、宮位、相位、格局、transit。
import type {
  ChartRequestInput,
  WesternAspect,
  WesternHouse,
  WesternModule,
} from '../types'
import {
  ASPECT_TYPES,
  PLANET_LABELS_ZH,
  SIGN_RULERS_TRADITIONAL,
  WESTERN_HOUSE_NAMES,
  WESTERN_PLANETS,
  WESTERN_SIGNS,
  type HousePlanetPlacementMap,
} from '../constants'
import {
  angularDistance,
  cloneJson,
  computeSunRelation,
  formatBirthDatetimeLocal,
  formatUtcOffset,
  getDignity,
  getSignInfo,
  getSwissEph,
  normalizeDegree,
  resolveTimezoneName,
  round,
  toBirthUtcDate,
  toHouseIndex,
  uniqueStrings,
  type SwissEph,
} from '../shared'

// swisseph-wasm house_pos 等呼叫沒完整型別，退回 any 並集中在這個檔案裡。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

function getPlanetLongitudeAtJD(swe: SwissEph, julianDay: number, planetId: number) {
  return normalizeDegree(swe.calc_ut(julianDay, planetId, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED)[0])
}

async function computeIsApplying(
  swe: SwissEph,
  julianDay: number,
  planetAId: number,
  planetBId: number,
  degreeA: number,
  degreeB: number,
) {
  const distance0 = angularDistance(degreeA, degreeB)
  const nextJulianDay = julianDay + 1 / 24
  const newDegreeA = getPlanetLongitudeAtJD(swe, nextJulianDay, planetAId)
  const newDegreeB = getPlanetLongitudeAtJD(swe, nextJulianDay, planetBId)
  return angularDistance(newDegreeA, newDegreeB) < distance0
}

function buildWesternAngles(houseData: { ascmc: Float64Array }) {
  const asc = getSignInfo(houseData.ascmc[0])
  const mc = getSignInfo(houseData.ascmc[1])
  const dsc = getSignInfo(houseData.ascmc[0] + 180)
  const ic = getSignInfo(houseData.ascmc[1] + 180)

  return {
    asc: { ...asc, key: 'asc', label_zh: '上升', symbol: 'ASC' },
    dsc: { ...dsc, key: 'dsc', label_zh: '下降', symbol: 'DSC' },
    mc: { ...mc, key: 'mc', label_zh: '天頂', symbol: 'MC' },
    ic: { ...ic, key: 'ic', label_zh: '天底', symbol: 'IC' },
  }
}

function isDegreeBetween(target: number, start: number, end: number) {
  const normalizedTarget = normalizeDegree(target)
  const normalizedStart = normalizeDegree(start)
  const normalizedEnd = normalizeDegree(end)
  if (normalizedStart <= normalizedEnd) {
    return normalizedTarget >= normalizedStart && normalizedTarget <= normalizedEnd
  }
  return normalizedTarget >= normalizedStart || normalizedTarget <= normalizedEnd
}

function buildHouseDictionary(
  systemKey: 'placidus' | 'whole_sign',
  cuspDegrees: number[],
  planetsBySystem: Record<string, { house: number }>,
): Record<string, WesternHouse> {
  return cuspDegrees.reduce<Record<string, WesternHouse>>((accumulator, cuspDegree, index) => {
    const house = index + 1
    const signInfo = getSignInfo(cuspDegree)
    const ruler = SIGN_RULERS_TRADITIONAL[signInfo.sign]
    const nextCusp = cuspDegrees[(index + 1) % 12]
    const startSignIndex = Math.floor(normalizeDegree(cuspDegree) / 30)
    const endSignIndex = Math.floor(normalizeDegree(nextCusp - 0.0001) / 30)
    const interceptedSigns: string[] = []

    if (systemKey === 'placidus') {
      let cursor = (startSignIndex + 1) % 12
      while (cursor !== endSignIndex) {
        interceptedSigns.push(WESTERN_SIGNS[cursor].key)
        cursor = (cursor + 1) % 12
      }
    }

    accumulator[String(house)] = {
      name_zh: WESTERN_HOUSE_NAMES[house],
      cusp_sign: signInfo.sign,
      cusp_sign_zh: signInfo.sign_zh,
      cusp_degree: signInfo.sign_degree,
      absolute_degree: signInfo.absolute_degree,
      ruler,
      ruler_zh: PLANET_LABELS_ZH[ruler] ?? null,
      almuten: ruler,
      ruler_house: planetsBySystem[ruler]?.house ?? null,
      ruler_fly_to: planetsBySystem[ruler]?.house ?? null,
      is_intercepted: systemKey === 'placidus' ? interceptedSigns.length > 0 : false,
      intercepted_sign: systemKey === 'placidus' ? interceptedSigns[0] ?? null : null,
      planets_in_house: Object.entries(planetsBySystem)
        .filter(([, planet]) => planet.house === house)
        .map(([planetKey]) => planetKey),
    }
    return accumulator
  }, {})
}

function findStelliums(planets: Record<string, { sign: string; house: number }>) {
  const bySign: Record<string, string[]> = {}
  const byHouse: Record<string, string[]> = {}

  for (const [planetKey, planet] of Object.entries(planets)) {
    bySign[planet.sign] = [...(bySign[planet.sign] ?? []), planetKey]
    byHouse[String(planet.house)] = [...(byHouse[String(planet.house)] ?? []), planetKey]
  }

  return {
    by_sign: Object.entries(bySign)
      .filter(([, values]) => values.length >= 3)
      .map(([sign, values]) => ({ sign, sign_zh: WESTERN_SIGNS.find(item => item.key === sign)?.key_zh ?? null, planets: values })),
    by_house: Object.entries(byHouse)
      .filter(([, values]) => values.length >= 3)
      .map(([house, values]) => ({ house: Number(house), planets: values })),
  }
}

function aspectLookup(aspects: Array<Record<string, unknown>>, left: string, right: string, aspectKey: string) {
  return aspects.find(
    item =>
      (((item.planet_a === left && item.planet_b === right) || (item.planet_a === right && item.planet_b === left)) && item.aspect === aspectKey),
  )
}

function findGrandTrine(aspects: Array<Record<string, unknown>>, planets: string[]) {
  for (let a = 0; a < planets.length; a += 1) {
    for (let b = a + 1; b < planets.length; b += 1) {
      for (let c = b + 1; c < planets.length; c += 1) {
        const trio = [planets[a], planets[b], planets[c]]
        if (
          aspectLookup(aspects, trio[0], trio[1], 'trine') &&
          aspectLookup(aspects, trio[0], trio[2], 'trine') &&
          aspectLookup(aspects, trio[1], trio[2], 'trine')
        ) {
          return { planets: trio }
        }
      }
    }
  }
  return null
}

function findTSquare(aspects: Array<Record<string, unknown>>, planets: string[]) {
  for (let a = 0; a < planets.length; a += 1) {
    for (let b = a + 1; b < planets.length; b += 1) {
      if (!aspectLookup(aspects, planets[a], planets[b], 'opposition')) continue
      for (let c = 0; c < planets.length; c += 1) {
        if (c === a || c === b) continue
        if (aspectLookup(aspects, planets[a], planets[c], 'square') && aspectLookup(aspects, planets[b], planets[c], 'square')) {
          return { opposition: [planets[a], planets[b]], apex: planets[c] }
        }
      }
    }
  }
  return null
}

function findGrandCross(aspects: Array<Record<string, unknown>>, planets: string[]) {
  for (let a = 0; a < planets.length; a += 1) {
    for (let b = a + 1; b < planets.length; b += 1) {
      for (let c = b + 1; c < planets.length; c += 1) {
        for (let d = c + 1; d < planets.length; d += 1) {
          const group = [planets[a], planets[b], planets[c], planets[d]]
          const oppositions = group.flatMap((planet, index) =>
            group.slice(index + 1).filter(other => aspectLookup(aspects, planet, other, 'opposition')).map(other => [planet, other]),
          )
          const squares = group.flatMap((planet, index) =>
            group.slice(index + 1).filter(other => aspectLookup(aspects, planet, other, 'square')).map(other => [planet, other]),
          )
          if (oppositions.length >= 2 && squares.length >= 4) {
            return { planets: group }
          }
        }
      }
    }
  }
  return null
}

function findYod(aspects: Array<Record<string, unknown>>, planets: string[]) {
  for (let a = 0; a < planets.length; a += 1) {
    for (let b = a + 1; b < planets.length; b += 1) {
      if (!aspectLookup(aspects, planets[a], planets[b], 'sextile')) continue
      for (let c = 0; c < planets.length; c += 1) {
        if (c === a || c === b) continue
        if (aspectLookup(aspects, planets[a], planets[c], 'quincunx') && aspectLookup(aspects, planets[b], planets[c], 'quincunx')) {
          return { base: [planets[a], planets[b]], apex: planets[c] }
        }
      }
    }
  }
  return null
}

function findMutualReceptions(planets: Record<string, { sign: string }>) {
  const matches: Array<Record<string, unknown>> = []
  const planetEntries = Object.entries(planets)

  for (let index = 0; index < planetEntries.length; index += 1) {
    for (let compare = index + 1; compare < planetEntries.length; compare += 1) {
      const [planetA, infoA] = planetEntries[index]
      const [planetB, infoB] = planetEntries[compare]
      if (SIGN_RULERS_TRADITIONAL[infoA.sign] === planetB && SIGN_RULERS_TRADITIONAL[infoB.sign] === planetA) {
        matches.push({
          planets: [planetA, planetB],
          via_signs: [infoA.sign, infoB.sign],
        })
      }
    }
  }

  return matches
}

function buildDispositorChain(planets: Record<string, { sign: string }>) {
  const chain: string[] = []
  const seen = new Map<string, number>()
  let current = 'sun'

  while (current) {
    if (seen.has(current)) {
      const loopIndex = seen.get(current) ?? 0
      return {
        sun_chain: chain,
        end_state: 'loop',
        final_dispositor: null,
        loop_planets: chain.slice(loopIndex),
      }
    }

    chain.push(current)
    seen.set(current, chain.length - 1)
    const next = SIGN_RULERS_TRADITIONAL[planets[current]?.sign ?? '']
    if (!next) {
      return {
        sun_chain: chain,
        end_state: 'mixed',
        final_dispositor: null,
        loop_planets: [],
      }
    }

    if (next === current) {
      return {
        sun_chain: [...chain, next],
        end_state: 'sole_dispositor',
        final_dispositor: next,
        loop_planets: [],
      }
    }

    current = next
  }

  return {
    sun_chain: chain,
    end_state: 'mixed',
    final_dispositor: null,
    loop_planets: [],
  }
}

function dominantKey(counts: Record<string, number>) {
  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null
}

function buildChartStats(planets: Record<string, { element: string; modality: string; retrograde: boolean; house: number }>) {
  const elementCount = { fire: 0, earth: 0, air: 0, water: 0 }
  const modalityCount = { cardinal: 0, fixed: 0, mutable: 0 }
  const hemisphere = { northern: 0, southern: 0, eastern: 0, western: 0 }
  const retrogradePlanets: string[] = []

  Object.entries(planets).forEach(([planetKey, planet]) => {
    elementCount[planet.element as keyof typeof elementCount] += 1
    modalityCount[planet.modality as keyof typeof modalityCount] += 1
    if (planet.house >= 7) {
      hemisphere.southern += 1
    } else {
      hemisphere.northern += 1
    }
    if ([10, 11, 12, 1, 2, 3].includes(planet.house)) {
      hemisphere.eastern += 1
    } else {
      hemisphere.western += 1
    }
    if (planet.retrograde) {
      retrogradePlanets.push(planetKey)
    }
  })

  return {
    dominant_element: dominantKey(elementCount),
    element_count: elementCount,
    dominant_modality: dominantKey(modalityCount),
    modality_count: modalityCount,
    hemisphere,
    retrograde_count: retrogradePlanets.length,
    retrograde_planets: retrogradePlanets,
  }
}

export async function buildWesternModule(input: ChartRequestInput): Promise<WesternModule> {
  const isRelocated = !(
    Math.abs(input.latitude - input.currentLocation.latitude) < 0.01 &&
    Math.abs(input.longitude - input.currentLocation.longitude) < 0.01
  )

  if (input.birthTimeUnknown || input.hourIndex === null) {
    return {
      module: 'western',
      meta: {
        birth_datetime_local: null,
        birth_datetime_utc: null,
        timezone_name: resolveTimezoneName(input),
        utc_offset_at_birth: formatUtcOffset(input.timezoneOffset),
        dst_in_effect: input.dstInEffect,
        birth_location: {
          city: input.city,
          latitude: round(input.latitude, 2),
          longitude: round(input.longitude, 2),
        },
        current_location: {
          city: input.currentLocation.city,
          latitude: round(input.currentLocation.latitude, 2),
          longitude: round(input.currentLocation.longitude, 2),
        },
        is_relocated: isRelocated,
        house_system_primary: 'placidus',
        house_system_secondary: 'whole_sign',
        sect: null,
      },
      angles: null,
      planets: {
        placidus: {},
        whole_sign: {},
      },
      aspects: [],
      houses: {
        placidus: {},
        whole_sign: {},
      },
      patterns: {
        stelliums: { by_sign: [], by_house: [] },
        grand_trine: null,
        t_square: null,
        grand_cross: null,
        yod: null,
        mutual_receptions: [],
        dispositor_chain: {
          sun_chain: [],
          end_state: 'mixed',
          final_dispositor: null,
          loop_planets: [],
        },
      },
      chart_stats: {
        dominant_element: null,
        element_count: { fire: 0, earth: 0, air: 0, water: 0 },
        dominant_modality: null,
        modality_count: { cardinal: 0, fixed: 0, mutable: 0 },
        hemisphere: { northern: 0, southern: 0, eastern: 0, western: 0 },
        retrograde_count: 0,
        retrograde_planets: [],
      },
      current_sky: {
        generated_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        note: '僅含外行星，有效期約一個月',
        planets: {},
        transit_events: [],
      },
      relocated: isRelocated
        ? {
            based_on: 'current_location',
            note: '行星星座位置相同，只重算宮位與四大尖軸',
            angles: null,
            houses: {
              placidus: {},
              whole_sign: {},
            },
          }
        : null,
      reading_contexts: {
        personality: null,
        career: null,
        love: null,
        wealth: null,
        life_path: null,
      },
      note: '出生時間未知時不輸出宮位與四軸。',
    }
  }

  const swe = await getSwissEph()
  const birthUtcDate = toBirthUtcDate(input)
  const jdInfo = swe.utc_to_jd(
    birthUtcDate.getUTCFullYear(),
    birthUtcDate.getUTCMonth() + 1,
    birthUtcDate.getUTCDate(),
    birthUtcDate.getUTCHours(),
    birthUtcDate.getUTCMinutes(),
    birthUtcDate.getUTCSeconds(),
    swe.SE_GREG_CAL,
  )
  const julianDayUT = jdInfo.julianDayUT
  const placidusHouseData = swe.houses(julianDayUT, input.latitude, input.longitude, 'P')
  const trueObliquity = swe.calc_ut(julianDayUT, -1, 0)[0]
  const armc = placidusHouseData.ascmc[2]
  const calcFlags = swe.SEFLG_SWIEPH | swe.SEFLG_SPEED

  const placidusAngles = buildWesternAngles(placidusHouseData)
  const ascSignIndex = Math.floor(placidusAngles.asc.absolute_degree / 30)
  const wholeSignCusps = Array.from({ length: 12 }, (_, index) => normalizeDegree(ascSignIndex * 30 + index * 30))

  const planetBase = WESTERN_PLANETS.reduce<Record<string, AnyRecord>>((accumulator, planet) => {
    const result = swe.calc_ut(julianDayUT, swe[planet.swe_key], calcFlags)
    const absoluteDegree = normalizeDegree(result[0])
    const signInfo = getSignInfo(absoluteDegree)
    const placidusHouse = toHouseIndex(swe.house_pos(armc, input.latitude, trueObliquity, 'P', result[0], result[1]))
    const wholeSignHouse = ((signInfo.sign_index - ascSignIndex + 12) % 12) + 1
    accumulator[planet.key] = {
      key: planet.key,
      key_zh: planet.label_zh,
      symbol: planet.symbol,
      sign: signInfo.sign,
      sign_zh: signInfo.sign_zh,
      sign_degree: signInfo.sign_degree,
      degree_formatted: signInfo.degree_formatted,
      absolute_degree: signInfo.absolute_degree,
      retrograde: result[3] < 0,
      element: signInfo.element,
      modality: signInfo.modality,
      latitude: round(result[1]),
      speed: round(result[3]),
      placidus_house: placidusHouse,
      whole_sign_house: wholeSignHouse,
      planet_id: swe[planet.swe_key],
    }
    return accumulator
  }, {})

  const sunAbsolute = Number(planetBase.sun.absolute_degree)
  const sect = isDegreeBetween(sunAbsolute, placidusAngles.asc.absolute_degree, placidusAngles.dsc.absolute_degree) ? 'nocturnal' : 'diurnal'

  const planets = {
    placidus: Object.fromEntries(
      Object.entries(planetBase).map(([planetKey, value]) => {
        const base = value as AnyRecord
        const dignity = getDignity(planetKey, base.sign)
        return [
          planetKey,
          {
            sign: base.sign,
            sign_zh: base.sign_zh,
            sign_degree: base.sign_degree,
            degree_formatted: base.degree_formatted,
            absolute_degree: base.absolute_degree,
            house: base.placidus_house,
            retrograde: base.retrograde,
            dignity: dignity.dignity,
            dignity_zh: dignity.dignity_zh,
            sun_relation: planetKey === 'sun' ? 'none' : computeSunRelation(base.absolute_degree, sunAbsolute),
            element: base.element,
            modality: base.modality,
            symbol: base.symbol,
          },
        ]
      }),
    ),
    whole_sign: Object.fromEntries(
      Object.entries(planetBase).map(([planetKey, value]) => {
        const base = value as AnyRecord
        const dignity = getDignity(planetKey, base.sign)
        return [
          planetKey,
          {
            sign: base.sign,
            sign_zh: base.sign_zh,
            sign_degree: base.sign_degree,
            degree_formatted: base.degree_formatted,
            absolute_degree: base.absolute_degree,
            house: base.whole_sign_house,
            retrograde: base.retrograde,
            dignity: dignity.dignity,
            dignity_zh: dignity.dignity_zh,
            sun_relation: planetKey === 'sun' ? 'none' : computeSunRelation(base.absolute_degree, sunAbsolute),
            element: base.element,
            modality: base.modality,
            symbol: base.symbol,
          },
        ]
      }),
    ),
  }

  const northNodeResult = swe.calc_ut(julianDayUT, swe.SE_TRUE_NODE, calcFlags)
  const northNodeDegree = normalizeDegree(northNodeResult[0])
  const southNodeDegree = normalizeDegree(northNodeDegree + 180)
  const partOfFortuneDegree = normalizeDegree(
    sect === 'diurnal'
      ? placidusAngles.asc.absolute_degree + Number(planetBase.moon.absolute_degree) - sunAbsolute
      : placidusAngles.asc.absolute_degree + sunAbsolute - Number(planetBase.moon.absolute_degree),
  )
  const vertexDegree = placidusHouseData.ascmc[3]

  const angles = {
    ...placidusAngles,
    north_node: { ...getSignInfo(northNodeDegree), key: 'north_node', label_zh: '北交點', symbol: '☊' },
    south_node: { ...getSignInfo(southNodeDegree), key: 'south_node', label_zh: '南交點', symbol: '☋' },
    part_of_fortune: { ...getSignInfo(partOfFortuneDegree), key: 'part_of_fortune', label_zh: '幸運點', symbol: '⊗' },
    vertex: { ...getSignInfo(vertexDegree), key: 'vertex', label_zh: '宿命點', symbol: 'Vx' },
  }

  const placidusPlanetPlacements = planets.placidus as HousePlanetPlacementMap
  const wholeSignPlanetPlacements = planets.whole_sign as HousePlanetPlacementMap

  const houses = {
    placidus: buildHouseDictionary(
      'placidus',
      Array.from({ length: 12 }, (_, index) => placidusHouseData.cusps[index + 1]),
      placidusPlanetPlacements,
    ),
    whole_sign: buildHouseDictionary('whole_sign', wholeSignCusps, wholeSignPlanetPlacements),
  }

  const aspectBodies = [
    ...Object.values(planetBase).map((planet: AnyRecord) => ({
      key: planet.key as string,
      label_zh: PLANET_LABELS_ZH[planet.key as string],
      absolute_degree: planet.absolute_degree as number,
      planet_id: planet.planet_id as number | null,
    })),
    { key: 'asc', label_zh: '上升', absolute_degree: placidusAngles.asc.absolute_degree, planet_id: null },
    { key: 'mc', label_zh: '天頂', absolute_degree: placidusAngles.mc.absolute_degree, planet_id: null },
    { key: 'north_node', label_zh: '北交點', absolute_degree: northNodeDegree, planet_id: swe.SE_TRUE_NODE },
  ]

  const aspects: WesternAspect[] = []
  for (let left = 0; left < aspectBodies.length; left += 1) {
    for (let right = left + 1; right < aspectBodies.length; right += 1) {
      const leftBody = aspectBodies[left]
      const rightBody = aspectBodies[right]
      const distance = angularDistance(leftBody.absolute_degree, rightBody.absolute_degree)
      const aspectType = ASPECT_TYPES.find(aspect => Math.abs(distance - aspect.angle) <= aspect.orb)
      if (!aspectType) continue

      aspects.push({
        planet_a: leftBody.key,
        planet_a_zh: leftBody.label_zh,
        planet_a_absolute_degree: round(leftBody.absolute_degree, 2),
        planet_b: rightBody.key,
        planet_b_zh: rightBody.label_zh,
        planet_b_absolute_degree: round(rightBody.absolute_degree, 2),
        aspect: aspectType.key,
        aspect_zh: aspectType.key_zh,
        angle: aspectType.angle,
        orb: round(Math.abs(distance - aspectType.angle), 2),
        actual_angle: round(distance, 2),
        is_applying:
          leftBody.planet_id !== null && rightBody.planet_id !== null
            ? await computeIsApplying(swe, julianDayUT, leftBody.planet_id, rightBody.planet_id, leftBody.absolute_degree, rightBody.absolute_degree)
            : null,
        nature: aspectType.nature,
      })
    }
  }

  const placidusPlanetCore = planets.placidus as Record<string, { sign: string; house: number; element: string; modality: string; retrograde: boolean }>
  const planetKeys = Object.keys(placidusPlanetCore)
  const patterns = {
    stelliums: findStelliums(placidusPlanetCore),
    grand_trine: findGrandTrine(aspects, planetKeys),
    t_square: findTSquare(aspects, planetKeys),
    grand_cross: findGrandCross(aspects, planetKeys),
    yod: findYod(aspects, planetKeys),
    mutual_receptions: findMutualReceptions(placidusPlanetCore),
    dispositor_chain: buildDispositorChain(placidusPlanetCore),
  }
  const chartStats = buildChartStats(placidusPlanetCore)

  const currentJd = swe.utc_to_jd(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth() + 1,
    new Date().getUTCDate(),
    new Date().getUTCHours(),
    new Date().getUTCMinutes(),
    new Date().getUTCSeconds(),
    swe.SE_GREG_CAL,
  ).julianDayUT

  const currentSkyPlanets = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].reduce<Record<string, AnyRecord>>((accumulator, key) => {
    const config = WESTERN_PLANETS.find(planet => planet.key === key)
    if (!config) return accumulator
    const result = swe.calc_ut(currentJd, swe[config.swe_key], calcFlags)
    const signInfo = getSignInfo(result[0])
    accumulator[key] = {
      sign: signInfo.sign,
      sign_zh: signInfo.sign_zh,
      absolute_degree: signInfo.absolute_degree,
      retrograde: result[3] < 0,
      speed: round(result[3]),
    }
    return accumulator
  }, {})

  const transitTargets = [
    ...['sun', 'moon', 'mercury', 'venus', 'mars'].map(key => ({
      key,
      degree: Number((planetBase as Record<string, { absolute_degree: number }>)[key].absolute_degree),
      label_zh: PLANET_LABELS_ZH[key],
    })),
    { key: 'asc', degree: placidusAngles.asc.absolute_degree, label_zh: '上升' },
    { key: 'dsc', degree: placidusAngles.dsc.absolute_degree, label_zh: '下降' },
    { key: 'mc', degree: placidusAngles.mc.absolute_degree, label_zh: '天頂' },
    { key: 'ic', degree: placidusAngles.ic.absolute_degree, label_zh: '天底' },
  ]

  const transitEvents: Array<Record<string, unknown>> = []
  for (const [transitPlanet, info] of Object.entries(currentSkyPlanets)) {
    for (const target of transitTargets) {
      for (const aspect of ASPECT_TYPES.filter(item => ['conjunction', 'square', 'opposition'].includes(item.key))) {
        const orb = Math.abs(angularDistance(Number(info.absolute_degree), target.degree) - aspect.angle)
        if (orb <= 1.5) {
          transitEvents.push({
            tier: 'tier_1',
            transit_planet: transitPlanet,
            transit_planet_zh: PLANET_LABELS_ZH[transitPlanet],
            natal_body: target.key,
            natal_body_zh: target.label_zh,
            aspect: aspect.key,
            aspect_zh: aspect.key_zh,
            orb: round(orb, 2),
            is_stationary_hit: Math.abs(Number(info.speed ?? 0)) < 0.02 && angularDistance(Number(info.absolute_degree), target.degree) <= 1,
          })
        }
      }
    }
  }

  const currentMars = swe.calc_ut(currentJd, swe.SE_MARS, calcFlags)
  const marsDegree = normalizeDegree(currentMars[0])
  for (const [outerPlanet, info] of Object.entries(currentSkyPlanets)) {
    for (const aspect of ASPECT_TYPES.filter(item => ['conjunction', 'square', 'opposition'].includes(item.key))) {
      const orb = Math.abs(angularDistance(marsDegree, Number(info.absolute_degree)) - aspect.angle)
      if (orb <= 1) {
        transitEvents.push({
          tier: 'tier_2',
          transit_planet: 'mars',
          transit_planet_zh: '火星',
          natal_body: outerPlanet,
          natal_body_zh: PLANET_LABELS_ZH[outerPlanet],
          aspect: aspect.key,
          aspect_zh: aspect.key_zh,
          orb: round(orb, 2),
          is_stationary_hit: false,
        })
      }
    }
  }

  const relocatedHouseData = isRelocated ? swe.houses(julianDayUT, input.currentLocation.latitude, input.currentLocation.longitude, 'P') : null
  const relocatedAngles = relocatedHouseData ? buildWesternAngles(relocatedHouseData) : null
  const relocatedWholeSignCusps =
    relocatedAngles !== null
      ? Array.from({ length: 12 }, (_, index) => normalizeDegree(Math.floor(relocatedAngles.asc.absolute_degree / 30) * 30 + index * 30))
      : []
  const relocatedPlanets = relocatedAngles
    ? Object.fromEntries(
        Object.entries(planetBase).map(([planetKey, value]) => {
          const base = value as AnyRecord
          const housePosition = swe.house_pos(
            relocatedHouseData.ascmc[2],
            input.currentLocation.latitude,
            trueObliquity,
            'P',
            base.absolute_degree,
            base.latitude,
          )
          return [planetKey, { house: toHouseIndex(housePosition) }]
        }),
      )
    : {}

  const house1Ruler = (houses.placidus['1']?.ruler as string) ?? 'venus'
  const house2Ruler = (houses.placidus['2']?.ruler as string) ?? null
  const house7Ruler = (houses.placidus['7']?.ruler as string) ?? null
  const house8Ruler = (houses.placidus['8']?.ruler as string) ?? null
  const house12Ruler = (houses.placidus['12']?.ruler as string) ?? null
  const mcRuler = (houses.placidus['10']?.ruler as string) ?? null
  const house10Planets = Object.entries(planets.placidus)
    .filter(([, planet]) => Number(planet?.house ?? null) === 10)
    .map(([planetKey]) => planetKey)

  function filterReadingAspects(targetKeys: string[]) {
    return aspects.filter(
      item => targetKeys.includes(String(item.planet_a)) || targetKeys.includes(String(item.planet_b)),
    )
  }

  const readingContexts = {
    personality: {
      theme: 'personality',
      house_system: 'placidus',
      focus_bodies: {
        sun: planets.placidus.sun,
        moon: planets.placidus.moon,
        asc: angles.asc,
        asc_ruler: house1Ruler ? planets.placidus[house1Ruler] : null,
      },
      focus_houses: {
        '1': houses.placidus['1'],
      },
      aspects: filterReadingAspects(['sun', 'moon', 'asc', house1Ruler].filter(Boolean) as string[]),
      patterns: cloneJson(patterns),
      chart_stats: cloneJson(chartStats),
      suggested_prompt:
        '你是一位精通古典占星與進化心理占星的資深占星師。\n避免宿命論，將困難相位解讀為成長課題。\n- absolute_degree：信任系統算出的相位，無需重算\n- dignity fall/detriment：需後天刻意練習的心理盲點\n- sun_relation combust：該星領域被自我意識主導\n- sun_relation cazimi：與核心自我深度整合的天賦\n- is_applying true：課題正在強烈發展中\n- sect nocturnal：土星強調內在結構，火星強調行動挑戰\n- null：未啟用，勿腦補\n輸出：1.核心驅動力 2.內在張力 3.進化建議',
    },
    career: {
      theme: 'career',
      house_system: 'placidus',
      focus_bodies: {
        mc: angles.mc,
        mc_ruler: mcRuler ? planets.placidus[mcRuler] : null,
        saturn: planets.placidus.saturn,
        jupiter: planets.placidus.jupiter,
        house_10_planets: Object.fromEntries(house10Planets.map(planetKey => [planetKey, planets.placidus[planetKey]])),
      },
      focus_houses: {
        '10': houses.placidus['10'],
      },
      aspects: filterReadingAspects(uniqueStrings(['mc', mcRuler, 'saturn', 'jupiter', ...house10Planets])),
      patterns: cloneJson(patterns),
      chart_stats: cloneJson(chartStats),
      suggested_prompt: '你是一位以古典占星與職涯策略見長的占星顧問。輸出：1.職涯天賦 2.決策風格 3.近年發展重點 4.可執行建議。',
    },
    love: {
      theme: 'love',
      house_system: 'placidus',
      focus_bodies: {
        venus: planets.placidus.venus,
        mars: planets.placidus.mars,
        moon: planets.placidus.moon,
        house_7_ruler: house7Ruler ? planets.placidus[house7Ruler] : null,
      },
      focus_houses: {
        '7': houses.placidus['7'],
      },
      aspects: filterReadingAspects(['venus', 'mars', 'moon', house7Ruler].filter(Boolean) as string[]),
      patterns: cloneJson(patterns),
      chart_stats: cloneJson(chartStats),
      suggested_prompt: '你是一位擅長親密關係與情感模式解讀的占星師。輸出：1.關係需求 2.互動盲點 3.吸引的伴侶型態 4.調整方向。',
    },
    wealth: {
      theme: 'wealth',
      house_system: 'placidus',
      focus_bodies: {
        jupiter: planets.placidus.jupiter,
        venus: planets.placidus.venus,
        house_2_ruler: house2Ruler ? planets.placidus[house2Ruler] : null,
        house_8_ruler: house8Ruler ? planets.placidus[house8Ruler] : null,
      },
      focus_houses: {
        '2': houses.placidus['2'],
        '8': houses.placidus['8'],
      },
      aspects: filterReadingAspects(['jupiter', 'venus', house2Ruler, house8Ruler].filter(Boolean) as string[]),
      patterns: cloneJson(patterns),
      chart_stats: cloneJson(chartStats),
      suggested_prompt: '你是一位聚焦資源、收入模型與風險管理的占星顧問。輸出：1.財務優勢 2.資源流動風格 3.風險點 4.配置建議。',
    },
    life_path: {
      theme: 'life_path',
      house_system: 'placidus',
      focus_bodies: {
        north_node: angles.north_node,
        saturn: planets.placidus.saturn,
        house_12_ruler: house12Ruler ? planets.placidus[house12Ruler] : null,
      },
      focus_houses: {
        '12': houses.placidus['12'],
      },
      aspects: filterReadingAspects(['north_node', 'saturn', house12Ruler].filter(Boolean) as string[]),
      patterns: cloneJson(patterns),
      chart_stats: cloneJson(chartStats),
      suggested_prompt: '你是一位擅長生命課題與長期成長路徑的占星師。輸出：1.核心課題 2.業力與責任 3.盲區提醒 4.修煉方向。',
    },
  }

  return {
    module: 'western',
    meta: {
      birth_datetime_local: formatBirthDatetimeLocal(input),
      birth_datetime_utc: birthUtcDate.toISOString().replace('.000', ''),
      timezone_name: resolveTimezoneName(input),
      utc_offset_at_birth: formatUtcOffset(input.timezoneOffset),
      dst_in_effect: input.dstInEffect,
      birth_location: {
        city: input.city,
        latitude: round(input.latitude, 2),
        longitude: round(input.longitude, 2),
      },
      current_location: {
        city: input.currentLocation.city,
        latitude: round(input.currentLocation.latitude, 2),
        longitude: round(input.currentLocation.longitude, 2),
      },
      is_relocated: isRelocated,
      house_system_primary: 'placidus',
      house_system_secondary: 'whole_sign',
      sect,
    },
    angles,
    planets,
    aspects,
    houses,
    patterns,
    chart_stats: chartStats,
    current_sky: {
      generated_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) + 'T00:00:00Z',
      note: '僅含外行星，有效期約一個月',
      planets: currentSkyPlanets,
      transit_events: transitEvents,
    },
    relocated: isRelocated
      ? {
          based_on: 'current_location',
          note: '行星星座位置相同，只重算宮位與四大尖軸',
          angles: relocatedAngles,
          houses: {
            placidus: relocatedHouseData
              ? buildHouseDictionary(
                  'placidus',
                  Array.from({ length: 12 }, (_, index) => relocatedHouseData.cusps[index + 1]),
                  relocatedPlanets as HousePlanetPlacementMap,
                )
              : {},
            whole_sign: relocatedAngles ? buildHouseDictionary('whole_sign', relocatedWholeSignCusps, wholeSignPlanetPlacements) : {},
          },
        }
      : null,
    reading_contexts: readingContexts,
    note: null,
  }
}
