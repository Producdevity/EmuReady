/**
 * TypeScript helper types
 */

/**
 * Nullable type that can be either the type T or null
 */
export type Nullable<T> = T | null

/**
 * Utility type to extract the value type of an object
 */
export type ValueOf<T> = Required<T>[keyof T]

/**
 * Maybe type that can be either the type T, null, or undefined
 */
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

/**
 * Utility type to create a type that has all properties of T except those in U
 */
export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never }

/**
 * XOR type that allows either T or U, but not both
 * Useful for cases where you want to enforce that only one of the two types can be used
 */
export type XOR<T, U> = (T & Without<U, T>) | (U & Without<T, U>)
