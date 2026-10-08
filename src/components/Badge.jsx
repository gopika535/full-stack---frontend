export default function Badge({ tone = 'gray', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
