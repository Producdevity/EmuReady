interface AuthorWithPossibleBans {
  userBans?: { id: string }[] | null
}

export function hasActiveBans(author: unknown): author is AuthorWithPossibleBans {
  if (!author || typeof author !== 'object') return false
  if (!('userBans' in author)) return false
  const bans = (author as AuthorWithPossibleBans).userBans
  return Array.isArray(bans) && bans.length > 0
}
