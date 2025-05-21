import superjson from 'superjson'

/**
 * Sanitize data for client-side use by serializing and deserializing itss
 * @param input
 */
function sanitizeForClient<T>(input: T): T {
  const serialized = superjson.stringify(input)
  return superjson.parse<T>(serialized)
}

export default sanitizeForClient
