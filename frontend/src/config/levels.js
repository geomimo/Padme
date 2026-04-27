export const LEVELS = [
  { min: 0,    name: 'Spark Rookie',          icon: '🔥' },
  { min: 200,  name: 'Bronze Committer',       icon: '🥉' },
  { min: 500,  name: 'Delta Writer',           icon: '📝' },
  { min: 1000, name: 'Streaming Practitioner', icon: '🌊' },
  { min: 2000, name: 'Lakehouse Architect',    icon: '🏛️' },
  { min: 4000, name: 'Databricks Master',      icon: '⚡' },
]

export function getLevelForXP(xp) {
  let level = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.min) level = l
  }
  return level
}

export function getNextLevel(xp) {
  for (const l of LEVELS) {
    if (xp < l.min) return l
  }
  return null
}

export function xpProgressToNextLevel(xp) {
  const current = getLevelForXP(xp)
  const next = getNextLevel(xp)
  if (!next) return 1
  return (xp - current.min) / (next.min - current.min)
}
