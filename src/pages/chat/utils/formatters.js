export function formatModelLabel(modelId) {
  if (!modelId) {
    return ''
  }

  return modelId
    .replace(/^gemini-/, '')
    .replace(/-latest$/, '')
    .replace(/-/g, ' ')
}

export function formatModelShortLabel(modelId) {
  const label = formatModelLabel(modelId)
  const compact = label
    .replace('flash lite', 'lite')
    .replace('flash', 'flash')
    .replace('preview', '')
    .trim()

  return compact.length > 10 ? compact.slice(0, 10).trim() : compact
}
