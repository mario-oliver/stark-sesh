#!/usr/bin/env node
// Scoped lint gate (issue 0007 — web consolidated-contract migration).
//
// Runs ESLint across the project, then fails ONLY if a file changed vs the baseline
// ref has a lint problem. This keeps this issue's lint gate from being blocked by
// pre-existing repo-wide lint debt outside its scope (the react-hooks / empty-interface
// errors in HistoryClient, RepCounter, DogPhoto, use-countdown, use-sprite-animation),
// while still proving the migration introduces no NEW lint problems.
//
// Usage: BASE=<git-ref> node scripts/scoped-lint.mjs   (or pass the ref as argv[1])
import { execSync } from 'node:child_process'
import path from 'node:path'

const BASE = process.env.BASE || process.argv[2]
if (!BASE) {
  console.error('scoped-lint: provide baseline ref via BASE env var or argv[1]')
  process.exit(2)
}

const gitLines = cmd => execSync(cmd).toString().split('\n').filter(Boolean)

const changed = new Set(
  [
    ...gitLines(`git diff --name-only --diff-filter=ACMR ${BASE} -- "*.ts" "*.tsx"`),
    ...gitLines('git ls-files --others --exclude-standard -- "*.ts" "*.tsx"')
  ].map(p => path.resolve(p))
)

if (changed.size === 0) {
  console.log('scoped-lint: no changed TS files vs baseline -> PASS')
  process.exit(0)
}

// eslint exits non-zero when problems exist anywhere; capture stdout either way.
let json
try {
  json = execSync('npx eslint . -f json', { maxBuffer: 64 * 1024 * 1024 }).toString()
} catch (e) {
  json = (e.stdout || '').toString()
}
if (!json.trim()) {
  console.error('scoped-lint: eslint produced no JSON output')
  process.exit(2)
}

const offenders = JSON.parse(json).filter(
  r => changed.has(r.filePath) && (r.errorCount > 0 || r.warningCount > 0)
)

if (offenders.length === 0) {
  console.log(`scoped-lint: 0 problems across ${changed.size} changed files -> PASS`)
  process.exit(0)
}

for (const o of offenders) {
  console.log(
    `${path.relative(process.cwd(), o.filePath)}: ${o.errorCount} errors, ${o.warningCount} warnings`
  )
  for (const m of o.messages) {
    console.log(`   ${m.line}:${m.column}  ${m.severity === 2 ? 'error' : 'warn'}  ${m.message}  ${m.ruleId ?? ''}`)
  }
}
process.exit(1)
