interface StreamingCursorProps {
  active?: boolean
}

export function StreamingCursor({ active = false }: StreamingCursorProps) {
  if (!active) return null

  return <span className="streaming-cursor" style={{ color: 'var(--accent-primary)' }} />
}
