/**
 * TypeScript helper types
 */

export type Nullable<T> = T | null

export type Maybe<T> = T | null | undefined

/**
 * Prettify complex types for better readability in IDEs
 * https://twitter.com/mattpocockuk/status/1622730173446557697
 * https://timdeschryver.dev/bits/pretty-typescript-types
 * https://www.totaltypescript.com/concepts/the-prettify-helper
 */
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
