function StatusMessage({ status }) {
  if (!status?.message) {
    return null
  }

  return (
    <p className={`status-message ${status.type || 'info'}`}>
      {status.message}
    </p>
  )
}

export default StatusMessage
