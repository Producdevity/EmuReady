function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export default sanitizeInput
