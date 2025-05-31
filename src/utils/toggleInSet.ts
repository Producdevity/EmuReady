function toggleInSet<T>(set: Set<T>, item: T): Set<T> {
  const newSet = new Set(set)
  if (newSet.has(item)) {
    newSet.delete(item)
  } else {
    newSet.add(item)
  }
  return newSet
}

export default toggleInSet
