# epoch-core

A TypeScript library for computing structured astronomical and calendrical
chart data from birth coordinates.

Implements four independent calculation systems:

- **Four Pillars (八字)** — Stems, branches, ten-year cycles, and auxiliary stars
- **Zi Wei Dou Shu (紫微斗數)** — Palace positions and Sihua transformation chains
- **Western astrology** — Planets, houses (Placidus + Whole Sign), aspects, and transits
- **Jyotish** — Sidereal positions (Lahiri ayanamsa), nakshatras, and Vimshottari dasha

Each system returns a versioned, self-contained JSON module.
All four are aggregated into a single `ChartPayload` (schema v2.0.0).

No runtime dependencies on HTTP, DOM, or any framework.
Node.js ≥ 18.18.0.

## Install

```bash
npm install
```

## Usage

```ts
import { buildChartResponse } from 'epoch-core'

const result = await buildChartResponse({
  name: '王小明',
  gender: '男',
  year: 1990,
  month: 6,
  day: 15,
  hour: 10,
  minute: 30,
  hourIndex: 5,
  birthTimeUnknown: false,
  city: '台北',
  latitude: 25.033,
  longitude: 121.5654,
  timezoneOffset: 8,
  timezoneOffsetStandard: 8,
  timezoneName: 'Asia/Taipei',
  dstInEffect: false,
  currentLocation: {
    city: '台北',
    latitude: 25.033,
    longitude: 121.5654,
  },
})

result.chart   // ChartPayload — versioned JSON
result.prompt  // plain-text reading context
```

## API

### `buildChartResponse(input: ChartRequestInput): Promise<ChartResponse>`

Main entry point. Computes all four systems and returns the aggregated payload.

### Individual modules

```ts
import { buildBaziModule }    from 'epoch-core'  // Four Pillars
import { buildZiweiModule }   from 'epoch-core'  // Zi Wei Dou Shu
import { buildWesternModule } from 'epoch-core'  // Western astrology
import { buildJyotishPayload } from 'epoch-core' // Jyotish
```

### Utilities

```ts
import { calculateBazi }        from 'epoch-core'
import { calculateZiwei }       from 'epoch-core'
import { getSunSign }           from 'epoch-core'
import { calculateRectification } from 'epoch-core'
import { getHourIndexFromClock }  from 'epoch-core'
```

## Output schema

`ChartPayload` is versioned at `schema_version: "2.0.0"`.
Top-level keys: `profile`, `summary`, `bazi`, `ziwei`, `western`, `jyotish`,
`rectification`, `reading_contexts`, `provenance`.

## Computation libraries

| System | Library | License |
|--------|---------|---------|
| Four Pillars | `lunar-typescript` | MIT |
| Zi Wei Dou Shu | `iztro` | MIT |
| Western astrology | `swisseph-wasm` | GPL-3.0-or-later |
| Jyotish | `swisseph-wasm` | GPL-3.0-or-later |

## Verify

```bash
npm run verify
```

## License

GPL-3.0-or-later — see [LICENSE](./LICENSE).
