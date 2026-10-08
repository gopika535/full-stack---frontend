export default function Stars({ value = 0, onChange, size = 22 }) {
  return (
    <span className={`stars ${onChange ? 'stars-input' : ''}`} style={{ fontSize: size }} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className={n <= value ? 'on' : ''}
          onClick={onChange ? () => onChange(n) : undefined}
          disabled={!onChange}
          aria-label={`${n} star`}
        >★</button>
      ))}
    </span>
  )
}
