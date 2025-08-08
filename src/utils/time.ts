/**
 * Type-safe time conversion utilities
 * Converts time units to milliseconds
 */

export const ms = {
  seconds: (n: number): number => n * 1000,
  minutes: (n: number): number => n * 60 * 1000,
  hours: (n: number): number => n * 60 * 60 * 1000,
  days: (n: number): number => n * 24 * 60 * 60 * 1000,
  weeks: (n: number): number => n * 7 * 24 * 60 * 60 * 1000,
} as const

// Commonly used time constants
export const TIME_CONSTANTS = {
  ONE_SECOND: ms.seconds(1),
  ONE_MINUTE: ms.minutes(1),
  FIVE_MINUTES: ms.minutes(5),
  TEN_MINUTES: ms.minutes(10),
  THIRTY_MINUTES: ms.minutes(30),
  ONE_HOUR: ms.hours(1),
  SIX_HOURS: ms.hours(6),
  TWELVE_HOURS: ms.hours(12),
  ONE_DAY: ms.days(1),
  ONE_WEEK: ms.weeks(1),
  ONE_MONTH: ms.days(30), // Approximate
  ONE_YEAR: ms.days(365), // Approximate
} as const
