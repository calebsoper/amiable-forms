import get from './get'

export default name => ({ previous, current }) => {
  if (previous.meta !== current.meta) return true
  if (previous.fields[name] !== current.fields[name]) return true
  if (previous.values === current.values) return false
  const currValue = get(current.values, name)
  const prevValue = get(previous.values, name)
  const changed = currValue !== prevValue
  return changed
}
