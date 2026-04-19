import { readdir, rm } from 'fs/promises'
import path from 'path'

const projectRoot = process.cwd()
const exactTargets = new Set(['dist-verify', 'output'])
const prefixTargets = []

async function collectTargets() {
  const entries = await readdir(projectRoot, { withFileTypes: true })
  const targets = new Set(exactTargets)

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (prefixTargets.some(prefix => entry.name.startsWith(prefix))) {
      targets.add(entry.name)
    }
  }

  return [...targets]
}

async function clean() {
  const targets = await collectTargets()
  let removed = 0

  for (const target of targets) {
    const targetPath = path.join(projectRoot, target)
    await rm(targetPath, { recursive: true, force: true })
    console.log(`removed ${target}`)
    removed += 1
  }

  console.log(`cleanup finished (${removed} targets)`)
}

clean().catch(error => {
  console.error('cleanup failed', error)
  process.exitCode = 1
})
