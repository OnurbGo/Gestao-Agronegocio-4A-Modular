function LampMark({ compact = false }) {
  return (
    <span className={`lamp-mark ${compact ? 'compact' : ''}`} aria-hidden="true">
      <span className="lamp-mark__bulb" />
      <span className="lamp-mark__base" />
    </span>
  )
}

export default LampMark
