/*
 * Windows packaging wrapper for environments where directory renames are
 * blocked (electron-builder's toolset extraction renames ".tmp" dirs and
 * fails with EPERM). We pre-extract 7-Zip, NSIS and nsis-resources into
 * .cache/tools and point electron-builder at them via env overrides.
 *
 * Run `npm run dist:win` instead of `npx electron-builder` directly.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tools = path.join(root, '.cache', 'tools')

const required = {
  ELECTRON_BUILDER_7ZIP_PATH: ['7zip', 'bin', '7za.exe'],
  ELECTRON_BUILDER_NSIS_DIR: ['nsis'],
  ELECTRON_BUILDER_NSIS_RESOURCES_DIR: ['nsis-resources'],
}

const env = { ...process.env }
for (const [varName, parts] of Object.entries(required)) {
  const p = path.join(tools, ...parts)
  if (!fs.existsSync(p)) {
    console.error(`[dist:win] Missing tool: ${p}`)
    console.error('[dist:win] Extract the electron-builder toolset archives into .cache/tools first.')
    process.exit(1)
  }
  env[varName] = p
}

const result = spawnSync(
  'npx',
  ['electron-builder', '--win', '--x64', '--publish', 'never'],
  { cwd: root, env, stdio: 'inherit', shell: true },
)
process.exit(result.status ?? 1)
