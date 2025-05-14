/**
 * Client
 **/

import * as runtime from './runtime/library.js'
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>

/**
 * Model User
 *
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Device
 *
 */
export type Device = $Result.DefaultSelection<Prisma.$DevicePayload>
/**
 * Model System
 *
 */
export type System = $Result.DefaultSelection<Prisma.$SystemPayload>
/**
 * Model Game
 *
 */
export type Game = $Result.DefaultSelection<Prisma.$GamePayload>
/**
 * Model Emulator
 *
 */
export type Emulator = $Result.DefaultSelection<Prisma.$EmulatorPayload>
/**
 * Model PerformanceScale
 *
 */
export type PerformanceScale =
  $Result.DefaultSelection<Prisma.$PerformanceScalePayload>
/**
 * Model Listing
 *
 */
export type Listing = $Result.DefaultSelection<Prisma.$ListingPayload>
/**
 * Model Vote
 *
 */
export type Vote = $Result.DefaultSelection<Prisma.$VotePayload>
/**
 * Model Comment
 *
 */
export type Comment = $Result.DefaultSelection<Prisma.$CommentPayload>
/**
 * Model ListingApproval
 *
 */
export type ListingApproval =
  $Result.DefaultSelection<Prisma.$ListingApprovalPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
    USER: 'USER'
    AUTHOR: 'AUTHOR'
    ADMIN: 'ADMIN'
    SUPER_ADMIN: 'SUPER_ADMIN'
  }

  export type Role = (typeof Role)[keyof typeof Role]

  export const ApprovalStatus: {
    PENDING: 'PENDING'
    APPROVED: 'APPROVED'
    REJECTED: 'REJECTED'
  }

  export type ApprovalStatus =
    (typeof ApprovalStatus)[keyof typeof ApprovalStatus]
}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type ApprovalStatus = $Enums.ApprovalStatus

export const ApprovalStatus: typeof $Enums.ApprovalStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions
    ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition>
      ? Prisma.GetEvents<ClientOptions['log']>
      : never
    : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

  /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(
    optionsArg?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>,
  )
  $on<V extends U>(
    eventType: V,
    callback: (
      event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent,
    ) => void,
  ): PrismaClient

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

  /**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Prisma.PrismaPromise<number>

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(
    query: string,
    ...values: any[]
  ): Prisma.PrismaPromise<number>

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Prisma.PrismaPromise<T>

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(
    query: string,
    ...values: any[]
  ): Prisma.PrismaPromise<T>

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(
    arg: [...P],
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(
    fn: (
      prisma: Omit<PrismaClient, runtime.ITXClientDenyList>,
    ) => $Utils.JsPromise<R>,
    options?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    },
  ): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<
    'extends',
    Prisma.TypeMapCb<ClientOptions>,
    ExtArgs,
    $Utils.Call<
      Prisma.TypeMapCb<ClientOptions>,
      {
        extArgs: ExtArgs
      }
    >
  >

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>

  /**
   * `prisma.device`: Exposes CRUD operations for the **Device** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Devices
   * const devices = await prisma.device.findMany()
   * ```
   */
  get device(): Prisma.DeviceDelegate<ExtArgs, ClientOptions>

  /**
   * `prisma.system`: Exposes CRUD operations for the **System** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Systems
   * const systems = await prisma.system.findMany()
   * ```
   */
  get system(): Prisma.SystemDelegate<ExtArgs, ClientOptions>

  /**
   * `prisma.game`: Exposes CRUD operations for the **Game** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Games
   * const games = await prisma.game.findMany()
   * ```
   */
  get game(): Prisma.GameDelegate<ExtArgs, ClientOptions>

  /**
   * `prisma.emulator`: Exposes CRUD operations for the **Emulator** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Emulators
   * const emulators = await prisma.emulator.findMany()
   * ```
   */
  get emulator(): Prisma.EmulatorDelegate<ExtArgs, ClientOptions>

  /**
   * `prisma.performanceScale`: Exposes CRUD operations for the **PerformanceScale** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more PerformanceScales
   * const performanceScales = await prisma.performanceScale.findMany()
   * ```
   */
  get performanceScale(): Prisma.PerformanceScaleDelegate<
    ExtArgs,
    ClientOptions
  >

  /**
   * `prisma.listing`: Exposes CRUD operations for the **Listing** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Listings
   * const listings = await prisma.listing.findMany()
   * ```
   */
  get listing(): Prisma.ListingDelegate<ExtArgs, ClientOptions>

  /**
   * `prisma.vote`: Exposes CRUD operations for the **Vote** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Votes
   * const votes = await prisma.vote.findMany()
   * ```
   */
  get vote(): Prisma.VoteDelegate<ExtArgs, ClientOptions>

  /**
   * `prisma.comment`: Exposes CRUD operations for the **Comment** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Comments
   * const comments = await prisma.comment.findMany()
   * ```
   */
  get comment(): Prisma.CommentDelegate<ExtArgs, ClientOptions>

  /**
   * `prisma.listingApproval`: Exposes CRUD operations for the **ListingApproval** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more ListingApprovals
   * const listingApprovals = await prisma.listingApproval.findMany()
   * ```
   */
  get listingApproval(): Prisma.ListingApprovalDelegate<ExtArgs, ClientOptions>
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
   * Extensions
   */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.7.0
   * Query Engine version: 3cff47a7f5d65c3ea74883f1d736e41d68ce91ed
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */

  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
     * Type of `Prisma.DbNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
     * Type of `Prisma.JsonNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
     * Type of `Prisma.AnyNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> =
    T extends PromiseLike<infer U> ? U : T

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<
    T extends (...args: any) => $Utils.JsPromise<any>,
  > = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P]
  }

  export type Enumerable<T> = T | Array<T>

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  }

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } & (T extends SelectAndInclude
    ? 'Please either choose `select` or `include`.'
    : T extends SelectAndOmit
      ? 'Please either choose `select` or `omit`.'
      : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } & K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never }

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> = T extends object
    ? U extends object
      ? (Without<T, U> & U) | (Without<U, T> & T)
      : U
    : T

  /**
   * Is T a Record?
   */
  type IsObject<T extends any> =
    T extends Array<any>
      ? False
      : T extends Date
        ? False
        : T extends Uint8Array
          ? False
          : T extends BigInt
            ? False
            : T extends object
              ? True
              : False

  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1,
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K]
  } & {}

  type _Merge<U extends object> = IntersectOf<
    Overwrite<
      U,
      {
        [K in keyof U]-?: At<U, K>
      }
    >
  >

  type Key = string | number | symbol
  type AtBasic<O extends object, K extends Key> = K extends keyof O
    ? O[K]
    : never
  type AtStrict<O extends object, K extends Key> = O[K & keyof O]
  type AtLoose<O extends object, K extends Key> = O extends unknown
    ? AtStrict<O, K>
    : never
  export type At<
    O extends object,
    K extends Key,
    strict extends Boolean = 1,
  > = {
    1: AtStrict<O, K>
    0: AtLoose<O, K>
  }[strict]

  export type ComputeRaw<A extends any> = A extends Function
    ? A
    : {
        [K in keyof A]: A[K]
      } & {}

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K]
  } & {}

  type _Record<K extends keyof any, T> = {
    [P in K]: T
  }

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
      ?
          | (K extends keyof O ? { [P in K]: O[P] } & O : O)
          | ({ [P in keyof O as P extends K ? P : never]-?: O[P] } & O)
      : never
  >

  type _Strict<U, _U = U> = U extends unknown
    ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>>
    : never

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
      ? 1
      : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B

  export const type: unique symbol

  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object
    ? {
        [P in keyof T]: P extends keyof O ? O[P] : never
      }
    : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>,
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<
            UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never
          >
        : never
      : {} extends FieldPaths<T[K]>
        ? never
        : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<
    T,
    K extends Enumerable<keyof T> | keyof T,
  > = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}`
    ? never
    : T

  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never
    ? never
    : FieldRef<Model, FieldType>

  export const ModelName: {
    User: 'User'
    Device: 'Device'
    System: 'System'
    Game: 'Game'
    Emulator: 'Emulator'
    PerformanceScale: 'PerformanceScale'
    Listing: 'Listing'
    Vote: 'Vote'
    Comment: 'Comment'
    ListingApproval: 'ListingApproval'
  }

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]

  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}>
    extends $Utils.Fn<
      { extArgs: $Extensions.InternalArgs },
      $Utils.Record<string, any>
    > {
    returns: Prisma.TypeMap<
      this['params']['extArgs'],
      ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}
    >
  }

  export type TypeMap<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps:
        | 'user'
        | 'device'
        | 'system'
        | 'game'
        | 'emulator'
        | 'performanceScale'
        | 'listing'
        | 'vote'
        | 'comment'
        | 'listingApproval'
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Device: {
        payload: Prisma.$DevicePayload<ExtArgs>
        fields: Prisma.DeviceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DeviceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DevicePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DeviceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DevicePayload>
          }
          findFirst: {
            args: Prisma.DeviceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DevicePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DeviceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DevicePayload>
          }
          findMany: {
            args: Prisma.DeviceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DevicePayload>[]
          }
          create: {
            args: Prisma.DeviceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DevicePayload>
          }
          createMany: {
            args: Prisma.DeviceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DeviceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DevicePayload>[]
          }
          delete: {
            args: Prisma.DeviceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DevicePayload>
          }
          update: {
            args: Prisma.DeviceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DevicePayload>
          }
          deleteMany: {
            args: Prisma.DeviceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DeviceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DeviceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DevicePayload>[]
          }
          upsert: {
            args: Prisma.DeviceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DevicePayload>
          }
          aggregate: {
            args: Prisma.DeviceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDevice>
          }
          groupBy: {
            args: Prisma.DeviceGroupByArgs<ExtArgs>
            result: $Utils.Optional<DeviceGroupByOutputType>[]
          }
          count: {
            args: Prisma.DeviceCountArgs<ExtArgs>
            result: $Utils.Optional<DeviceCountAggregateOutputType> | number
          }
        }
      }
      System: {
        payload: Prisma.$SystemPayload<ExtArgs>
        fields: Prisma.SystemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SystemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SystemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemPayload>
          }
          findFirst: {
            args: Prisma.SystemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SystemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemPayload>
          }
          findMany: {
            args: Prisma.SystemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemPayload>[]
          }
          create: {
            args: Prisma.SystemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemPayload>
          }
          createMany: {
            args: Prisma.SystemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SystemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemPayload>[]
          }
          delete: {
            args: Prisma.SystemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemPayload>
          }
          update: {
            args: Prisma.SystemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemPayload>
          }
          deleteMany: {
            args: Prisma.SystemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SystemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SystemUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemPayload>[]
          }
          upsert: {
            args: Prisma.SystemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SystemPayload>
          }
          aggregate: {
            args: Prisma.SystemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSystem>
          }
          groupBy: {
            args: Prisma.SystemGroupByArgs<ExtArgs>
            result: $Utils.Optional<SystemGroupByOutputType>[]
          }
          count: {
            args: Prisma.SystemCountArgs<ExtArgs>
            result: $Utils.Optional<SystemCountAggregateOutputType> | number
          }
        }
      }
      Game: {
        payload: Prisma.$GamePayload<ExtArgs>
        fields: Prisma.GameFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GameFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GameFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          findFirst: {
            args: Prisma.GameFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GameFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          findMany: {
            args: Prisma.GameFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>[]
          }
          create: {
            args: Prisma.GameCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          createMany: {
            args: Prisma.GameCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GameCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>[]
          }
          delete: {
            args: Prisma.GameDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          update: {
            args: Prisma.GameUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          deleteMany: {
            args: Prisma.GameDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GameUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GameUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>[]
          }
          upsert: {
            args: Prisma.GameUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GamePayload>
          }
          aggregate: {
            args: Prisma.GameAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGame>
          }
          groupBy: {
            args: Prisma.GameGroupByArgs<ExtArgs>
            result: $Utils.Optional<GameGroupByOutputType>[]
          }
          count: {
            args: Prisma.GameCountArgs<ExtArgs>
            result: $Utils.Optional<GameCountAggregateOutputType> | number
          }
        }
      }
      Emulator: {
        payload: Prisma.$EmulatorPayload<ExtArgs>
        fields: Prisma.EmulatorFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EmulatorFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmulatorPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EmulatorFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmulatorPayload>
          }
          findFirst: {
            args: Prisma.EmulatorFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmulatorPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EmulatorFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmulatorPayload>
          }
          findMany: {
            args: Prisma.EmulatorFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmulatorPayload>[]
          }
          create: {
            args: Prisma.EmulatorCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmulatorPayload>
          }
          createMany: {
            args: Prisma.EmulatorCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EmulatorCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmulatorPayload>[]
          }
          delete: {
            args: Prisma.EmulatorDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmulatorPayload>
          }
          update: {
            args: Prisma.EmulatorUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmulatorPayload>
          }
          deleteMany: {
            args: Prisma.EmulatorDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EmulatorUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EmulatorUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmulatorPayload>[]
          }
          upsert: {
            args: Prisma.EmulatorUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmulatorPayload>
          }
          aggregate: {
            args: Prisma.EmulatorAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEmulator>
          }
          groupBy: {
            args: Prisma.EmulatorGroupByArgs<ExtArgs>
            result: $Utils.Optional<EmulatorGroupByOutputType>[]
          }
          count: {
            args: Prisma.EmulatorCountArgs<ExtArgs>
            result: $Utils.Optional<EmulatorCountAggregateOutputType> | number
          }
        }
      }
      PerformanceScale: {
        payload: Prisma.$PerformanceScalePayload<ExtArgs>
        fields: Prisma.PerformanceScaleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PerformanceScaleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceScalePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PerformanceScaleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceScalePayload>
          }
          findFirst: {
            args: Prisma.PerformanceScaleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceScalePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PerformanceScaleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceScalePayload>
          }
          findMany: {
            args: Prisma.PerformanceScaleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceScalePayload>[]
          }
          create: {
            args: Prisma.PerformanceScaleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceScalePayload>
          }
          createMany: {
            args: Prisma.PerformanceScaleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PerformanceScaleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceScalePayload>[]
          }
          delete: {
            args: Prisma.PerformanceScaleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceScalePayload>
          }
          update: {
            args: Prisma.PerformanceScaleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceScalePayload>
          }
          deleteMany: {
            args: Prisma.PerformanceScaleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PerformanceScaleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PerformanceScaleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceScalePayload>[]
          }
          upsert: {
            args: Prisma.PerformanceScaleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceScalePayload>
          }
          aggregate: {
            args: Prisma.PerformanceScaleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePerformanceScale>
          }
          groupBy: {
            args: Prisma.PerformanceScaleGroupByArgs<ExtArgs>
            result: $Utils.Optional<PerformanceScaleGroupByOutputType>[]
          }
          count: {
            args: Prisma.PerformanceScaleCountArgs<ExtArgs>
            result:
              | $Utils.Optional<PerformanceScaleCountAggregateOutputType>
              | number
          }
        }
      }
      Listing: {
        payload: Prisma.$ListingPayload<ExtArgs>
        fields: Prisma.ListingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ListingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ListingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          findFirst: {
            args: Prisma.ListingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ListingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          findMany: {
            args: Prisma.ListingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>[]
          }
          create: {
            args: Prisma.ListingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          createMany: {
            args: Prisma.ListingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ListingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>[]
          }
          delete: {
            args: Prisma.ListingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          update: {
            args: Prisma.ListingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          deleteMany: {
            args: Prisma.ListingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ListingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ListingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>[]
          }
          upsert: {
            args: Prisma.ListingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingPayload>
          }
          aggregate: {
            args: Prisma.ListingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateListing>
          }
          groupBy: {
            args: Prisma.ListingGroupByArgs<ExtArgs>
            result: $Utils.Optional<ListingGroupByOutputType>[]
          }
          count: {
            args: Prisma.ListingCountArgs<ExtArgs>
            result: $Utils.Optional<ListingCountAggregateOutputType> | number
          }
        }
      }
      Vote: {
        payload: Prisma.$VotePayload<ExtArgs>
        fields: Prisma.VoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          findFirst: {
            args: Prisma.VoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          findMany: {
            args: Prisma.VoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>[]
          }
          create: {
            args: Prisma.VoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          createMany: {
            args: Prisma.VoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VoteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>[]
          }
          delete: {
            args: Prisma.VoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          update: {
            args: Prisma.VoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          deleteMany: {
            args: Prisma.VoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VoteUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>[]
          }
          upsert: {
            args: Prisma.VoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VotePayload>
          }
          aggregate: {
            args: Prisma.VoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVote>
          }
          groupBy: {
            args: Prisma.VoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<VoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.VoteCountArgs<ExtArgs>
            result: $Utils.Optional<VoteCountAggregateOutputType> | number
          }
        }
      }
      Comment: {
        payload: Prisma.$CommentPayload<ExtArgs>
        fields: Prisma.CommentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CommentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CommentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          findFirst: {
            args: Prisma.CommentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CommentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          findMany: {
            args: Prisma.CommentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>[]
          }
          create: {
            args: Prisma.CommentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          createMany: {
            args: Prisma.CommentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CommentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>[]
          }
          delete: {
            args: Prisma.CommentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          update: {
            args: Prisma.CommentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          deleteMany: {
            args: Prisma.CommentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CommentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CommentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>[]
          }
          upsert: {
            args: Prisma.CommentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          aggregate: {
            args: Prisma.CommentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateComment>
          }
          groupBy: {
            args: Prisma.CommentGroupByArgs<ExtArgs>
            result: $Utils.Optional<CommentGroupByOutputType>[]
          }
          count: {
            args: Prisma.CommentCountArgs<ExtArgs>
            result: $Utils.Optional<CommentCountAggregateOutputType> | number
          }
        }
      }
      ListingApproval: {
        payload: Prisma.$ListingApprovalPayload<ExtArgs>
        fields: Prisma.ListingApprovalFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ListingApprovalFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingApprovalPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ListingApprovalFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingApprovalPayload>
          }
          findFirst: {
            args: Prisma.ListingApprovalFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingApprovalPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ListingApprovalFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingApprovalPayload>
          }
          findMany: {
            args: Prisma.ListingApprovalFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingApprovalPayload>[]
          }
          create: {
            args: Prisma.ListingApprovalCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingApprovalPayload>
          }
          createMany: {
            args: Prisma.ListingApprovalCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ListingApprovalCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingApprovalPayload>[]
          }
          delete: {
            args: Prisma.ListingApprovalDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingApprovalPayload>
          }
          update: {
            args: Prisma.ListingApprovalUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingApprovalPayload>
          }
          deleteMany: {
            args: Prisma.ListingApprovalDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ListingApprovalUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ListingApprovalUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingApprovalPayload>[]
          }
          upsert: {
            args: Prisma.ListingApprovalUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ListingApprovalPayload>
          }
          aggregate: {
            args: Prisma.ListingApprovalAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateListingApproval>
          }
          groupBy: {
            args: Prisma.ListingApprovalGroupByArgs<ExtArgs>
            result: $Utils.Optional<ListingApprovalGroupByOutputType>[]
          }
          count: {
            args: Prisma.ListingApprovalCountArgs<ExtArgs>
            result:
              | $Utils.Optional<ListingApprovalCountAggregateOutputType>
              | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]]
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]]
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]]
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]]
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<
    'define',
    Prisma.TypeMapCb,
    $Extensions.DefaultArgs
  >
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    device?: DeviceOmit
    system?: SystemOmit
    game?: GameOmit
    emulator?: EmulatorOmit
    performanceScale?: PerformanceScaleOmit
    listing?: ListingOmit
    vote?: VoteOmit
    comment?: CommentOmit
    listingApproval?: ListingApprovalOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> =
    T extends LogDefinition
      ? T['emit'] extends 'event'
        ? T['level']
        : never
      : never
  export type GetEvents<T extends any> =
    T extends Array<LogLevel | LogDefinition>
      ?
          | GetLogType<T[0]>
          | GetLogType<T[1]>
          | GetLogType<T[2]>
          | GetLogType<T[3]>
      : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */

  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(
    log: Array<LogLevel | LogDefinition>,
  ): LogLevel | undefined

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<
    Prisma.DefaultPrismaClient,
    runtime.ITXClientDenyList
  >

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */

  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    listings: number
    votes: number
    comments: number
    approvalsGiven: number
  }

  export type UserCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listings?: boolean | UserCountOutputTypeCountListingsArgs
    votes?: boolean | UserCountOutputTypeCountVotesArgs
    comments?: boolean | UserCountOutputTypeCountCommentsArgs
    approvalsGiven?: boolean | UserCountOutputTypeCountApprovalsGivenArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountListingsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ListingWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountVotesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: VoteWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCommentsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CommentWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountApprovalsGivenArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ListingApprovalWhereInput
  }

  /**
   * Count Type DeviceCountOutputType
   */

  export type DeviceCountOutputType = {
    listings: number
  }

  export type DeviceCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listings?: boolean | DeviceCountOutputTypeCountListingsArgs
  }

  // Custom InputTypes
  /**
   * DeviceCountOutputType without action
   */
  export type DeviceCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the DeviceCountOutputType
     */
    select?: DeviceCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DeviceCountOutputType without action
   */
  export type DeviceCountOutputTypeCountListingsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ListingWhereInput
  }

  /**
   * Count Type SystemCountOutputType
   */

  export type SystemCountOutputType = {
    games: number
  }

  export type SystemCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    games?: boolean | SystemCountOutputTypeCountGamesArgs
  }

  // Custom InputTypes
  /**
   * SystemCountOutputType without action
   */
  export type SystemCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the SystemCountOutputType
     */
    select?: SystemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SystemCountOutputType without action
   */
  export type SystemCountOutputTypeCountGamesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: GameWhereInput
  }

  /**
   * Count Type GameCountOutputType
   */

  export type GameCountOutputType = {
    listings: number
  }

  export type GameCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listings?: boolean | GameCountOutputTypeCountListingsArgs
  }

  // Custom InputTypes
  /**
   * GameCountOutputType without action
   */
  export type GameCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the GameCountOutputType
     */
    select?: GameCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * GameCountOutputType without action
   */
  export type GameCountOutputTypeCountListingsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ListingWhereInput
  }

  /**
   * Count Type EmulatorCountOutputType
   */

  export type EmulatorCountOutputType = {
    listings: number
  }

  export type EmulatorCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listings?: boolean | EmulatorCountOutputTypeCountListingsArgs
  }

  // Custom InputTypes
  /**
   * EmulatorCountOutputType without action
   */
  export type EmulatorCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EmulatorCountOutputType
     */
    select?: EmulatorCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EmulatorCountOutputType without action
   */
  export type EmulatorCountOutputTypeCountListingsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ListingWhereInput
  }

  /**
   * Count Type PerformanceScaleCountOutputType
   */

  export type PerformanceScaleCountOutputType = {
    listings: number
  }

  export type PerformanceScaleCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listings?: boolean | PerformanceScaleCountOutputTypeCountListingsArgs
  }

  // Custom InputTypes
  /**
   * PerformanceScaleCountOutputType without action
   */
  export type PerformanceScaleCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScaleCountOutputType
     */
    select?: PerformanceScaleCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PerformanceScaleCountOutputType without action
   */
  export type PerformanceScaleCountOutputTypeCountListingsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ListingWhereInput
  }

  /**
   * Count Type ListingCountOutputType
   */

  export type ListingCountOutputType = {
    votes: number
    comments: number
    approvals: number
  }

  export type ListingCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    votes?: boolean | ListingCountOutputTypeCountVotesArgs
    comments?: boolean | ListingCountOutputTypeCountCommentsArgs
    approvals?: boolean | ListingCountOutputTypeCountApprovalsArgs
  }

  // Custom InputTypes
  /**
   * ListingCountOutputType without action
   */
  export type ListingCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingCountOutputType
     */
    select?: ListingCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ListingCountOutputType without action
   */
  export type ListingCountOutputTypeCountVotesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: VoteWhereInput
  }

  /**
   * ListingCountOutputType without action
   */
  export type ListingCountOutputTypeCountCommentsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CommentWhereInput
  }

  /**
   * ListingCountOutputType without action
   */
  export type ListingCountOutputTypeCountApprovalsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ListingApprovalWhereInput
  }

  /**
   * Count Type CommentCountOutputType
   */

  export type CommentCountOutputType = {
    replies: number
  }

  export type CommentCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    replies?: boolean | CommentCountOutputTypeCountRepliesArgs
  }

  // Custom InputTypes
  /**
   * CommentCountOutputType without action
   */
  export type CommentCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the CommentCountOutputType
     */
    select?: CommentCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CommentCountOutputType without action
   */
  export type CommentCountOutputTypeCountRepliesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CommentWhereInput
  }

  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    hashedPassword: string | null
    name: string | null
    profileImage: string | null
    role: $Enums.Role | null
    createdAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    hashedPassword: string | null
    name: string | null
    profileImage: string | null
    role: $Enums.Role | null
    createdAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    hashedPassword: number
    name: number
    profileImage: number
    role: number
    createdAt: number
    _all: number
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    hashedPassword?: true
    name?: true
    profileImage?: true
    role?: true
    createdAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    hashedPassword?: true
    name?: true
    profileImage?: true
    role?: true
    createdAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    hashedPassword?: true
    name?: true
    profileImage?: true
    role?: true
    createdAt?: true
    _all?: true
  }

  export type UserAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Users
     **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
    [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }

  export type UserGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: UserWhereInput
    orderBy?:
      | UserOrderByWithAggregationInput
      | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    hashedPassword: string
    name: string | null
    profileImage: string | null
    role: $Enums.Role
    createdAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> & {
        [P in keyof T & keyof UserGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], UserGroupByOutputType[P]>
          : GetScalarType<T[P], UserGroupByOutputType[P]>
      }
    >
  >

  export type UserSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      email?: boolean
      hashedPassword?: boolean
      name?: boolean
      profileImage?: boolean
      role?: boolean
      createdAt?: boolean
      listings?: boolean | User$listingsArgs<ExtArgs>
      votes?: boolean | User$votesArgs<ExtArgs>
      comments?: boolean | User$commentsArgs<ExtArgs>
      approvalsGiven?: boolean | User$approvalsGivenArgs<ExtArgs>
      _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['user']
  >

  export type UserSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      email?: boolean
      hashedPassword?: boolean
      name?: boolean
      profileImage?: boolean
      role?: boolean
      createdAt?: boolean
    },
    ExtArgs['result']['user']
  >

  export type UserSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      email?: boolean
      hashedPassword?: boolean
      name?: boolean
      profileImage?: boolean
      role?: boolean
      createdAt?: boolean
    },
    ExtArgs['result']['user']
  >

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    hashedPassword?: boolean
    name?: boolean
    profileImage?: boolean
    role?: boolean
    createdAt?: boolean
  }

  export type UserOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'email'
    | 'hashedPassword'
    | 'name'
    | 'profileImage'
    | 'role'
    | 'createdAt',
    ExtArgs['result']['user']
  >
  export type UserInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listings?: boolean | User$listingsArgs<ExtArgs>
    votes?: boolean | User$votesArgs<ExtArgs>
    comments?: boolean | User$commentsArgs<ExtArgs>
    approvalsGiven?: boolean | User$approvalsGivenArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {}
  export type UserIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {}

  export type $UserPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'User'
    objects: {
      listings: Prisma.$ListingPayload<ExtArgs>[]
      votes: Prisma.$VotePayload<ExtArgs>[]
      comments: Prisma.$CommentPayload<ExtArgs>[]
      approvalsGiven: Prisma.$ListingApprovalPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<
      {
        id: string
        email: string
        hashedPassword: string
        name: string | null
        profileImage: string | null
        role: $Enums.Role
        createdAt: Date
      },
      ExtArgs['result']['user']
    >
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> =
    $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: UserCountAggregateInputType | true
  }

  export interface UserDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['User']
      meta: { name: 'User' }
    }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(
      args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>,
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(
      args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(
      args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>,
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(
      args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     *
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     *
     */
    findMany<T extends UserFindManyArgs>(
      args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     *
     */
    create<T extends UserCreateArgs>(
      args: SelectSubset<T, UserCreateArgs<ExtArgs>>,
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends UserCreateManyArgs>(
      args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(
      args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     *
     */
    delete<T extends UserDeleteArgs>(
      args: SelectSubset<T, UserDeleteArgs<ExtArgs>>,
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends UserUpdateArgs>(
      args: SelectSubset<T, UserUpdateArgs<ExtArgs>>,
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends UserDeleteManyArgs>(
      args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends UserUpdateManyArgs>(
      args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(
      args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(
      args: SelectSubset<T, UserUpsertArgs<ExtArgs>>,
    ): Prisma__UserClient<
      $Result.GetResult<
        Prisma.$UserPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
     **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends UserAggregateArgs>(
      args: Subset<T, UserAggregateArgs>,
    ): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ]
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors
      ? GetUserGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>
    /**
     * Fields of the User model
     */
    readonly fields: UserFieldRefs
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise'
    listings<T extends User$listingsArgs<ExtArgs> = {}>(
      args?: Subset<T, User$listingsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ListingPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    votes<T extends User$votesArgs<ExtArgs> = {}>(
      args?: Subset<T, User$votesArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$VotePayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    comments<T extends User$commentsArgs<ExtArgs> = {}>(
      args?: Subset<T, User$commentsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$CommentPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    approvalsGiven<T extends User$approvalsGivenArgs<ExtArgs> = {}>(
      args?: Subset<T, User$approvalsGivenArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ListingApprovalPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }

  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<'User', 'String'>
    readonly email: FieldRef<'User', 'String'>
    readonly hashedPassword: FieldRef<'User', 'String'>
    readonly name: FieldRef<'User', 'String'>
    readonly profileImage: FieldRef<'User', 'String'>
    readonly role: FieldRef<'User', 'Role'>
    readonly createdAt: FieldRef<'User', 'DateTime'>
  }

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.listings
   */
  export type User$listingsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    where?: ListingWhereInput
    orderBy?:
      | ListingOrderByWithRelationInput
      | ListingOrderByWithRelationInput[]
    cursor?: ListingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ListingScalarFieldEnum | ListingScalarFieldEnum[]
  }

  /**
   * User.votes
   */
  export type User$votesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    where?: VoteWhereInput
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    cursor?: VoteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VoteScalarFieldEnum | VoteScalarFieldEnum[]
  }

  /**
   * User.comments
   */
  export type User$commentsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?:
      | CommentOrderByWithRelationInput
      | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * User.approvalsGiven
   */
  export type User$approvalsGivenArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
    where?: ListingApprovalWhereInput
    orderBy?:
      | ListingApprovalOrderByWithRelationInput
      | ListingApprovalOrderByWithRelationInput[]
    cursor?: ListingApprovalWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ListingApprovalScalarFieldEnum | ListingApprovalScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }

  /**
   * Model Device
   */

  export type AggregateDevice = {
    _count: DeviceCountAggregateOutputType | null
    _min: DeviceMinAggregateOutputType | null
    _max: DeviceMaxAggregateOutputType | null
  }

  export type DeviceMinAggregateOutputType = {
    id: string | null
    brand: string | null
    modelName: string | null
  }

  export type DeviceMaxAggregateOutputType = {
    id: string | null
    brand: string | null
    modelName: string | null
  }

  export type DeviceCountAggregateOutputType = {
    id: number
    brand: number
    modelName: number
    _all: number
  }

  export type DeviceMinAggregateInputType = {
    id?: true
    brand?: true
    modelName?: true
  }

  export type DeviceMaxAggregateInputType = {
    id?: true
    brand?: true
    modelName?: true
  }

  export type DeviceCountAggregateInputType = {
    id?: true
    brand?: true
    modelName?: true
    _all?: true
  }

  export type DeviceAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Device to aggregate.
     */
    where?: DeviceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Devices to fetch.
     */
    orderBy?: DeviceOrderByWithRelationInput | DeviceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: DeviceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Devices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Devices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Devices
     **/
    _count?: true | DeviceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: DeviceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: DeviceMaxAggregateInputType
  }

  export type GetDeviceAggregateType<T extends DeviceAggregateArgs> = {
    [P in keyof T & keyof AggregateDevice]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDevice[P]>
      : GetScalarType<T[P], AggregateDevice[P]>
  }

  export type DeviceGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: DeviceWhereInput
    orderBy?:
      | DeviceOrderByWithAggregationInput
      | DeviceOrderByWithAggregationInput[]
    by: DeviceScalarFieldEnum[] | DeviceScalarFieldEnum
    having?: DeviceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DeviceCountAggregateInputType | true
    _min?: DeviceMinAggregateInputType
    _max?: DeviceMaxAggregateInputType
  }

  export type DeviceGroupByOutputType = {
    id: string
    brand: string
    modelName: string
    _count: DeviceCountAggregateOutputType | null
    _min: DeviceMinAggregateOutputType | null
    _max: DeviceMaxAggregateOutputType | null
  }

  type GetDeviceGroupByPayload<T extends DeviceGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<DeviceGroupByOutputType, T['by']> & {
          [P in keyof T & keyof DeviceGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DeviceGroupByOutputType[P]>
            : GetScalarType<T[P], DeviceGroupByOutputType[P]>
        }
      >
    >

  export type DeviceSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      brand?: boolean
      modelName?: boolean
      listings?: boolean | Device$listingsArgs<ExtArgs>
      _count?: boolean | DeviceCountOutputTypeDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['device']
  >

  export type DeviceSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      brand?: boolean
      modelName?: boolean
    },
    ExtArgs['result']['device']
  >

  export type DeviceSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      brand?: boolean
      modelName?: boolean
    },
    ExtArgs['result']['device']
  >

  export type DeviceSelectScalar = {
    id?: boolean
    brand?: boolean
    modelName?: boolean
  }

  export type DeviceOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    'id' | 'brand' | 'modelName',
    ExtArgs['result']['device']
  >
  export type DeviceInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listings?: boolean | Device$listingsArgs<ExtArgs>
    _count?: boolean | DeviceCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DeviceIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {}
  export type DeviceIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {}

  export type $DevicePayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Device'
    objects: {
      listings: Prisma.$ListingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<
      {
        id: string
        brand: string
        modelName: string
      },
      ExtArgs['result']['device']
    >
    composites: {}
  }

  type DeviceGetPayload<
    S extends boolean | null | undefined | DeviceDefaultArgs,
  > = $Result.GetResult<Prisma.$DevicePayload, S>

  type DeviceCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<DeviceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: DeviceCountAggregateInputType | true
  }

  export interface DeviceDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Device']
      meta: { name: 'Device' }
    }
    /**
     * Find zero or one Device that matches the filter.
     * @param {DeviceFindUniqueArgs} args - Arguments to find a Device
     * @example
     * // Get one Device
     * const device = await prisma.device.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DeviceFindUniqueArgs>(
      args: SelectSubset<T, DeviceFindUniqueArgs<ExtArgs>>,
    ): Prisma__DeviceClient<
      $Result.GetResult<
        Prisma.$DevicePayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find one Device that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DeviceFindUniqueOrThrowArgs} args - Arguments to find a Device
     * @example
     * // Get one Device
     * const device = await prisma.device.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DeviceFindUniqueOrThrowArgs>(
      args: SelectSubset<T, DeviceFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__DeviceClient<
      $Result.GetResult<
        Prisma.$DevicePayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Device that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceFindFirstArgs} args - Arguments to find a Device
     * @example
     * // Get one Device
     * const device = await prisma.device.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DeviceFindFirstArgs>(
      args?: SelectSubset<T, DeviceFindFirstArgs<ExtArgs>>,
    ): Prisma__DeviceClient<
      $Result.GetResult<
        Prisma.$DevicePayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Device that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceFindFirstOrThrowArgs} args - Arguments to find a Device
     * @example
     * // Get one Device
     * const device = await prisma.device.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DeviceFindFirstOrThrowArgs>(
      args?: SelectSubset<T, DeviceFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__DeviceClient<
      $Result.GetResult<
        Prisma.$DevicePayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find zero or more Devices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Devices
     * const devices = await prisma.device.findMany()
     *
     * // Get first 10 Devices
     * const devices = await prisma.device.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const deviceWithIdOnly = await prisma.device.findMany({ select: { id: true } })
     *
     */
    findMany<T extends DeviceFindManyArgs>(
      args?: SelectSubset<T, DeviceFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$DevicePayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >

    /**
     * Create a Device.
     * @param {DeviceCreateArgs} args - Arguments to create a Device.
     * @example
     * // Create one Device
     * const Device = await prisma.device.create({
     *   data: {
     *     // ... data to create a Device
     *   }
     * })
     *
     */
    create<T extends DeviceCreateArgs>(
      args: SelectSubset<T, DeviceCreateArgs<ExtArgs>>,
    ): Prisma__DeviceClient<
      $Result.GetResult<
        Prisma.$DevicePayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Create many Devices.
     * @param {DeviceCreateManyArgs} args - Arguments to create many Devices.
     * @example
     * // Create many Devices
     * const device = await prisma.device.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends DeviceCreateManyArgs>(
      args?: SelectSubset<T, DeviceCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Devices and returns the data saved in the database.
     * @param {DeviceCreateManyAndReturnArgs} args - Arguments to create many Devices.
     * @example
     * // Create many Devices
     * const device = await prisma.device.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Devices and only return the `id`
     * const deviceWithIdOnly = await prisma.device.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends DeviceCreateManyAndReturnArgs>(
      args?: SelectSubset<T, DeviceCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$DevicePayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Delete a Device.
     * @param {DeviceDeleteArgs} args - Arguments to delete one Device.
     * @example
     * // Delete one Device
     * const Device = await prisma.device.delete({
     *   where: {
     *     // ... filter to delete one Device
     *   }
     * })
     *
     */
    delete<T extends DeviceDeleteArgs>(
      args: SelectSubset<T, DeviceDeleteArgs<ExtArgs>>,
    ): Prisma__DeviceClient<
      $Result.GetResult<
        Prisma.$DevicePayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Update one Device.
     * @param {DeviceUpdateArgs} args - Arguments to update one Device.
     * @example
     * // Update one Device
     * const device = await prisma.device.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends DeviceUpdateArgs>(
      args: SelectSubset<T, DeviceUpdateArgs<ExtArgs>>,
    ): Prisma__DeviceClient<
      $Result.GetResult<
        Prisma.$DevicePayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Delete zero or more Devices.
     * @param {DeviceDeleteManyArgs} args - Arguments to filter Devices to delete.
     * @example
     * // Delete a few Devices
     * const { count } = await prisma.device.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends DeviceDeleteManyArgs>(
      args?: SelectSubset<T, DeviceDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Devices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Devices
     * const device = await prisma.device.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends DeviceUpdateManyArgs>(
      args: SelectSubset<T, DeviceUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Devices and returns the data updated in the database.
     * @param {DeviceUpdateManyAndReturnArgs} args - Arguments to update many Devices.
     * @example
     * // Update many Devices
     * const device = await prisma.device.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Devices and only return the `id`
     * const deviceWithIdOnly = await prisma.device.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends DeviceUpdateManyAndReturnArgs>(
      args: SelectSubset<T, DeviceUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$DevicePayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Create or update one Device.
     * @param {DeviceUpsertArgs} args - Arguments to update or create a Device.
     * @example
     * // Update or create a Device
     * const device = await prisma.device.upsert({
     *   create: {
     *     // ... data to create a Device
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Device we want to update
     *   }
     * })
     */
    upsert<T extends DeviceUpsertArgs>(
      args: SelectSubset<T, DeviceUpsertArgs<ExtArgs>>,
    ): Prisma__DeviceClient<
      $Result.GetResult<
        Prisma.$DevicePayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Count the number of Devices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceCountArgs} args - Arguments to filter Devices to count.
     * @example
     * // Count the number of Devices
     * const count = await prisma.device.count({
     *   where: {
     *     // ... the filter for the Devices we want to count
     *   }
     * })
     **/
    count<T extends DeviceCountArgs>(
      args?: Subset<T, DeviceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DeviceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Device.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends DeviceAggregateArgs>(
      args: Subset<T, DeviceAggregateArgs>,
    ): Prisma.PrismaPromise<GetDeviceAggregateType<T>>

    /**
     * Group by Device.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DeviceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends DeviceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DeviceGroupByArgs['orderBy'] }
        : { orderBy?: DeviceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ]
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, DeviceGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors
      ? GetDeviceGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>
    /**
     * Fields of the Device model
     */
    readonly fields: DeviceFieldRefs
  }

  /**
   * The delegate class that acts as a "Promise-like" for Device.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DeviceClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise'
    listings<T extends Device$listingsArgs<ExtArgs> = {}>(
      args?: Subset<T, Device$listingsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ListingPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }

  /**
   * Fields of the Device model
   */
  interface DeviceFieldRefs {
    readonly id: FieldRef<'Device', 'String'>
    readonly brand: FieldRef<'Device', 'String'>
    readonly modelName: FieldRef<'Device', 'String'>
  }

  // Custom InputTypes
  /**
   * Device findUnique
   */
  export type DeviceFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceInclude<ExtArgs> | null
    /**
     * Filter, which Device to fetch.
     */
    where: DeviceWhereUniqueInput
  }

  /**
   * Device findUniqueOrThrow
   */
  export type DeviceFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceInclude<ExtArgs> | null
    /**
     * Filter, which Device to fetch.
     */
    where: DeviceWhereUniqueInput
  }

  /**
   * Device findFirst
   */
  export type DeviceFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceInclude<ExtArgs> | null
    /**
     * Filter, which Device to fetch.
     */
    where?: DeviceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Devices to fetch.
     */
    orderBy?: DeviceOrderByWithRelationInput | DeviceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Devices.
     */
    cursor?: DeviceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Devices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Devices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Devices.
     */
    distinct?: DeviceScalarFieldEnum | DeviceScalarFieldEnum[]
  }

  /**
   * Device findFirstOrThrow
   */
  export type DeviceFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceInclude<ExtArgs> | null
    /**
     * Filter, which Device to fetch.
     */
    where?: DeviceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Devices to fetch.
     */
    orderBy?: DeviceOrderByWithRelationInput | DeviceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Devices.
     */
    cursor?: DeviceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Devices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Devices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Devices.
     */
    distinct?: DeviceScalarFieldEnum | DeviceScalarFieldEnum[]
  }

  /**
   * Device findMany
   */
  export type DeviceFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceInclude<ExtArgs> | null
    /**
     * Filter, which Devices to fetch.
     */
    where?: DeviceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Devices to fetch.
     */
    orderBy?: DeviceOrderByWithRelationInput | DeviceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Devices.
     */
    cursor?: DeviceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Devices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Devices.
     */
    skip?: number
    distinct?: DeviceScalarFieldEnum | DeviceScalarFieldEnum[]
  }

  /**
   * Device create
   */
  export type DeviceCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceInclude<ExtArgs> | null
    /**
     * The data needed to create a Device.
     */
    data: XOR<DeviceCreateInput, DeviceUncheckedCreateInput>
  }

  /**
   * Device createMany
   */
  export type DeviceCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Devices.
     */
    data: DeviceCreateManyInput | DeviceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Device createManyAndReturn
   */
  export type DeviceCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * The data used to create many Devices.
     */
    data: DeviceCreateManyInput | DeviceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Device update
   */
  export type DeviceUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceInclude<ExtArgs> | null
    /**
     * The data needed to update a Device.
     */
    data: XOR<DeviceUpdateInput, DeviceUncheckedUpdateInput>
    /**
     * Choose, which Device to update.
     */
    where: DeviceWhereUniqueInput
  }

  /**
   * Device updateMany
   */
  export type DeviceUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Devices.
     */
    data: XOR<DeviceUpdateManyMutationInput, DeviceUncheckedUpdateManyInput>
    /**
     * Filter which Devices to update
     */
    where?: DeviceWhereInput
    /**
     * Limit how many Devices to update.
     */
    limit?: number
  }

  /**
   * Device updateManyAndReturn
   */
  export type DeviceUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * The data used to update Devices.
     */
    data: XOR<DeviceUpdateManyMutationInput, DeviceUncheckedUpdateManyInput>
    /**
     * Filter which Devices to update
     */
    where?: DeviceWhereInput
    /**
     * Limit how many Devices to update.
     */
    limit?: number
  }

  /**
   * Device upsert
   */
  export type DeviceUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceInclude<ExtArgs> | null
    /**
     * The filter to search for the Device to update in case it exists.
     */
    where: DeviceWhereUniqueInput
    /**
     * In case the Device found by the `where` argument doesn't exist, create a new Device with this data.
     */
    create: XOR<DeviceCreateInput, DeviceUncheckedCreateInput>
    /**
     * In case the Device was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DeviceUpdateInput, DeviceUncheckedUpdateInput>
  }

  /**
   * Device delete
   */
  export type DeviceDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceInclude<ExtArgs> | null
    /**
     * Filter which Device to delete.
     */
    where: DeviceWhereUniqueInput
  }

  /**
   * Device deleteMany
   */
  export type DeviceDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Devices to delete
     */
    where?: DeviceWhereInput
    /**
     * Limit how many Devices to delete.
     */
    limit?: number
  }

  /**
   * Device.listings
   */
  export type Device$listingsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    where?: ListingWhereInput
    orderBy?:
      | ListingOrderByWithRelationInput
      | ListingOrderByWithRelationInput[]
    cursor?: ListingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ListingScalarFieldEnum | ListingScalarFieldEnum[]
  }

  /**
   * Device without action
   */
  export type DeviceDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Device
     */
    select?: DeviceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Device
     */
    omit?: DeviceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DeviceInclude<ExtArgs> | null
  }

  /**
   * Model System
   */

  export type AggregateSystem = {
    _count: SystemCountAggregateOutputType | null
    _min: SystemMinAggregateOutputType | null
    _max: SystemMaxAggregateOutputType | null
  }

  export type SystemMinAggregateOutputType = {
    id: string | null
    name: string | null
  }

  export type SystemMaxAggregateOutputType = {
    id: string | null
    name: string | null
  }

  export type SystemCountAggregateOutputType = {
    id: number
    name: number
    _all: number
  }

  export type SystemMinAggregateInputType = {
    id?: true
    name?: true
  }

  export type SystemMaxAggregateInputType = {
    id?: true
    name?: true
  }

  export type SystemCountAggregateInputType = {
    id?: true
    name?: true
    _all?: true
  }

  export type SystemAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which System to aggregate.
     */
    where?: SystemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Systems to fetch.
     */
    orderBy?: SystemOrderByWithRelationInput | SystemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: SystemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Systems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Systems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Systems
     **/
    _count?: true | SystemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: SystemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: SystemMaxAggregateInputType
  }

  export type GetSystemAggregateType<T extends SystemAggregateArgs> = {
    [P in keyof T & keyof AggregateSystem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSystem[P]>
      : GetScalarType<T[P], AggregateSystem[P]>
  }

  export type SystemGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: SystemWhereInput
    orderBy?:
      | SystemOrderByWithAggregationInput
      | SystemOrderByWithAggregationInput[]
    by: SystemScalarFieldEnum[] | SystemScalarFieldEnum
    having?: SystemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SystemCountAggregateInputType | true
    _min?: SystemMinAggregateInputType
    _max?: SystemMaxAggregateInputType
  }

  export type SystemGroupByOutputType = {
    id: string
    name: string
    _count: SystemCountAggregateOutputType | null
    _min: SystemMinAggregateOutputType | null
    _max: SystemMaxAggregateOutputType | null
  }

  type GetSystemGroupByPayload<T extends SystemGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<SystemGroupByOutputType, T['by']> & {
          [P in keyof T & keyof SystemGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SystemGroupByOutputType[P]>
            : GetScalarType<T[P], SystemGroupByOutputType[P]>
        }
      >
    >

  export type SystemSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      name?: boolean
      games?: boolean | System$gamesArgs<ExtArgs>
      _count?: boolean | SystemCountOutputTypeDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['system']
  >

  export type SystemSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      name?: boolean
    },
    ExtArgs['result']['system']
  >

  export type SystemSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      name?: boolean
    },
    ExtArgs['result']['system']
  >

  export type SystemSelectScalar = {
    id?: boolean
    name?: boolean
  }

  export type SystemOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<'id' | 'name', ExtArgs['result']['system']>
  export type SystemInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    games?: boolean | System$gamesArgs<ExtArgs>
    _count?: boolean | SystemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SystemIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {}
  export type SystemIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {}

  export type $SystemPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'System'
    objects: {
      games: Prisma.$GamePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<
      {
        id: string
        name: string
      },
      ExtArgs['result']['system']
    >
    composites: {}
  }

  type SystemGetPayload<
    S extends boolean | null | undefined | SystemDefaultArgs,
  > = $Result.GetResult<Prisma.$SystemPayload, S>

  type SystemCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<SystemFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: SystemCountAggregateInputType | true
  }

  export interface SystemDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['System']
      meta: { name: 'System' }
    }
    /**
     * Find zero or one System that matches the filter.
     * @param {SystemFindUniqueArgs} args - Arguments to find a System
     * @example
     * // Get one System
     * const system = await prisma.system.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SystemFindUniqueArgs>(
      args: SelectSubset<T, SystemFindUniqueArgs<ExtArgs>>,
    ): Prisma__SystemClient<
      $Result.GetResult<
        Prisma.$SystemPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find one System that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SystemFindUniqueOrThrowArgs} args - Arguments to find a System
     * @example
     * // Get one System
     * const system = await prisma.system.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SystemFindUniqueOrThrowArgs>(
      args: SelectSubset<T, SystemFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__SystemClient<
      $Result.GetResult<
        Prisma.$SystemPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first System that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemFindFirstArgs} args - Arguments to find a System
     * @example
     * // Get one System
     * const system = await prisma.system.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SystemFindFirstArgs>(
      args?: SelectSubset<T, SystemFindFirstArgs<ExtArgs>>,
    ): Prisma__SystemClient<
      $Result.GetResult<
        Prisma.$SystemPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first System that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemFindFirstOrThrowArgs} args - Arguments to find a System
     * @example
     * // Get one System
     * const system = await prisma.system.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SystemFindFirstOrThrowArgs>(
      args?: SelectSubset<T, SystemFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__SystemClient<
      $Result.GetResult<
        Prisma.$SystemPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find zero or more Systems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Systems
     * const systems = await prisma.system.findMany()
     *
     * // Get first 10 Systems
     * const systems = await prisma.system.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const systemWithIdOnly = await prisma.system.findMany({ select: { id: true } })
     *
     */
    findMany<T extends SystemFindManyArgs>(
      args?: SelectSubset<T, SystemFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$SystemPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >

    /**
     * Create a System.
     * @param {SystemCreateArgs} args - Arguments to create a System.
     * @example
     * // Create one System
     * const System = await prisma.system.create({
     *   data: {
     *     // ... data to create a System
     *   }
     * })
     *
     */
    create<T extends SystemCreateArgs>(
      args: SelectSubset<T, SystemCreateArgs<ExtArgs>>,
    ): Prisma__SystemClient<
      $Result.GetResult<
        Prisma.$SystemPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Create many Systems.
     * @param {SystemCreateManyArgs} args - Arguments to create many Systems.
     * @example
     * // Create many Systems
     * const system = await prisma.system.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends SystemCreateManyArgs>(
      args?: SelectSubset<T, SystemCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Systems and returns the data saved in the database.
     * @param {SystemCreateManyAndReturnArgs} args - Arguments to create many Systems.
     * @example
     * // Create many Systems
     * const system = await prisma.system.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Systems and only return the `id`
     * const systemWithIdOnly = await prisma.system.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends SystemCreateManyAndReturnArgs>(
      args?: SelectSubset<T, SystemCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$SystemPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Delete a System.
     * @param {SystemDeleteArgs} args - Arguments to delete one System.
     * @example
     * // Delete one System
     * const System = await prisma.system.delete({
     *   where: {
     *     // ... filter to delete one System
     *   }
     * })
     *
     */
    delete<T extends SystemDeleteArgs>(
      args: SelectSubset<T, SystemDeleteArgs<ExtArgs>>,
    ): Prisma__SystemClient<
      $Result.GetResult<
        Prisma.$SystemPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Update one System.
     * @param {SystemUpdateArgs} args - Arguments to update one System.
     * @example
     * // Update one System
     * const system = await prisma.system.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends SystemUpdateArgs>(
      args: SelectSubset<T, SystemUpdateArgs<ExtArgs>>,
    ): Prisma__SystemClient<
      $Result.GetResult<
        Prisma.$SystemPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Delete zero or more Systems.
     * @param {SystemDeleteManyArgs} args - Arguments to filter Systems to delete.
     * @example
     * // Delete a few Systems
     * const { count } = await prisma.system.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends SystemDeleteManyArgs>(
      args?: SelectSubset<T, SystemDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Systems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Systems
     * const system = await prisma.system.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends SystemUpdateManyArgs>(
      args: SelectSubset<T, SystemUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Systems and returns the data updated in the database.
     * @param {SystemUpdateManyAndReturnArgs} args - Arguments to update many Systems.
     * @example
     * // Update many Systems
     * const system = await prisma.system.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Systems and only return the `id`
     * const systemWithIdOnly = await prisma.system.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends SystemUpdateManyAndReturnArgs>(
      args: SelectSubset<T, SystemUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$SystemPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Create or update one System.
     * @param {SystemUpsertArgs} args - Arguments to update or create a System.
     * @example
     * // Update or create a System
     * const system = await prisma.system.upsert({
     *   create: {
     *     // ... data to create a System
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the System we want to update
     *   }
     * })
     */
    upsert<T extends SystemUpsertArgs>(
      args: SelectSubset<T, SystemUpsertArgs<ExtArgs>>,
    ): Prisma__SystemClient<
      $Result.GetResult<
        Prisma.$SystemPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Count the number of Systems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemCountArgs} args - Arguments to filter Systems to count.
     * @example
     * // Count the number of Systems
     * const count = await prisma.system.count({
     *   where: {
     *     // ... the filter for the Systems we want to count
     *   }
     * })
     **/
    count<T extends SystemCountArgs>(
      args?: Subset<T, SystemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SystemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a System.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends SystemAggregateArgs>(
      args: Subset<T, SystemAggregateArgs>,
    ): Prisma.PrismaPromise<GetSystemAggregateType<T>>

    /**
     * Group by System.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SystemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends SystemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SystemGroupByArgs['orderBy'] }
        : { orderBy?: SystemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ]
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, SystemGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors
      ? GetSystemGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>
    /**
     * Fields of the System model
     */
    readonly fields: SystemFieldRefs
  }

  /**
   * The delegate class that acts as a "Promise-like" for System.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SystemClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise'
    games<T extends System$gamesArgs<ExtArgs> = {}>(
      args?: Subset<T, System$gamesArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$GamePayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }

  /**
   * Fields of the System model
   */
  interface SystemFieldRefs {
    readonly id: FieldRef<'System', 'String'>
    readonly name: FieldRef<'System', 'String'>
  }

  // Custom InputTypes
  /**
   * System findUnique
   */
  export type SystemFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SystemInclude<ExtArgs> | null
    /**
     * Filter, which System to fetch.
     */
    where: SystemWhereUniqueInput
  }

  /**
   * System findUniqueOrThrow
   */
  export type SystemFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SystemInclude<ExtArgs> | null
    /**
     * Filter, which System to fetch.
     */
    where: SystemWhereUniqueInput
  }

  /**
   * System findFirst
   */
  export type SystemFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SystemInclude<ExtArgs> | null
    /**
     * Filter, which System to fetch.
     */
    where?: SystemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Systems to fetch.
     */
    orderBy?: SystemOrderByWithRelationInput | SystemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Systems.
     */
    cursor?: SystemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Systems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Systems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Systems.
     */
    distinct?: SystemScalarFieldEnum | SystemScalarFieldEnum[]
  }

  /**
   * System findFirstOrThrow
   */
  export type SystemFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SystemInclude<ExtArgs> | null
    /**
     * Filter, which System to fetch.
     */
    where?: SystemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Systems to fetch.
     */
    orderBy?: SystemOrderByWithRelationInput | SystemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Systems.
     */
    cursor?: SystemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Systems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Systems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Systems.
     */
    distinct?: SystemScalarFieldEnum | SystemScalarFieldEnum[]
  }

  /**
   * System findMany
   */
  export type SystemFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SystemInclude<ExtArgs> | null
    /**
     * Filter, which Systems to fetch.
     */
    where?: SystemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Systems to fetch.
     */
    orderBy?: SystemOrderByWithRelationInput | SystemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Systems.
     */
    cursor?: SystemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Systems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Systems.
     */
    skip?: number
    distinct?: SystemScalarFieldEnum | SystemScalarFieldEnum[]
  }

  /**
   * System create
   */
  export type SystemCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SystemInclude<ExtArgs> | null
    /**
     * The data needed to create a System.
     */
    data: XOR<SystemCreateInput, SystemUncheckedCreateInput>
  }

  /**
   * System createMany
   */
  export type SystemCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Systems.
     */
    data: SystemCreateManyInput | SystemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * System createManyAndReturn
   */
  export type SystemCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * The data used to create many Systems.
     */
    data: SystemCreateManyInput | SystemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * System update
   */
  export type SystemUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SystemInclude<ExtArgs> | null
    /**
     * The data needed to update a System.
     */
    data: XOR<SystemUpdateInput, SystemUncheckedUpdateInput>
    /**
     * Choose, which System to update.
     */
    where: SystemWhereUniqueInput
  }

  /**
   * System updateMany
   */
  export type SystemUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Systems.
     */
    data: XOR<SystemUpdateManyMutationInput, SystemUncheckedUpdateManyInput>
    /**
     * Filter which Systems to update
     */
    where?: SystemWhereInput
    /**
     * Limit how many Systems to update.
     */
    limit?: number
  }

  /**
   * System updateManyAndReturn
   */
  export type SystemUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * The data used to update Systems.
     */
    data: XOR<SystemUpdateManyMutationInput, SystemUncheckedUpdateManyInput>
    /**
     * Filter which Systems to update
     */
    where?: SystemWhereInput
    /**
     * Limit how many Systems to update.
     */
    limit?: number
  }

  /**
   * System upsert
   */
  export type SystemUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SystemInclude<ExtArgs> | null
    /**
     * The filter to search for the System to update in case it exists.
     */
    where: SystemWhereUniqueInput
    /**
     * In case the System found by the `where` argument doesn't exist, create a new System with this data.
     */
    create: XOR<SystemCreateInput, SystemUncheckedCreateInput>
    /**
     * In case the System was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SystemUpdateInput, SystemUncheckedUpdateInput>
  }

  /**
   * System delete
   */
  export type SystemDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SystemInclude<ExtArgs> | null
    /**
     * Filter which System to delete.
     */
    where: SystemWhereUniqueInput
  }

  /**
   * System deleteMany
   */
  export type SystemDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Systems to delete
     */
    where?: SystemWhereInput
    /**
     * Limit how many Systems to delete.
     */
    limit?: number
  }

  /**
   * System.games
   */
  export type System$gamesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    where?: GameWhereInput
    orderBy?: GameOrderByWithRelationInput | GameOrderByWithRelationInput[]
    cursor?: GameWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GameScalarFieldEnum | GameScalarFieldEnum[]
  }

  /**
   * System without action
   */
  export type SystemDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the System
     */
    select?: SystemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the System
     */
    omit?: SystemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SystemInclude<ExtArgs> | null
  }

  /**
   * Model Game
   */

  export type AggregateGame = {
    _count: GameCountAggregateOutputType | null
    _min: GameMinAggregateOutputType | null
    _max: GameMaxAggregateOutputType | null
  }

  export type GameMinAggregateOutputType = {
    id: string | null
    title: string | null
    systemId: string | null
    imageUrl: string | null
  }

  export type GameMaxAggregateOutputType = {
    id: string | null
    title: string | null
    systemId: string | null
    imageUrl: string | null
  }

  export type GameCountAggregateOutputType = {
    id: number
    title: number
    systemId: number
    imageUrl: number
    _all: number
  }

  export type GameMinAggregateInputType = {
    id?: true
    title?: true
    systemId?: true
    imageUrl?: true
  }

  export type GameMaxAggregateInputType = {
    id?: true
    title?: true
    systemId?: true
    imageUrl?: true
  }

  export type GameCountAggregateInputType = {
    id?: true
    title?: true
    systemId?: true
    imageUrl?: true
    _all?: true
  }

  export type GameAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Game to aggregate.
     */
    where?: GameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Games to fetch.
     */
    orderBy?: GameOrderByWithRelationInput | GameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: GameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Games from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Games.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Games
     **/
    _count?: true | GameCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: GameMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: GameMaxAggregateInputType
  }

  export type GetGameAggregateType<T extends GameAggregateArgs> = {
    [P in keyof T & keyof AggregateGame]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGame[P]>
      : GetScalarType<T[P], AggregateGame[P]>
  }

  export type GameGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: GameWhereInput
    orderBy?:
      | GameOrderByWithAggregationInput
      | GameOrderByWithAggregationInput[]
    by: GameScalarFieldEnum[] | GameScalarFieldEnum
    having?: GameScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GameCountAggregateInputType | true
    _min?: GameMinAggregateInputType
    _max?: GameMaxAggregateInputType
  }

  export type GameGroupByOutputType = {
    id: string
    title: string
    systemId: string
    imageUrl: string | null
    _count: GameCountAggregateOutputType | null
    _min: GameMinAggregateOutputType | null
    _max: GameMaxAggregateOutputType | null
  }

  type GetGameGroupByPayload<T extends GameGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GameGroupByOutputType, T['by']> & {
        [P in keyof T & keyof GameGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], GameGroupByOutputType[P]>
          : GetScalarType<T[P], GameGroupByOutputType[P]>
      }
    >
  >

  export type GameSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      title?: boolean
      systemId?: boolean
      imageUrl?: boolean
      system?: boolean | SystemDefaultArgs<ExtArgs>
      listings?: boolean | Game$listingsArgs<ExtArgs>
      _count?: boolean | GameCountOutputTypeDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['game']
  >

  export type GameSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      title?: boolean
      systemId?: boolean
      imageUrl?: boolean
      system?: boolean | SystemDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['game']
  >

  export type GameSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      title?: boolean
      systemId?: boolean
      imageUrl?: boolean
      system?: boolean | SystemDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['game']
  >

  export type GameSelectScalar = {
    id?: boolean
    title?: boolean
    systemId?: boolean
    imageUrl?: boolean
  }

  export type GameOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    'id' | 'title' | 'systemId' | 'imageUrl',
    ExtArgs['result']['game']
  >
  export type GameInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    system?: boolean | SystemDefaultArgs<ExtArgs>
    listings?: boolean | Game$listingsArgs<ExtArgs>
    _count?: boolean | GameCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type GameIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    system?: boolean | SystemDefaultArgs<ExtArgs>
  }
  export type GameIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    system?: boolean | SystemDefaultArgs<ExtArgs>
  }

  export type $GamePayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Game'
    objects: {
      system: Prisma.$SystemPayload<ExtArgs>
      listings: Prisma.$ListingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<
      {
        id: string
        title: string
        systemId: string
        imageUrl: string | null
      },
      ExtArgs['result']['game']
    >
    composites: {}
  }

  type GameGetPayload<S extends boolean | null | undefined | GameDefaultArgs> =
    $Result.GetResult<Prisma.$GamePayload, S>

  type GameCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<GameFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: GameCountAggregateInputType | true
  }

  export interface GameDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Game']
      meta: { name: 'Game' }
    }
    /**
     * Find zero or one Game that matches the filter.
     * @param {GameFindUniqueArgs} args - Arguments to find a Game
     * @example
     * // Get one Game
     * const game = await prisma.game.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GameFindUniqueArgs>(
      args: SelectSubset<T, GameFindUniqueArgs<ExtArgs>>,
    ): Prisma__GameClient<
      $Result.GetResult<
        Prisma.$GamePayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find one Game that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GameFindUniqueOrThrowArgs} args - Arguments to find a Game
     * @example
     * // Get one Game
     * const game = await prisma.game.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GameFindUniqueOrThrowArgs>(
      args: SelectSubset<T, GameFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__GameClient<
      $Result.GetResult<
        Prisma.$GamePayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Game that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameFindFirstArgs} args - Arguments to find a Game
     * @example
     * // Get one Game
     * const game = await prisma.game.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GameFindFirstArgs>(
      args?: SelectSubset<T, GameFindFirstArgs<ExtArgs>>,
    ): Prisma__GameClient<
      $Result.GetResult<
        Prisma.$GamePayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Game that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameFindFirstOrThrowArgs} args - Arguments to find a Game
     * @example
     * // Get one Game
     * const game = await prisma.game.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GameFindFirstOrThrowArgs>(
      args?: SelectSubset<T, GameFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__GameClient<
      $Result.GetResult<
        Prisma.$GamePayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find zero or more Games that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Games
     * const games = await prisma.game.findMany()
     *
     * // Get first 10 Games
     * const games = await prisma.game.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const gameWithIdOnly = await prisma.game.findMany({ select: { id: true } })
     *
     */
    findMany<T extends GameFindManyArgs>(
      args?: SelectSubset<T, GameFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$GamePayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >

    /**
     * Create a Game.
     * @param {GameCreateArgs} args - Arguments to create a Game.
     * @example
     * // Create one Game
     * const Game = await prisma.game.create({
     *   data: {
     *     // ... data to create a Game
     *   }
     * })
     *
     */
    create<T extends GameCreateArgs>(
      args: SelectSubset<T, GameCreateArgs<ExtArgs>>,
    ): Prisma__GameClient<
      $Result.GetResult<
        Prisma.$GamePayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Create many Games.
     * @param {GameCreateManyArgs} args - Arguments to create many Games.
     * @example
     * // Create many Games
     * const game = await prisma.game.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends GameCreateManyArgs>(
      args?: SelectSubset<T, GameCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Games and returns the data saved in the database.
     * @param {GameCreateManyAndReturnArgs} args - Arguments to create many Games.
     * @example
     * // Create many Games
     * const game = await prisma.game.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Games and only return the `id`
     * const gameWithIdOnly = await prisma.game.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends GameCreateManyAndReturnArgs>(
      args?: SelectSubset<T, GameCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$GamePayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Delete a Game.
     * @param {GameDeleteArgs} args - Arguments to delete one Game.
     * @example
     * // Delete one Game
     * const Game = await prisma.game.delete({
     *   where: {
     *     // ... filter to delete one Game
     *   }
     * })
     *
     */
    delete<T extends GameDeleteArgs>(
      args: SelectSubset<T, GameDeleteArgs<ExtArgs>>,
    ): Prisma__GameClient<
      $Result.GetResult<
        Prisma.$GamePayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Update one Game.
     * @param {GameUpdateArgs} args - Arguments to update one Game.
     * @example
     * // Update one Game
     * const game = await prisma.game.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends GameUpdateArgs>(
      args: SelectSubset<T, GameUpdateArgs<ExtArgs>>,
    ): Prisma__GameClient<
      $Result.GetResult<
        Prisma.$GamePayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Delete zero or more Games.
     * @param {GameDeleteManyArgs} args - Arguments to filter Games to delete.
     * @example
     * // Delete a few Games
     * const { count } = await prisma.game.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends GameDeleteManyArgs>(
      args?: SelectSubset<T, GameDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Games.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Games
     * const game = await prisma.game.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends GameUpdateManyArgs>(
      args: SelectSubset<T, GameUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Games and returns the data updated in the database.
     * @param {GameUpdateManyAndReturnArgs} args - Arguments to update many Games.
     * @example
     * // Update many Games
     * const game = await prisma.game.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Games and only return the `id`
     * const gameWithIdOnly = await prisma.game.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends GameUpdateManyAndReturnArgs>(
      args: SelectSubset<T, GameUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$GamePayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Create or update one Game.
     * @param {GameUpsertArgs} args - Arguments to update or create a Game.
     * @example
     * // Update or create a Game
     * const game = await prisma.game.upsert({
     *   create: {
     *     // ... data to create a Game
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Game we want to update
     *   }
     * })
     */
    upsert<T extends GameUpsertArgs>(
      args: SelectSubset<T, GameUpsertArgs<ExtArgs>>,
    ): Prisma__GameClient<
      $Result.GetResult<
        Prisma.$GamePayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Count the number of Games.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameCountArgs} args - Arguments to filter Games to count.
     * @example
     * // Count the number of Games
     * const count = await prisma.game.count({
     *   where: {
     *     // ... the filter for the Games we want to count
     *   }
     * })
     **/
    count<T extends GameCountArgs>(
      args?: Subset<T, GameCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GameCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Game.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends GameAggregateArgs>(
      args: Subset<T, GameAggregateArgs>,
    ): Prisma.PrismaPromise<GetGameAggregateType<T>>

    /**
     * Group by Game.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GameGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends GameGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GameGroupByArgs['orderBy'] }
        : { orderBy?: GameGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ]
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, GameGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors
      ? GetGameGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>
    /**
     * Fields of the Game model
     */
    readonly fields: GameFieldRefs
  }

  /**
   * The delegate class that acts as a "Promise-like" for Game.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GameClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise'
    system<T extends SystemDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, SystemDefaultArgs<ExtArgs>>,
    ): Prisma__SystemClient<
      | $Result.GetResult<
          Prisma.$SystemPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    listings<T extends Game$listingsArgs<ExtArgs> = {}>(
      args?: Subset<T, Game$listingsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ListingPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }

  /**
   * Fields of the Game model
   */
  interface GameFieldRefs {
    readonly id: FieldRef<'Game', 'String'>
    readonly title: FieldRef<'Game', 'String'>
    readonly systemId: FieldRef<'Game', 'String'>
    readonly imageUrl: FieldRef<'Game', 'String'>
  }

  // Custom InputTypes
  /**
   * Game findUnique
   */
  export type GameFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter, which Game to fetch.
     */
    where: GameWhereUniqueInput
  }

  /**
   * Game findUniqueOrThrow
   */
  export type GameFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter, which Game to fetch.
     */
    where: GameWhereUniqueInput
  }

  /**
   * Game findFirst
   */
  export type GameFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter, which Game to fetch.
     */
    where?: GameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Games to fetch.
     */
    orderBy?: GameOrderByWithRelationInput | GameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Games.
     */
    cursor?: GameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Games from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Games.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Games.
     */
    distinct?: GameScalarFieldEnum | GameScalarFieldEnum[]
  }

  /**
   * Game findFirstOrThrow
   */
  export type GameFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter, which Game to fetch.
     */
    where?: GameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Games to fetch.
     */
    orderBy?: GameOrderByWithRelationInput | GameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Games.
     */
    cursor?: GameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Games from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Games.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Games.
     */
    distinct?: GameScalarFieldEnum | GameScalarFieldEnum[]
  }

  /**
   * Game findMany
   */
  export type GameFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter, which Games to fetch.
     */
    where?: GameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Games to fetch.
     */
    orderBy?: GameOrderByWithRelationInput | GameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Games.
     */
    cursor?: GameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Games from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Games.
     */
    skip?: number
    distinct?: GameScalarFieldEnum | GameScalarFieldEnum[]
  }

  /**
   * Game create
   */
  export type GameCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * The data needed to create a Game.
     */
    data: XOR<GameCreateInput, GameUncheckedCreateInput>
  }

  /**
   * Game createMany
   */
  export type GameCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Games.
     */
    data: GameCreateManyInput | GameCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Game createManyAndReturn
   */
  export type GameCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * The data used to create many Games.
     */
    data: GameCreateManyInput | GameCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Game update
   */
  export type GameUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * The data needed to update a Game.
     */
    data: XOR<GameUpdateInput, GameUncheckedUpdateInput>
    /**
     * Choose, which Game to update.
     */
    where: GameWhereUniqueInput
  }

  /**
   * Game updateMany
   */
  export type GameUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Games.
     */
    data: XOR<GameUpdateManyMutationInput, GameUncheckedUpdateManyInput>
    /**
     * Filter which Games to update
     */
    where?: GameWhereInput
    /**
     * Limit how many Games to update.
     */
    limit?: number
  }

  /**
   * Game updateManyAndReturn
   */
  export type GameUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * The data used to update Games.
     */
    data: XOR<GameUpdateManyMutationInput, GameUncheckedUpdateManyInput>
    /**
     * Filter which Games to update
     */
    where?: GameWhereInput
    /**
     * Limit how many Games to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Game upsert
   */
  export type GameUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * The filter to search for the Game to update in case it exists.
     */
    where: GameWhereUniqueInput
    /**
     * In case the Game found by the `where` argument doesn't exist, create a new Game with this data.
     */
    create: XOR<GameCreateInput, GameUncheckedCreateInput>
    /**
     * In case the Game was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GameUpdateInput, GameUncheckedUpdateInput>
  }

  /**
   * Game delete
   */
  export type GameDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
    /**
     * Filter which Game to delete.
     */
    where: GameWhereUniqueInput
  }

  /**
   * Game deleteMany
   */
  export type GameDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Games to delete
     */
    where?: GameWhereInput
    /**
     * Limit how many Games to delete.
     */
    limit?: number
  }

  /**
   * Game.listings
   */
  export type Game$listingsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    where?: ListingWhereInput
    orderBy?:
      | ListingOrderByWithRelationInput
      | ListingOrderByWithRelationInput[]
    cursor?: ListingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ListingScalarFieldEnum | ListingScalarFieldEnum[]
  }

  /**
   * Game without action
   */
  export type GameDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Game
     */
    select?: GameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Game
     */
    omit?: GameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GameInclude<ExtArgs> | null
  }

  /**
   * Model Emulator
   */

  export type AggregateEmulator = {
    _count: EmulatorCountAggregateOutputType | null
    _min: EmulatorMinAggregateOutputType | null
    _max: EmulatorMaxAggregateOutputType | null
  }

  export type EmulatorMinAggregateOutputType = {
    id: string | null
    name: string | null
  }

  export type EmulatorMaxAggregateOutputType = {
    id: string | null
    name: string | null
  }

  export type EmulatorCountAggregateOutputType = {
    id: number
    name: number
    _all: number
  }

  export type EmulatorMinAggregateInputType = {
    id?: true
    name?: true
  }

  export type EmulatorMaxAggregateInputType = {
    id?: true
    name?: true
  }

  export type EmulatorCountAggregateInputType = {
    id?: true
    name?: true
    _all?: true
  }

  export type EmulatorAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Emulator to aggregate.
     */
    where?: EmulatorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Emulators to fetch.
     */
    orderBy?:
      | EmulatorOrderByWithRelationInput
      | EmulatorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: EmulatorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Emulators from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Emulators.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Emulators
     **/
    _count?: true | EmulatorCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: EmulatorMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: EmulatorMaxAggregateInputType
  }

  export type GetEmulatorAggregateType<T extends EmulatorAggregateArgs> = {
    [P in keyof T & keyof AggregateEmulator]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEmulator[P]>
      : GetScalarType<T[P], AggregateEmulator[P]>
  }

  export type EmulatorGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EmulatorWhereInput
    orderBy?:
      | EmulatorOrderByWithAggregationInput
      | EmulatorOrderByWithAggregationInput[]
    by: EmulatorScalarFieldEnum[] | EmulatorScalarFieldEnum
    having?: EmulatorScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EmulatorCountAggregateInputType | true
    _min?: EmulatorMinAggregateInputType
    _max?: EmulatorMaxAggregateInputType
  }

  export type EmulatorGroupByOutputType = {
    id: string
    name: string
    _count: EmulatorCountAggregateOutputType | null
    _min: EmulatorMinAggregateOutputType | null
    _max: EmulatorMaxAggregateOutputType | null
  }

  type GetEmulatorGroupByPayload<T extends EmulatorGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<EmulatorGroupByOutputType, T['by']> & {
          [P in keyof T & keyof EmulatorGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EmulatorGroupByOutputType[P]>
            : GetScalarType<T[P], EmulatorGroupByOutputType[P]>
        }
      >
    >

  export type EmulatorSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      name?: boolean
      listings?: boolean | Emulator$listingsArgs<ExtArgs>
      _count?: boolean | EmulatorCountOutputTypeDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['emulator']
  >

  export type EmulatorSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      name?: boolean
    },
    ExtArgs['result']['emulator']
  >

  export type EmulatorSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      name?: boolean
    },
    ExtArgs['result']['emulator']
  >

  export type EmulatorSelectScalar = {
    id?: boolean
    name?: boolean
  }

  export type EmulatorOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<'id' | 'name', ExtArgs['result']['emulator']>
  export type EmulatorInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listings?: boolean | Emulator$listingsArgs<ExtArgs>
    _count?: boolean | EmulatorCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type EmulatorIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {}
  export type EmulatorIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {}

  export type $EmulatorPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Emulator'
    objects: {
      listings: Prisma.$ListingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<
      {
        id: string
        name: string
      },
      ExtArgs['result']['emulator']
    >
    composites: {}
  }

  type EmulatorGetPayload<
    S extends boolean | null | undefined | EmulatorDefaultArgs,
  > = $Result.GetResult<Prisma.$EmulatorPayload, S>

  type EmulatorCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<EmulatorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: EmulatorCountAggregateInputType | true
  }

  export interface EmulatorDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Emulator']
      meta: { name: 'Emulator' }
    }
    /**
     * Find zero or one Emulator that matches the filter.
     * @param {EmulatorFindUniqueArgs} args - Arguments to find a Emulator
     * @example
     * // Get one Emulator
     * const emulator = await prisma.emulator.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EmulatorFindUniqueArgs>(
      args: SelectSubset<T, EmulatorFindUniqueArgs<ExtArgs>>,
    ): Prisma__EmulatorClient<
      $Result.GetResult<
        Prisma.$EmulatorPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find one Emulator that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EmulatorFindUniqueOrThrowArgs} args - Arguments to find a Emulator
     * @example
     * // Get one Emulator
     * const emulator = await prisma.emulator.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EmulatorFindUniqueOrThrowArgs>(
      args: SelectSubset<T, EmulatorFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__EmulatorClient<
      $Result.GetResult<
        Prisma.$EmulatorPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Emulator that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmulatorFindFirstArgs} args - Arguments to find a Emulator
     * @example
     * // Get one Emulator
     * const emulator = await prisma.emulator.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EmulatorFindFirstArgs>(
      args?: SelectSubset<T, EmulatorFindFirstArgs<ExtArgs>>,
    ): Prisma__EmulatorClient<
      $Result.GetResult<
        Prisma.$EmulatorPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Emulator that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmulatorFindFirstOrThrowArgs} args - Arguments to find a Emulator
     * @example
     * // Get one Emulator
     * const emulator = await prisma.emulator.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EmulatorFindFirstOrThrowArgs>(
      args?: SelectSubset<T, EmulatorFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__EmulatorClient<
      $Result.GetResult<
        Prisma.$EmulatorPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find zero or more Emulators that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmulatorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Emulators
     * const emulators = await prisma.emulator.findMany()
     *
     * // Get first 10 Emulators
     * const emulators = await prisma.emulator.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const emulatorWithIdOnly = await prisma.emulator.findMany({ select: { id: true } })
     *
     */
    findMany<T extends EmulatorFindManyArgs>(
      args?: SelectSubset<T, EmulatorFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$EmulatorPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >

    /**
     * Create a Emulator.
     * @param {EmulatorCreateArgs} args - Arguments to create a Emulator.
     * @example
     * // Create one Emulator
     * const Emulator = await prisma.emulator.create({
     *   data: {
     *     // ... data to create a Emulator
     *   }
     * })
     *
     */
    create<T extends EmulatorCreateArgs>(
      args: SelectSubset<T, EmulatorCreateArgs<ExtArgs>>,
    ): Prisma__EmulatorClient<
      $Result.GetResult<
        Prisma.$EmulatorPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Create many Emulators.
     * @param {EmulatorCreateManyArgs} args - Arguments to create many Emulators.
     * @example
     * // Create many Emulators
     * const emulator = await prisma.emulator.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends EmulatorCreateManyArgs>(
      args?: SelectSubset<T, EmulatorCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Emulators and returns the data saved in the database.
     * @param {EmulatorCreateManyAndReturnArgs} args - Arguments to create many Emulators.
     * @example
     * // Create many Emulators
     * const emulator = await prisma.emulator.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Emulators and only return the `id`
     * const emulatorWithIdOnly = await prisma.emulator.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends EmulatorCreateManyAndReturnArgs>(
      args?: SelectSubset<T, EmulatorCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$EmulatorPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Delete a Emulator.
     * @param {EmulatorDeleteArgs} args - Arguments to delete one Emulator.
     * @example
     * // Delete one Emulator
     * const Emulator = await prisma.emulator.delete({
     *   where: {
     *     // ... filter to delete one Emulator
     *   }
     * })
     *
     */
    delete<T extends EmulatorDeleteArgs>(
      args: SelectSubset<T, EmulatorDeleteArgs<ExtArgs>>,
    ): Prisma__EmulatorClient<
      $Result.GetResult<
        Prisma.$EmulatorPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Update one Emulator.
     * @param {EmulatorUpdateArgs} args - Arguments to update one Emulator.
     * @example
     * // Update one Emulator
     * const emulator = await prisma.emulator.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends EmulatorUpdateArgs>(
      args: SelectSubset<T, EmulatorUpdateArgs<ExtArgs>>,
    ): Prisma__EmulatorClient<
      $Result.GetResult<
        Prisma.$EmulatorPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Delete zero or more Emulators.
     * @param {EmulatorDeleteManyArgs} args - Arguments to filter Emulators to delete.
     * @example
     * // Delete a few Emulators
     * const { count } = await prisma.emulator.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends EmulatorDeleteManyArgs>(
      args?: SelectSubset<T, EmulatorDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Emulators.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmulatorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Emulators
     * const emulator = await prisma.emulator.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends EmulatorUpdateManyArgs>(
      args: SelectSubset<T, EmulatorUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Emulators and returns the data updated in the database.
     * @param {EmulatorUpdateManyAndReturnArgs} args - Arguments to update many Emulators.
     * @example
     * // Update many Emulators
     * const emulator = await prisma.emulator.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Emulators and only return the `id`
     * const emulatorWithIdOnly = await prisma.emulator.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends EmulatorUpdateManyAndReturnArgs>(
      args: SelectSubset<T, EmulatorUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$EmulatorPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Create or update one Emulator.
     * @param {EmulatorUpsertArgs} args - Arguments to update or create a Emulator.
     * @example
     * // Update or create a Emulator
     * const emulator = await prisma.emulator.upsert({
     *   create: {
     *     // ... data to create a Emulator
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Emulator we want to update
     *   }
     * })
     */
    upsert<T extends EmulatorUpsertArgs>(
      args: SelectSubset<T, EmulatorUpsertArgs<ExtArgs>>,
    ): Prisma__EmulatorClient<
      $Result.GetResult<
        Prisma.$EmulatorPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Count the number of Emulators.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmulatorCountArgs} args - Arguments to filter Emulators to count.
     * @example
     * // Count the number of Emulators
     * const count = await prisma.emulator.count({
     *   where: {
     *     // ... the filter for the Emulators we want to count
     *   }
     * })
     **/
    count<T extends EmulatorCountArgs>(
      args?: Subset<T, EmulatorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EmulatorCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Emulator.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmulatorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends EmulatorAggregateArgs>(
      args: Subset<T, EmulatorAggregateArgs>,
    ): Prisma.PrismaPromise<GetEmulatorAggregateType<T>>

    /**
     * Group by Emulator.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmulatorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends EmulatorGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EmulatorGroupByArgs['orderBy'] }
        : { orderBy?: EmulatorGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ]
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, EmulatorGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetEmulatorGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>
    /**
     * Fields of the Emulator model
     */
    readonly fields: EmulatorFieldRefs
  }

  /**
   * The delegate class that acts as a "Promise-like" for Emulator.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EmulatorClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise'
    listings<T extends Emulator$listingsArgs<ExtArgs> = {}>(
      args?: Subset<T, Emulator$listingsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ListingPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }

  /**
   * Fields of the Emulator model
   */
  interface EmulatorFieldRefs {
    readonly id: FieldRef<'Emulator', 'String'>
    readonly name: FieldRef<'Emulator', 'String'>
  }

  // Custom InputTypes
  /**
   * Emulator findUnique
   */
  export type EmulatorFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmulatorInclude<ExtArgs> | null
    /**
     * Filter, which Emulator to fetch.
     */
    where: EmulatorWhereUniqueInput
  }

  /**
   * Emulator findUniqueOrThrow
   */
  export type EmulatorFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmulatorInclude<ExtArgs> | null
    /**
     * Filter, which Emulator to fetch.
     */
    where: EmulatorWhereUniqueInput
  }

  /**
   * Emulator findFirst
   */
  export type EmulatorFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmulatorInclude<ExtArgs> | null
    /**
     * Filter, which Emulator to fetch.
     */
    where?: EmulatorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Emulators to fetch.
     */
    orderBy?:
      | EmulatorOrderByWithRelationInput
      | EmulatorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Emulators.
     */
    cursor?: EmulatorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Emulators from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Emulators.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Emulators.
     */
    distinct?: EmulatorScalarFieldEnum | EmulatorScalarFieldEnum[]
  }

  /**
   * Emulator findFirstOrThrow
   */
  export type EmulatorFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmulatorInclude<ExtArgs> | null
    /**
     * Filter, which Emulator to fetch.
     */
    where?: EmulatorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Emulators to fetch.
     */
    orderBy?:
      | EmulatorOrderByWithRelationInput
      | EmulatorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Emulators.
     */
    cursor?: EmulatorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Emulators from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Emulators.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Emulators.
     */
    distinct?: EmulatorScalarFieldEnum | EmulatorScalarFieldEnum[]
  }

  /**
   * Emulator findMany
   */
  export type EmulatorFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmulatorInclude<ExtArgs> | null
    /**
     * Filter, which Emulators to fetch.
     */
    where?: EmulatorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Emulators to fetch.
     */
    orderBy?:
      | EmulatorOrderByWithRelationInput
      | EmulatorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Emulators.
     */
    cursor?: EmulatorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Emulators from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Emulators.
     */
    skip?: number
    distinct?: EmulatorScalarFieldEnum | EmulatorScalarFieldEnum[]
  }

  /**
   * Emulator create
   */
  export type EmulatorCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmulatorInclude<ExtArgs> | null
    /**
     * The data needed to create a Emulator.
     */
    data: XOR<EmulatorCreateInput, EmulatorUncheckedCreateInput>
  }

  /**
   * Emulator createMany
   */
  export type EmulatorCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Emulators.
     */
    data: EmulatorCreateManyInput | EmulatorCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Emulator createManyAndReturn
   */
  export type EmulatorCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * The data used to create many Emulators.
     */
    data: EmulatorCreateManyInput | EmulatorCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Emulator update
   */
  export type EmulatorUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmulatorInclude<ExtArgs> | null
    /**
     * The data needed to update a Emulator.
     */
    data: XOR<EmulatorUpdateInput, EmulatorUncheckedUpdateInput>
    /**
     * Choose, which Emulator to update.
     */
    where: EmulatorWhereUniqueInput
  }

  /**
   * Emulator updateMany
   */
  export type EmulatorUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Emulators.
     */
    data: XOR<EmulatorUpdateManyMutationInput, EmulatorUncheckedUpdateManyInput>
    /**
     * Filter which Emulators to update
     */
    where?: EmulatorWhereInput
    /**
     * Limit how many Emulators to update.
     */
    limit?: number
  }

  /**
   * Emulator updateManyAndReturn
   */
  export type EmulatorUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * The data used to update Emulators.
     */
    data: XOR<EmulatorUpdateManyMutationInput, EmulatorUncheckedUpdateManyInput>
    /**
     * Filter which Emulators to update
     */
    where?: EmulatorWhereInput
    /**
     * Limit how many Emulators to update.
     */
    limit?: number
  }

  /**
   * Emulator upsert
   */
  export type EmulatorUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmulatorInclude<ExtArgs> | null
    /**
     * The filter to search for the Emulator to update in case it exists.
     */
    where: EmulatorWhereUniqueInput
    /**
     * In case the Emulator found by the `where` argument doesn't exist, create a new Emulator with this data.
     */
    create: XOR<EmulatorCreateInput, EmulatorUncheckedCreateInput>
    /**
     * In case the Emulator was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EmulatorUpdateInput, EmulatorUncheckedUpdateInput>
  }

  /**
   * Emulator delete
   */
  export type EmulatorDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmulatorInclude<ExtArgs> | null
    /**
     * Filter which Emulator to delete.
     */
    where: EmulatorWhereUniqueInput
  }

  /**
   * Emulator deleteMany
   */
  export type EmulatorDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Emulators to delete
     */
    where?: EmulatorWhereInput
    /**
     * Limit how many Emulators to delete.
     */
    limit?: number
  }

  /**
   * Emulator.listings
   */
  export type Emulator$listingsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    where?: ListingWhereInput
    orderBy?:
      | ListingOrderByWithRelationInput
      | ListingOrderByWithRelationInput[]
    cursor?: ListingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ListingScalarFieldEnum | ListingScalarFieldEnum[]
  }

  /**
   * Emulator without action
   */
  export type EmulatorDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Emulator
     */
    select?: EmulatorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Emulator
     */
    omit?: EmulatorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmulatorInclude<ExtArgs> | null
  }

  /**
   * Model PerformanceScale
   */

  export type AggregatePerformanceScale = {
    _count: PerformanceScaleCountAggregateOutputType | null
    _avg: PerformanceScaleAvgAggregateOutputType | null
    _sum: PerformanceScaleSumAggregateOutputType | null
    _min: PerformanceScaleMinAggregateOutputType | null
    _max: PerformanceScaleMaxAggregateOutputType | null
  }

  export type PerformanceScaleAvgAggregateOutputType = {
    id: number | null
    rank: number | null
  }

  export type PerformanceScaleSumAggregateOutputType = {
    id: number | null
    rank: number | null
  }

  export type PerformanceScaleMinAggregateOutputType = {
    id: number | null
    label: string | null
    rank: number | null
  }

  export type PerformanceScaleMaxAggregateOutputType = {
    id: number | null
    label: string | null
    rank: number | null
  }

  export type PerformanceScaleCountAggregateOutputType = {
    id: number
    label: number
    rank: number
    _all: number
  }

  export type PerformanceScaleAvgAggregateInputType = {
    id?: true
    rank?: true
  }

  export type PerformanceScaleSumAggregateInputType = {
    id?: true
    rank?: true
  }

  export type PerformanceScaleMinAggregateInputType = {
    id?: true
    label?: true
    rank?: true
  }

  export type PerformanceScaleMaxAggregateInputType = {
    id?: true
    label?: true
    rank?: true
  }

  export type PerformanceScaleCountAggregateInputType = {
    id?: true
    label?: true
    rank?: true
    _all?: true
  }

  export type PerformanceScaleAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which PerformanceScale to aggregate.
     */
    where?: PerformanceScaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PerformanceScales to fetch.
     */
    orderBy?:
      | PerformanceScaleOrderByWithRelationInput
      | PerformanceScaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: PerformanceScaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PerformanceScales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PerformanceScales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned PerformanceScales
     **/
    _count?: true | PerformanceScaleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: PerformanceScaleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: PerformanceScaleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: PerformanceScaleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: PerformanceScaleMaxAggregateInputType
  }

  export type GetPerformanceScaleAggregateType<
    T extends PerformanceScaleAggregateArgs,
  > = {
    [P in keyof T & keyof AggregatePerformanceScale]: P extends
      | '_count'
      | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePerformanceScale[P]>
      : GetScalarType<T[P], AggregatePerformanceScale[P]>
  }

  export type PerformanceScaleGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: PerformanceScaleWhereInput
    orderBy?:
      | PerformanceScaleOrderByWithAggregationInput
      | PerformanceScaleOrderByWithAggregationInput[]
    by: PerformanceScaleScalarFieldEnum[] | PerformanceScaleScalarFieldEnum
    having?: PerformanceScaleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PerformanceScaleCountAggregateInputType | true
    _avg?: PerformanceScaleAvgAggregateInputType
    _sum?: PerformanceScaleSumAggregateInputType
    _min?: PerformanceScaleMinAggregateInputType
    _max?: PerformanceScaleMaxAggregateInputType
  }

  export type PerformanceScaleGroupByOutputType = {
    id: number
    label: string
    rank: number
    _count: PerformanceScaleCountAggregateOutputType | null
    _avg: PerformanceScaleAvgAggregateOutputType | null
    _sum: PerformanceScaleSumAggregateOutputType | null
    _min: PerformanceScaleMinAggregateOutputType | null
    _max: PerformanceScaleMaxAggregateOutputType | null
  }

  type GetPerformanceScaleGroupByPayload<
    T extends PerformanceScaleGroupByArgs,
  > = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PerformanceScaleGroupByOutputType, T['by']> & {
        [P in keyof T &
          keyof PerformanceScaleGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], PerformanceScaleGroupByOutputType[P]>
          : GetScalarType<T[P], PerformanceScaleGroupByOutputType[P]>
      }
    >
  >

  export type PerformanceScaleSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      label?: boolean
      rank?: boolean
      listings?: boolean | PerformanceScale$listingsArgs<ExtArgs>
      _count?: boolean | PerformanceScaleCountOutputTypeDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['performanceScale']
  >

  export type PerformanceScaleSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      label?: boolean
      rank?: boolean
    },
    ExtArgs['result']['performanceScale']
  >

  export type PerformanceScaleSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      label?: boolean
      rank?: boolean
    },
    ExtArgs['result']['performanceScale']
  >

  export type PerformanceScaleSelectScalar = {
    id?: boolean
    label?: boolean
    rank?: boolean
  }

  export type PerformanceScaleOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    'id' | 'label' | 'rank',
    ExtArgs['result']['performanceScale']
  >
  export type PerformanceScaleInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listings?: boolean | PerformanceScale$listingsArgs<ExtArgs>
    _count?: boolean | PerformanceScaleCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PerformanceScaleIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {}
  export type PerformanceScaleIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {}

  export type $PerformanceScalePayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'PerformanceScale'
    objects: {
      listings: Prisma.$ListingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<
      {
        id: number
        label: string
        rank: number
      },
      ExtArgs['result']['performanceScale']
    >
    composites: {}
  }

  type PerformanceScaleGetPayload<
    S extends boolean | null | undefined | PerformanceScaleDefaultArgs,
  > = $Result.GetResult<Prisma.$PerformanceScalePayload, S>

  type PerformanceScaleCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    PerformanceScaleFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: PerformanceScaleCountAggregateInputType | true
  }

  export interface PerformanceScaleDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['PerformanceScale']
      meta: { name: 'PerformanceScale' }
    }
    /**
     * Find zero or one PerformanceScale that matches the filter.
     * @param {PerformanceScaleFindUniqueArgs} args - Arguments to find a PerformanceScale
     * @example
     * // Get one PerformanceScale
     * const performanceScale = await prisma.performanceScale.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PerformanceScaleFindUniqueArgs>(
      args: SelectSubset<T, PerformanceScaleFindUniqueArgs<ExtArgs>>,
    ): Prisma__PerformanceScaleClient<
      $Result.GetResult<
        Prisma.$PerformanceScalePayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find one PerformanceScale that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PerformanceScaleFindUniqueOrThrowArgs} args - Arguments to find a PerformanceScale
     * @example
     * // Get one PerformanceScale
     * const performanceScale = await prisma.performanceScale.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PerformanceScaleFindUniqueOrThrowArgs>(
      args: SelectSubset<T, PerformanceScaleFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__PerformanceScaleClient<
      $Result.GetResult<
        Prisma.$PerformanceScalePayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first PerformanceScale that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceScaleFindFirstArgs} args - Arguments to find a PerformanceScale
     * @example
     * // Get one PerformanceScale
     * const performanceScale = await prisma.performanceScale.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PerformanceScaleFindFirstArgs>(
      args?: SelectSubset<T, PerformanceScaleFindFirstArgs<ExtArgs>>,
    ): Prisma__PerformanceScaleClient<
      $Result.GetResult<
        Prisma.$PerformanceScalePayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first PerformanceScale that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceScaleFindFirstOrThrowArgs} args - Arguments to find a PerformanceScale
     * @example
     * // Get one PerformanceScale
     * const performanceScale = await prisma.performanceScale.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PerformanceScaleFindFirstOrThrowArgs>(
      args?: SelectSubset<T, PerformanceScaleFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__PerformanceScaleClient<
      $Result.GetResult<
        Prisma.$PerformanceScalePayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find zero or more PerformanceScales that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceScaleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PerformanceScales
     * const performanceScales = await prisma.performanceScale.findMany()
     *
     * // Get first 10 PerformanceScales
     * const performanceScales = await prisma.performanceScale.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const performanceScaleWithIdOnly = await prisma.performanceScale.findMany({ select: { id: true } })
     *
     */
    findMany<T extends PerformanceScaleFindManyArgs>(
      args?: SelectSubset<T, PerformanceScaleFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$PerformanceScalePayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >

    /**
     * Create a PerformanceScale.
     * @param {PerformanceScaleCreateArgs} args - Arguments to create a PerformanceScale.
     * @example
     * // Create one PerformanceScale
     * const PerformanceScale = await prisma.performanceScale.create({
     *   data: {
     *     // ... data to create a PerformanceScale
     *   }
     * })
     *
     */
    create<T extends PerformanceScaleCreateArgs>(
      args: SelectSubset<T, PerformanceScaleCreateArgs<ExtArgs>>,
    ): Prisma__PerformanceScaleClient<
      $Result.GetResult<
        Prisma.$PerformanceScalePayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Create many PerformanceScales.
     * @param {PerformanceScaleCreateManyArgs} args - Arguments to create many PerformanceScales.
     * @example
     * // Create many PerformanceScales
     * const performanceScale = await prisma.performanceScale.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PerformanceScaleCreateManyArgs>(
      args?: SelectSubset<T, PerformanceScaleCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PerformanceScales and returns the data saved in the database.
     * @param {PerformanceScaleCreateManyAndReturnArgs} args - Arguments to create many PerformanceScales.
     * @example
     * // Create many PerformanceScales
     * const performanceScale = await prisma.performanceScale.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many PerformanceScales and only return the `id`
     * const performanceScaleWithIdOnly = await prisma.performanceScale.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends PerformanceScaleCreateManyAndReturnArgs>(
      args?: SelectSubset<T, PerformanceScaleCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$PerformanceScalePayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Delete a PerformanceScale.
     * @param {PerformanceScaleDeleteArgs} args - Arguments to delete one PerformanceScale.
     * @example
     * // Delete one PerformanceScale
     * const PerformanceScale = await prisma.performanceScale.delete({
     *   where: {
     *     // ... filter to delete one PerformanceScale
     *   }
     * })
     *
     */
    delete<T extends PerformanceScaleDeleteArgs>(
      args: SelectSubset<T, PerformanceScaleDeleteArgs<ExtArgs>>,
    ): Prisma__PerformanceScaleClient<
      $Result.GetResult<
        Prisma.$PerformanceScalePayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Update one PerformanceScale.
     * @param {PerformanceScaleUpdateArgs} args - Arguments to update one PerformanceScale.
     * @example
     * // Update one PerformanceScale
     * const performanceScale = await prisma.performanceScale.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PerformanceScaleUpdateArgs>(
      args: SelectSubset<T, PerformanceScaleUpdateArgs<ExtArgs>>,
    ): Prisma__PerformanceScaleClient<
      $Result.GetResult<
        Prisma.$PerformanceScalePayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Delete zero or more PerformanceScales.
     * @param {PerformanceScaleDeleteManyArgs} args - Arguments to filter PerformanceScales to delete.
     * @example
     * // Delete a few PerformanceScales
     * const { count } = await prisma.performanceScale.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PerformanceScaleDeleteManyArgs>(
      args?: SelectSubset<T, PerformanceScaleDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PerformanceScales.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceScaleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PerformanceScales
     * const performanceScale = await prisma.performanceScale.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PerformanceScaleUpdateManyArgs>(
      args: SelectSubset<T, PerformanceScaleUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PerformanceScales and returns the data updated in the database.
     * @param {PerformanceScaleUpdateManyAndReturnArgs} args - Arguments to update many PerformanceScales.
     * @example
     * // Update many PerformanceScales
     * const performanceScale = await prisma.performanceScale.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more PerformanceScales and only return the `id`
     * const performanceScaleWithIdOnly = await prisma.performanceScale.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends PerformanceScaleUpdateManyAndReturnArgs>(
      args: SelectSubset<T, PerformanceScaleUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$PerformanceScalePayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Create or update one PerformanceScale.
     * @param {PerformanceScaleUpsertArgs} args - Arguments to update or create a PerformanceScale.
     * @example
     * // Update or create a PerformanceScale
     * const performanceScale = await prisma.performanceScale.upsert({
     *   create: {
     *     // ... data to create a PerformanceScale
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PerformanceScale we want to update
     *   }
     * })
     */
    upsert<T extends PerformanceScaleUpsertArgs>(
      args: SelectSubset<T, PerformanceScaleUpsertArgs<ExtArgs>>,
    ): Prisma__PerformanceScaleClient<
      $Result.GetResult<
        Prisma.$PerformanceScalePayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Count the number of PerformanceScales.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceScaleCountArgs} args - Arguments to filter PerformanceScales to count.
     * @example
     * // Count the number of PerformanceScales
     * const count = await prisma.performanceScale.count({
     *   where: {
     *     // ... the filter for the PerformanceScales we want to count
     *   }
     * })
     **/
    count<T extends PerformanceScaleCountArgs>(
      args?: Subset<T, PerformanceScaleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PerformanceScaleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PerformanceScale.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceScaleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends PerformanceScaleAggregateArgs>(
      args: Subset<T, PerformanceScaleAggregateArgs>,
    ): Prisma.PrismaPromise<GetPerformanceScaleAggregateType<T>>

    /**
     * Group by PerformanceScale.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceScaleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends PerformanceScaleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PerformanceScaleGroupByArgs['orderBy'] }
        : { orderBy?: PerformanceScaleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ]
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, PerformanceScaleGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetPerformanceScaleGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>
    /**
     * Fields of the PerformanceScale model
     */
    readonly fields: PerformanceScaleFieldRefs
  }

  /**
   * The delegate class that acts as a "Promise-like" for PerformanceScale.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PerformanceScaleClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise'
    listings<T extends PerformanceScale$listingsArgs<ExtArgs> = {}>(
      args?: Subset<T, PerformanceScale$listingsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ListingPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }

  /**
   * Fields of the PerformanceScale model
   */
  interface PerformanceScaleFieldRefs {
    readonly id: FieldRef<'PerformanceScale', 'Int'>
    readonly label: FieldRef<'PerformanceScale', 'String'>
    readonly rank: FieldRef<'PerformanceScale', 'Int'>
  }

  // Custom InputTypes
  /**
   * PerformanceScale findUnique
   */
  export type PerformanceScaleFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceScaleInclude<ExtArgs> | null
    /**
     * Filter, which PerformanceScale to fetch.
     */
    where: PerformanceScaleWhereUniqueInput
  }

  /**
   * PerformanceScale findUniqueOrThrow
   */
  export type PerformanceScaleFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceScaleInclude<ExtArgs> | null
    /**
     * Filter, which PerformanceScale to fetch.
     */
    where: PerformanceScaleWhereUniqueInput
  }

  /**
   * PerformanceScale findFirst
   */
  export type PerformanceScaleFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceScaleInclude<ExtArgs> | null
    /**
     * Filter, which PerformanceScale to fetch.
     */
    where?: PerformanceScaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PerformanceScales to fetch.
     */
    orderBy?:
      | PerformanceScaleOrderByWithRelationInput
      | PerformanceScaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PerformanceScales.
     */
    cursor?: PerformanceScaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PerformanceScales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PerformanceScales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PerformanceScales.
     */
    distinct?:
      | PerformanceScaleScalarFieldEnum
      | PerformanceScaleScalarFieldEnum[]
  }

  /**
   * PerformanceScale findFirstOrThrow
   */
  export type PerformanceScaleFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceScaleInclude<ExtArgs> | null
    /**
     * Filter, which PerformanceScale to fetch.
     */
    where?: PerformanceScaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PerformanceScales to fetch.
     */
    orderBy?:
      | PerformanceScaleOrderByWithRelationInput
      | PerformanceScaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PerformanceScales.
     */
    cursor?: PerformanceScaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PerformanceScales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PerformanceScales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PerformanceScales.
     */
    distinct?:
      | PerformanceScaleScalarFieldEnum
      | PerformanceScaleScalarFieldEnum[]
  }

  /**
   * PerformanceScale findMany
   */
  export type PerformanceScaleFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceScaleInclude<ExtArgs> | null
    /**
     * Filter, which PerformanceScales to fetch.
     */
    where?: PerformanceScaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PerformanceScales to fetch.
     */
    orderBy?:
      | PerformanceScaleOrderByWithRelationInput
      | PerformanceScaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing PerformanceScales.
     */
    cursor?: PerformanceScaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PerformanceScales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PerformanceScales.
     */
    skip?: number
    distinct?:
      | PerformanceScaleScalarFieldEnum
      | PerformanceScaleScalarFieldEnum[]
  }

  /**
   * PerformanceScale create
   */
  export type PerformanceScaleCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceScaleInclude<ExtArgs> | null
    /**
     * The data needed to create a PerformanceScale.
     */
    data: XOR<PerformanceScaleCreateInput, PerformanceScaleUncheckedCreateInput>
  }

  /**
   * PerformanceScale createMany
   */
  export type PerformanceScaleCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many PerformanceScales.
     */
    data: PerformanceScaleCreateManyInput | PerformanceScaleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PerformanceScale createManyAndReturn
   */
  export type PerformanceScaleCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * The data used to create many PerformanceScales.
     */
    data: PerformanceScaleCreateManyInput | PerformanceScaleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PerformanceScale update
   */
  export type PerformanceScaleUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceScaleInclude<ExtArgs> | null
    /**
     * The data needed to update a PerformanceScale.
     */
    data: XOR<PerformanceScaleUpdateInput, PerformanceScaleUncheckedUpdateInput>
    /**
     * Choose, which PerformanceScale to update.
     */
    where: PerformanceScaleWhereUniqueInput
  }

  /**
   * PerformanceScale updateMany
   */
  export type PerformanceScaleUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update PerformanceScales.
     */
    data: XOR<
      PerformanceScaleUpdateManyMutationInput,
      PerformanceScaleUncheckedUpdateManyInput
    >
    /**
     * Filter which PerformanceScales to update
     */
    where?: PerformanceScaleWhereInput
    /**
     * Limit how many PerformanceScales to update.
     */
    limit?: number
  }

  /**
   * PerformanceScale updateManyAndReturn
   */
  export type PerformanceScaleUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * The data used to update PerformanceScales.
     */
    data: XOR<
      PerformanceScaleUpdateManyMutationInput,
      PerformanceScaleUncheckedUpdateManyInput
    >
    /**
     * Filter which PerformanceScales to update
     */
    where?: PerformanceScaleWhereInput
    /**
     * Limit how many PerformanceScales to update.
     */
    limit?: number
  }

  /**
   * PerformanceScale upsert
   */
  export type PerformanceScaleUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceScaleInclude<ExtArgs> | null
    /**
     * The filter to search for the PerformanceScale to update in case it exists.
     */
    where: PerformanceScaleWhereUniqueInput
    /**
     * In case the PerformanceScale found by the `where` argument doesn't exist, create a new PerformanceScale with this data.
     */
    create: XOR<
      PerformanceScaleCreateInput,
      PerformanceScaleUncheckedCreateInput
    >
    /**
     * In case the PerformanceScale was found with the provided `where` argument, update it with this data.
     */
    update: XOR<
      PerformanceScaleUpdateInput,
      PerformanceScaleUncheckedUpdateInput
    >
  }

  /**
   * PerformanceScale delete
   */
  export type PerformanceScaleDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceScaleInclude<ExtArgs> | null
    /**
     * Filter which PerformanceScale to delete.
     */
    where: PerformanceScaleWhereUniqueInput
  }

  /**
   * PerformanceScale deleteMany
   */
  export type PerformanceScaleDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which PerformanceScales to delete
     */
    where?: PerformanceScaleWhereInput
    /**
     * Limit how many PerformanceScales to delete.
     */
    limit?: number
  }

  /**
   * PerformanceScale.listings
   */
  export type PerformanceScale$listingsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    where?: ListingWhereInput
    orderBy?:
      | ListingOrderByWithRelationInput
      | ListingOrderByWithRelationInput[]
    cursor?: ListingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ListingScalarFieldEnum | ListingScalarFieldEnum[]
  }

  /**
   * PerformanceScale without action
   */
  export type PerformanceScaleDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PerformanceScale
     */
    select?: PerformanceScaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceScale
     */
    omit?: PerformanceScaleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PerformanceScaleInclude<ExtArgs> | null
  }

  /**
   * Model Listing
   */

  export type AggregateListing = {
    _count: ListingCountAggregateOutputType | null
    _avg: ListingAvgAggregateOutputType | null
    _sum: ListingSumAggregateOutputType | null
    _min: ListingMinAggregateOutputType | null
    _max: ListingMaxAggregateOutputType | null
  }

  export type ListingAvgAggregateOutputType = {
    performanceId: number | null
  }

  export type ListingSumAggregateOutputType = {
    performanceId: number | null
  }

  export type ListingMinAggregateOutputType = {
    id: string | null
    deviceId: string | null
    gameId: string | null
    emulatorId: string | null
    performanceId: number | null
    notes: string | null
    authorId: string | null
    createdAt: Date | null
  }

  export type ListingMaxAggregateOutputType = {
    id: string | null
    deviceId: string | null
    gameId: string | null
    emulatorId: string | null
    performanceId: number | null
    notes: string | null
    authorId: string | null
    createdAt: Date | null
  }

  export type ListingCountAggregateOutputType = {
    id: number
    deviceId: number
    gameId: number
    emulatorId: number
    performanceId: number
    notes: number
    authorId: number
    createdAt: number
    _all: number
  }

  export type ListingAvgAggregateInputType = {
    performanceId?: true
  }

  export type ListingSumAggregateInputType = {
    performanceId?: true
  }

  export type ListingMinAggregateInputType = {
    id?: true
    deviceId?: true
    gameId?: true
    emulatorId?: true
    performanceId?: true
    notes?: true
    authorId?: true
    createdAt?: true
  }

  export type ListingMaxAggregateInputType = {
    id?: true
    deviceId?: true
    gameId?: true
    emulatorId?: true
    performanceId?: true
    notes?: true
    authorId?: true
    createdAt?: true
  }

  export type ListingCountAggregateInputType = {
    id?: true
    deviceId?: true
    gameId?: true
    emulatorId?: true
    performanceId?: true
    notes?: true
    authorId?: true
    createdAt?: true
    _all?: true
  }

  export type ListingAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Listing to aggregate.
     */
    where?: ListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Listings to fetch.
     */
    orderBy?:
      | ListingOrderByWithRelationInput
      | ListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: ListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Listings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Listings
     **/
    _count?: true | ListingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: ListingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: ListingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: ListingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: ListingMaxAggregateInputType
  }

  export type GetListingAggregateType<T extends ListingAggregateArgs> = {
    [P in keyof T & keyof AggregateListing]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateListing[P]>
      : GetScalarType<T[P], AggregateListing[P]>
  }

  export type ListingGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ListingWhereInput
    orderBy?:
      | ListingOrderByWithAggregationInput
      | ListingOrderByWithAggregationInput[]
    by: ListingScalarFieldEnum[] | ListingScalarFieldEnum
    having?: ListingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ListingCountAggregateInputType | true
    _avg?: ListingAvgAggregateInputType
    _sum?: ListingSumAggregateInputType
    _min?: ListingMinAggregateInputType
    _max?: ListingMaxAggregateInputType
  }

  export type ListingGroupByOutputType = {
    id: string
    deviceId: string
    gameId: string
    emulatorId: string
    performanceId: number
    notes: string | null
    authorId: string
    createdAt: Date
    _count: ListingCountAggregateOutputType | null
    _avg: ListingAvgAggregateOutputType | null
    _sum: ListingSumAggregateOutputType | null
    _min: ListingMinAggregateOutputType | null
    _max: ListingMaxAggregateOutputType | null
  }

  type GetListingGroupByPayload<T extends ListingGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<ListingGroupByOutputType, T['by']> & {
          [P in keyof T & keyof ListingGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ListingGroupByOutputType[P]>
            : GetScalarType<T[P], ListingGroupByOutputType[P]>
        }
      >
    >

  export type ListingSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      deviceId?: boolean
      gameId?: boolean
      emulatorId?: boolean
      performanceId?: boolean
      notes?: boolean
      authorId?: boolean
      createdAt?: boolean
      device?: boolean | DeviceDefaultArgs<ExtArgs>
      game?: boolean | GameDefaultArgs<ExtArgs>
      emulator?: boolean | EmulatorDefaultArgs<ExtArgs>
      performance?: boolean | PerformanceScaleDefaultArgs<ExtArgs>
      author?: boolean | UserDefaultArgs<ExtArgs>
      votes?: boolean | Listing$votesArgs<ExtArgs>
      comments?: boolean | Listing$commentsArgs<ExtArgs>
      approvals?: boolean | Listing$approvalsArgs<ExtArgs>
      _count?: boolean | ListingCountOutputTypeDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['listing']
  >

  export type ListingSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      deviceId?: boolean
      gameId?: boolean
      emulatorId?: boolean
      performanceId?: boolean
      notes?: boolean
      authorId?: boolean
      createdAt?: boolean
      device?: boolean | DeviceDefaultArgs<ExtArgs>
      game?: boolean | GameDefaultArgs<ExtArgs>
      emulator?: boolean | EmulatorDefaultArgs<ExtArgs>
      performance?: boolean | PerformanceScaleDefaultArgs<ExtArgs>
      author?: boolean | UserDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['listing']
  >

  export type ListingSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      deviceId?: boolean
      gameId?: boolean
      emulatorId?: boolean
      performanceId?: boolean
      notes?: boolean
      authorId?: boolean
      createdAt?: boolean
      device?: boolean | DeviceDefaultArgs<ExtArgs>
      game?: boolean | GameDefaultArgs<ExtArgs>
      emulator?: boolean | EmulatorDefaultArgs<ExtArgs>
      performance?: boolean | PerformanceScaleDefaultArgs<ExtArgs>
      author?: boolean | UserDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['listing']
  >

  export type ListingSelectScalar = {
    id?: boolean
    deviceId?: boolean
    gameId?: boolean
    emulatorId?: boolean
    performanceId?: boolean
    notes?: boolean
    authorId?: boolean
    createdAt?: boolean
  }

  export type ListingOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'deviceId'
    | 'gameId'
    | 'emulatorId'
    | 'performanceId'
    | 'notes'
    | 'authorId'
    | 'createdAt',
    ExtArgs['result']['listing']
  >
  export type ListingInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    device?: boolean | DeviceDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
    emulator?: boolean | EmulatorDefaultArgs<ExtArgs>
    performance?: boolean | PerformanceScaleDefaultArgs<ExtArgs>
    author?: boolean | UserDefaultArgs<ExtArgs>
    votes?: boolean | Listing$votesArgs<ExtArgs>
    comments?: boolean | Listing$commentsArgs<ExtArgs>
    approvals?: boolean | Listing$approvalsArgs<ExtArgs>
    _count?: boolean | ListingCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ListingIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    device?: boolean | DeviceDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
    emulator?: boolean | EmulatorDefaultArgs<ExtArgs>
    performance?: boolean | PerformanceScaleDefaultArgs<ExtArgs>
    author?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ListingIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    device?: boolean | DeviceDefaultArgs<ExtArgs>
    game?: boolean | GameDefaultArgs<ExtArgs>
    emulator?: boolean | EmulatorDefaultArgs<ExtArgs>
    performance?: boolean | PerformanceScaleDefaultArgs<ExtArgs>
    author?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $ListingPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Listing'
    objects: {
      device: Prisma.$DevicePayload<ExtArgs>
      game: Prisma.$GamePayload<ExtArgs>
      emulator: Prisma.$EmulatorPayload<ExtArgs>
      performance: Prisma.$PerformanceScalePayload<ExtArgs>
      author: Prisma.$UserPayload<ExtArgs>
      votes: Prisma.$VotePayload<ExtArgs>[]
      comments: Prisma.$CommentPayload<ExtArgs>[]
      approvals: Prisma.$ListingApprovalPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<
      {
        id: string
        deviceId: string
        gameId: string
        emulatorId: string
        performanceId: number
        notes: string | null
        authorId: string
        createdAt: Date
      },
      ExtArgs['result']['listing']
    >
    composites: {}
  }

  type ListingGetPayload<
    S extends boolean | null | undefined | ListingDefaultArgs,
  > = $Result.GetResult<Prisma.$ListingPayload, S>

  type ListingCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<ListingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ListingCountAggregateInputType | true
  }

  export interface ListingDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Listing']
      meta: { name: 'Listing' }
    }
    /**
     * Find zero or one Listing that matches the filter.
     * @param {ListingFindUniqueArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ListingFindUniqueArgs>(
      args: SelectSubset<T, ListingFindUniqueArgs<ExtArgs>>,
    ): Prisma__ListingClient<
      $Result.GetResult<
        Prisma.$ListingPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find one Listing that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ListingFindUniqueOrThrowArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ListingFindUniqueOrThrowArgs>(
      args: SelectSubset<T, ListingFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__ListingClient<
      $Result.GetResult<
        Prisma.$ListingPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Listing that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFindFirstArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ListingFindFirstArgs>(
      args?: SelectSubset<T, ListingFindFirstArgs<ExtArgs>>,
    ): Prisma__ListingClient<
      $Result.GetResult<
        Prisma.$ListingPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Listing that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFindFirstOrThrowArgs} args - Arguments to find a Listing
     * @example
     * // Get one Listing
     * const listing = await prisma.listing.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ListingFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ListingFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__ListingClient<
      $Result.GetResult<
        Prisma.$ListingPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find zero or more Listings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Listings
     * const listings = await prisma.listing.findMany()
     *
     * // Get first 10 Listings
     * const listings = await prisma.listing.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const listingWithIdOnly = await prisma.listing.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ListingFindManyArgs>(
      args?: SelectSubset<T, ListingFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ListingPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >

    /**
     * Create a Listing.
     * @param {ListingCreateArgs} args - Arguments to create a Listing.
     * @example
     * // Create one Listing
     * const Listing = await prisma.listing.create({
     *   data: {
     *     // ... data to create a Listing
     *   }
     * })
     *
     */
    create<T extends ListingCreateArgs>(
      args: SelectSubset<T, ListingCreateArgs<ExtArgs>>,
    ): Prisma__ListingClient<
      $Result.GetResult<
        Prisma.$ListingPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Create many Listings.
     * @param {ListingCreateManyArgs} args - Arguments to create many Listings.
     * @example
     * // Create many Listings
     * const listing = await prisma.listing.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ListingCreateManyArgs>(
      args?: SelectSubset<T, ListingCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Listings and returns the data saved in the database.
     * @param {ListingCreateManyAndReturnArgs} args - Arguments to create many Listings.
     * @example
     * // Create many Listings
     * const listing = await prisma.listing.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Listings and only return the `id`
     * const listingWithIdOnly = await prisma.listing.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ListingCreateManyAndReturnArgs>(
      args?: SelectSubset<T, ListingCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ListingPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Delete a Listing.
     * @param {ListingDeleteArgs} args - Arguments to delete one Listing.
     * @example
     * // Delete one Listing
     * const Listing = await prisma.listing.delete({
     *   where: {
     *     // ... filter to delete one Listing
     *   }
     * })
     *
     */
    delete<T extends ListingDeleteArgs>(
      args: SelectSubset<T, ListingDeleteArgs<ExtArgs>>,
    ): Prisma__ListingClient<
      $Result.GetResult<
        Prisma.$ListingPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Update one Listing.
     * @param {ListingUpdateArgs} args - Arguments to update one Listing.
     * @example
     * // Update one Listing
     * const listing = await prisma.listing.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ListingUpdateArgs>(
      args: SelectSubset<T, ListingUpdateArgs<ExtArgs>>,
    ): Prisma__ListingClient<
      $Result.GetResult<
        Prisma.$ListingPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Delete zero or more Listings.
     * @param {ListingDeleteManyArgs} args - Arguments to filter Listings to delete.
     * @example
     * // Delete a few Listings
     * const { count } = await prisma.listing.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ListingDeleteManyArgs>(
      args?: SelectSubset<T, ListingDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Listings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Listings
     * const listing = await prisma.listing.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ListingUpdateManyArgs>(
      args: SelectSubset<T, ListingUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Listings and returns the data updated in the database.
     * @param {ListingUpdateManyAndReturnArgs} args - Arguments to update many Listings.
     * @example
     * // Update many Listings
     * const listing = await prisma.listing.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Listings and only return the `id`
     * const listingWithIdOnly = await prisma.listing.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ListingUpdateManyAndReturnArgs>(
      args: SelectSubset<T, ListingUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ListingPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Create or update one Listing.
     * @param {ListingUpsertArgs} args - Arguments to update or create a Listing.
     * @example
     * // Update or create a Listing
     * const listing = await prisma.listing.upsert({
     *   create: {
     *     // ... data to create a Listing
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Listing we want to update
     *   }
     * })
     */
    upsert<T extends ListingUpsertArgs>(
      args: SelectSubset<T, ListingUpsertArgs<ExtArgs>>,
    ): Prisma__ListingClient<
      $Result.GetResult<
        Prisma.$ListingPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Count the number of Listings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingCountArgs} args - Arguments to filter Listings to count.
     * @example
     * // Count the number of Listings
     * const count = await prisma.listing.count({
     *   where: {
     *     // ... the filter for the Listings we want to count
     *   }
     * })
     **/
    count<T extends ListingCountArgs>(
      args?: Subset<T, ListingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ListingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Listing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends ListingAggregateArgs>(
      args: Subset<T, ListingAggregateArgs>,
    ): Prisma.PrismaPromise<GetListingAggregateType<T>>

    /**
     * Group by Listing.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends ListingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ListingGroupByArgs['orderBy'] }
        : { orderBy?: ListingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ]
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, ListingGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors
      ? GetListingGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>
    /**
     * Fields of the Listing model
     */
    readonly fields: ListingFieldRefs
  }

  /**
   * The delegate class that acts as a "Promise-like" for Listing.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ListingClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise'
    device<T extends DeviceDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, DeviceDefaultArgs<ExtArgs>>,
    ): Prisma__DeviceClient<
      | $Result.GetResult<
          Prisma.$DevicePayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    game<T extends GameDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, GameDefaultArgs<ExtArgs>>,
    ): Prisma__GameClient<
      | $Result.GetResult<
          Prisma.$GamePayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    emulator<T extends EmulatorDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, EmulatorDefaultArgs<ExtArgs>>,
    ): Prisma__EmulatorClient<
      | $Result.GetResult<
          Prisma.$EmulatorPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    performance<T extends PerformanceScaleDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, PerformanceScaleDefaultArgs<ExtArgs>>,
    ): Prisma__PerformanceScaleClient<
      | $Result.GetResult<
          Prisma.$PerformanceScalePayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    author<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>,
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    votes<T extends Listing$votesArgs<ExtArgs> = {}>(
      args?: Subset<T, Listing$votesArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$VotePayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    comments<T extends Listing$commentsArgs<ExtArgs> = {}>(
      args?: Subset<T, Listing$commentsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$CommentPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    approvals<T extends Listing$approvalsArgs<ExtArgs> = {}>(
      args?: Subset<T, Listing$approvalsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$ListingApprovalPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }

  /**
   * Fields of the Listing model
   */
  interface ListingFieldRefs {
    readonly id: FieldRef<'Listing', 'String'>
    readonly deviceId: FieldRef<'Listing', 'String'>
    readonly gameId: FieldRef<'Listing', 'String'>
    readonly emulatorId: FieldRef<'Listing', 'String'>
    readonly performanceId: FieldRef<'Listing', 'Int'>
    readonly notes: FieldRef<'Listing', 'String'>
    readonly authorId: FieldRef<'Listing', 'String'>
    readonly createdAt: FieldRef<'Listing', 'DateTime'>
  }

  // Custom InputTypes
  /**
   * Listing findUnique
   */
  export type ListingFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter, which Listing to fetch.
     */
    where: ListingWhereUniqueInput
  }

  /**
   * Listing findUniqueOrThrow
   */
  export type ListingFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter, which Listing to fetch.
     */
    where: ListingWhereUniqueInput
  }

  /**
   * Listing findFirst
   */
  export type ListingFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter, which Listing to fetch.
     */
    where?: ListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Listings to fetch.
     */
    orderBy?:
      | ListingOrderByWithRelationInput
      | ListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Listings.
     */
    cursor?: ListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Listings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Listings.
     */
    distinct?: ListingScalarFieldEnum | ListingScalarFieldEnum[]
  }

  /**
   * Listing findFirstOrThrow
   */
  export type ListingFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter, which Listing to fetch.
     */
    where?: ListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Listings to fetch.
     */
    orderBy?:
      | ListingOrderByWithRelationInput
      | ListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Listings.
     */
    cursor?: ListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Listings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Listings.
     */
    distinct?: ListingScalarFieldEnum | ListingScalarFieldEnum[]
  }

  /**
   * Listing findMany
   */
  export type ListingFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter, which Listings to fetch.
     */
    where?: ListingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Listings to fetch.
     */
    orderBy?:
      | ListingOrderByWithRelationInput
      | ListingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Listings.
     */
    cursor?: ListingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Listings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Listings.
     */
    skip?: number
    distinct?: ListingScalarFieldEnum | ListingScalarFieldEnum[]
  }

  /**
   * Listing create
   */
  export type ListingCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * The data needed to create a Listing.
     */
    data: XOR<ListingCreateInput, ListingUncheckedCreateInput>
  }

  /**
   * Listing createMany
   */
  export type ListingCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Listings.
     */
    data: ListingCreateManyInput | ListingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Listing createManyAndReturn
   */
  export type ListingCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * The data used to create many Listings.
     */
    data: ListingCreateManyInput | ListingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Listing update
   */
  export type ListingUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * The data needed to update a Listing.
     */
    data: XOR<ListingUpdateInput, ListingUncheckedUpdateInput>
    /**
     * Choose, which Listing to update.
     */
    where: ListingWhereUniqueInput
  }

  /**
   * Listing updateMany
   */
  export type ListingUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Listings.
     */
    data: XOR<ListingUpdateManyMutationInput, ListingUncheckedUpdateManyInput>
    /**
     * Filter which Listings to update
     */
    where?: ListingWhereInput
    /**
     * Limit how many Listings to update.
     */
    limit?: number
  }

  /**
   * Listing updateManyAndReturn
   */
  export type ListingUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * The data used to update Listings.
     */
    data: XOR<ListingUpdateManyMutationInput, ListingUncheckedUpdateManyInput>
    /**
     * Filter which Listings to update
     */
    where?: ListingWhereInput
    /**
     * Limit how many Listings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Listing upsert
   */
  export type ListingUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * The filter to search for the Listing to update in case it exists.
     */
    where: ListingWhereUniqueInput
    /**
     * In case the Listing found by the `where` argument doesn't exist, create a new Listing with this data.
     */
    create: XOR<ListingCreateInput, ListingUncheckedCreateInput>
    /**
     * In case the Listing was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ListingUpdateInput, ListingUncheckedUpdateInput>
  }

  /**
   * Listing delete
   */
  export type ListingDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
    /**
     * Filter which Listing to delete.
     */
    where: ListingWhereUniqueInput
  }

  /**
   * Listing deleteMany
   */
  export type ListingDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Listings to delete
     */
    where?: ListingWhereInput
    /**
     * Limit how many Listings to delete.
     */
    limit?: number
  }

  /**
   * Listing.votes
   */
  export type Listing$votesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    where?: VoteWhereInput
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    cursor?: VoteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VoteScalarFieldEnum | VoteScalarFieldEnum[]
  }

  /**
   * Listing.comments
   */
  export type Listing$commentsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?:
      | CommentOrderByWithRelationInput
      | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Listing.approvals
   */
  export type Listing$approvalsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
    where?: ListingApprovalWhereInput
    orderBy?:
      | ListingApprovalOrderByWithRelationInput
      | ListingApprovalOrderByWithRelationInput[]
    cursor?: ListingApprovalWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ListingApprovalScalarFieldEnum | ListingApprovalScalarFieldEnum[]
  }

  /**
   * Listing without action
   */
  export type ListingDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Listing
     */
    select?: ListingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Listing
     */
    omit?: ListingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingInclude<ExtArgs> | null
  }

  /**
   * Model Vote
   */

  export type AggregateVote = {
    _count: VoteCountAggregateOutputType | null
    _min: VoteMinAggregateOutputType | null
    _max: VoteMaxAggregateOutputType | null
  }

  export type VoteMinAggregateOutputType = {
    id: string | null
    value: boolean | null
    userId: string | null
    listingId: string | null
  }

  export type VoteMaxAggregateOutputType = {
    id: string | null
    value: boolean | null
    userId: string | null
    listingId: string | null
  }

  export type VoteCountAggregateOutputType = {
    id: number
    value: number
    userId: number
    listingId: number
    _all: number
  }

  export type VoteMinAggregateInputType = {
    id?: true
    value?: true
    userId?: true
    listingId?: true
  }

  export type VoteMaxAggregateInputType = {
    id?: true
    value?: true
    userId?: true
    listingId?: true
  }

  export type VoteCountAggregateInputType = {
    id?: true
    value?: true
    userId?: true
    listingId?: true
    _all?: true
  }

  export type VoteAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Vote to aggregate.
     */
    where?: VoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Votes to fetch.
     */
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: VoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Votes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Votes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Votes
     **/
    _count?: true | VoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: VoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: VoteMaxAggregateInputType
  }

  export type GetVoteAggregateType<T extends VoteAggregateArgs> = {
    [P in keyof T & keyof AggregateVote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVote[P]>
      : GetScalarType<T[P], AggregateVote[P]>
  }

  export type VoteGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: VoteWhereInput
    orderBy?:
      | VoteOrderByWithAggregationInput
      | VoteOrderByWithAggregationInput[]
    by: VoteScalarFieldEnum[] | VoteScalarFieldEnum
    having?: VoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VoteCountAggregateInputType | true
    _min?: VoteMinAggregateInputType
    _max?: VoteMaxAggregateInputType
  }

  export type VoteGroupByOutputType = {
    id: string
    value: boolean
    userId: string
    listingId: string
    _count: VoteCountAggregateOutputType | null
    _min: VoteMinAggregateOutputType | null
    _max: VoteMaxAggregateOutputType | null
  }

  type GetVoteGroupByPayload<T extends VoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VoteGroupByOutputType, T['by']> & {
        [P in keyof T & keyof VoteGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], VoteGroupByOutputType[P]>
          : GetScalarType<T[P], VoteGroupByOutputType[P]>
      }
    >
  >

  export type VoteSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      value?: boolean
      userId?: boolean
      listingId?: boolean
      user?: boolean | UserDefaultArgs<ExtArgs>
      listing?: boolean | ListingDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['vote']
  >

  export type VoteSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      value?: boolean
      userId?: boolean
      listingId?: boolean
      user?: boolean | UserDefaultArgs<ExtArgs>
      listing?: boolean | ListingDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['vote']
  >

  export type VoteSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      value?: boolean
      userId?: boolean
      listingId?: boolean
      user?: boolean | UserDefaultArgs<ExtArgs>
      listing?: boolean | ListingDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['vote']
  >

  export type VoteSelectScalar = {
    id?: boolean
    value?: boolean
    userId?: boolean
    listingId?: boolean
  }

  export type VoteOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    'id' | 'value' | 'userId' | 'listingId',
    ExtArgs['result']['vote']
  >
  export type VoteInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }
  export type VoteIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }
  export type VoteIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    listing?: boolean | ListingDefaultArgs<ExtArgs>
  }

  export type $VotePayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Vote'
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      listing: Prisma.$ListingPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<
      {
        id: string
        value: boolean
        userId: string
        listingId: string
      },
      ExtArgs['result']['vote']
    >
    composites: {}
  }

  type VoteGetPayload<S extends boolean | null | undefined | VoteDefaultArgs> =
    $Result.GetResult<Prisma.$VotePayload, S>

  type VoteCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<VoteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: VoteCountAggregateInputType | true
  }

  export interface VoteDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Vote']
      meta: { name: 'Vote' }
    }
    /**
     * Find zero or one Vote that matches the filter.
     * @param {VoteFindUniqueArgs} args - Arguments to find a Vote
     * @example
     * // Get one Vote
     * const vote = await prisma.vote.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VoteFindUniqueArgs>(
      args: SelectSubset<T, VoteFindUniqueArgs<ExtArgs>>,
    ): Prisma__VoteClient<
      $Result.GetResult<
        Prisma.$VotePayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find one Vote that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VoteFindUniqueOrThrowArgs} args - Arguments to find a Vote
     * @example
     * // Get one Vote
     * const vote = await prisma.vote.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VoteFindUniqueOrThrowArgs>(
      args: SelectSubset<T, VoteFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__VoteClient<
      $Result.GetResult<
        Prisma.$VotePayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Vote that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteFindFirstArgs} args - Arguments to find a Vote
     * @example
     * // Get one Vote
     * const vote = await prisma.vote.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VoteFindFirstArgs>(
      args?: SelectSubset<T, VoteFindFirstArgs<ExtArgs>>,
    ): Prisma__VoteClient<
      $Result.GetResult<
        Prisma.$VotePayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Vote that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteFindFirstOrThrowArgs} args - Arguments to find a Vote
     * @example
     * // Get one Vote
     * const vote = await prisma.vote.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VoteFindFirstOrThrowArgs>(
      args?: SelectSubset<T, VoteFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__VoteClient<
      $Result.GetResult<
        Prisma.$VotePayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find zero or more Votes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Votes
     * const votes = await prisma.vote.findMany()
     *
     * // Get first 10 Votes
     * const votes = await prisma.vote.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const voteWithIdOnly = await prisma.vote.findMany({ select: { id: true } })
     *
     */
    findMany<T extends VoteFindManyArgs>(
      args?: SelectSubset<T, VoteFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$VotePayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >

    /**
     * Create a Vote.
     * @param {VoteCreateArgs} args - Arguments to create a Vote.
     * @example
     * // Create one Vote
     * const Vote = await prisma.vote.create({
     *   data: {
     *     // ... data to create a Vote
     *   }
     * })
     *
     */
    create<T extends VoteCreateArgs>(
      args: SelectSubset<T, VoteCreateArgs<ExtArgs>>,
    ): Prisma__VoteClient<
      $Result.GetResult<
        Prisma.$VotePayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Create many Votes.
     * @param {VoteCreateManyArgs} args - Arguments to create many Votes.
     * @example
     * // Create many Votes
     * const vote = await prisma.vote.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends VoteCreateManyArgs>(
      args?: SelectSubset<T, VoteCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Votes and returns the data saved in the database.
     * @param {VoteCreateManyAndReturnArgs} args - Arguments to create many Votes.
     * @example
     * // Create many Votes
     * const vote = await prisma.vote.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Votes and only return the `id`
     * const voteWithIdOnly = await prisma.vote.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends VoteCreateManyAndReturnArgs>(
      args?: SelectSubset<T, VoteCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$VotePayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Delete a Vote.
     * @param {VoteDeleteArgs} args - Arguments to delete one Vote.
     * @example
     * // Delete one Vote
     * const Vote = await prisma.vote.delete({
     *   where: {
     *     // ... filter to delete one Vote
     *   }
     * })
     *
     */
    delete<T extends VoteDeleteArgs>(
      args: SelectSubset<T, VoteDeleteArgs<ExtArgs>>,
    ): Prisma__VoteClient<
      $Result.GetResult<
        Prisma.$VotePayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Update one Vote.
     * @param {VoteUpdateArgs} args - Arguments to update one Vote.
     * @example
     * // Update one Vote
     * const vote = await prisma.vote.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends VoteUpdateArgs>(
      args: SelectSubset<T, VoteUpdateArgs<ExtArgs>>,
    ): Prisma__VoteClient<
      $Result.GetResult<
        Prisma.$VotePayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Delete zero or more Votes.
     * @param {VoteDeleteManyArgs} args - Arguments to filter Votes to delete.
     * @example
     * // Delete a few Votes
     * const { count } = await prisma.vote.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends VoteDeleteManyArgs>(
      args?: SelectSubset<T, VoteDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Votes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Votes
     * const vote = await prisma.vote.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends VoteUpdateManyArgs>(
      args: SelectSubset<T, VoteUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Votes and returns the data updated in the database.
     * @param {VoteUpdateManyAndReturnArgs} args - Arguments to update many Votes.
     * @example
     * // Update many Votes
     * const vote = await prisma.vote.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Votes and only return the `id`
     * const voteWithIdOnly = await prisma.vote.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends VoteUpdateManyAndReturnArgs>(
      args: SelectSubset<T, VoteUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$VotePayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Create or update one Vote.
     * @param {VoteUpsertArgs} args - Arguments to update or create a Vote.
     * @example
     * // Update or create a Vote
     * const vote = await prisma.vote.upsert({
     *   create: {
     *     // ... data to create a Vote
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Vote we want to update
     *   }
     * })
     */
    upsert<T extends VoteUpsertArgs>(
      args: SelectSubset<T, VoteUpsertArgs<ExtArgs>>,
    ): Prisma__VoteClient<
      $Result.GetResult<
        Prisma.$VotePayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Count the number of Votes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteCountArgs} args - Arguments to filter Votes to count.
     * @example
     * // Count the number of Votes
     * const count = await prisma.vote.count({
     *   where: {
     *     // ... the filter for the Votes we want to count
     *   }
     * })
     **/
    count<T extends VoteCountArgs>(
      args?: Subset<T, VoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VoteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Vote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends VoteAggregateArgs>(
      args: Subset<T, VoteAggregateArgs>,
    ): Prisma.PrismaPromise<GetVoteAggregateType<T>>

    /**
     * Group by Vote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VoteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends VoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VoteGroupByArgs['orderBy'] }
        : { orderBy?: VoteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ]
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, VoteGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors
      ? GetVoteGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>
    /**
     * Fields of the Vote model
     */
    readonly fields: VoteFieldRefs
  }

  /**
   * The delegate class that acts as a "Promise-like" for Vote.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VoteClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise'
    user<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>,
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    listing<T extends ListingDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, ListingDefaultArgs<ExtArgs>>,
    ): Prisma__ListingClient<
      | $Result.GetResult<
          Prisma.$ListingPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }

  /**
   * Fields of the Vote model
   */
  interface VoteFieldRefs {
    readonly id: FieldRef<'Vote', 'String'>
    readonly value: FieldRef<'Vote', 'Boolean'>
    readonly userId: FieldRef<'Vote', 'String'>
    readonly listingId: FieldRef<'Vote', 'String'>
  }

  // Custom InputTypes
  /**
   * Vote findUnique
   */
  export type VoteFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter, which Vote to fetch.
     */
    where: VoteWhereUniqueInput
  }

  /**
   * Vote findUniqueOrThrow
   */
  export type VoteFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter, which Vote to fetch.
     */
    where: VoteWhereUniqueInput
  }

  /**
   * Vote findFirst
   */
  export type VoteFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter, which Vote to fetch.
     */
    where?: VoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Votes to fetch.
     */
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Votes.
     */
    cursor?: VoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Votes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Votes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Votes.
     */
    distinct?: VoteScalarFieldEnum | VoteScalarFieldEnum[]
  }

  /**
   * Vote findFirstOrThrow
   */
  export type VoteFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter, which Vote to fetch.
     */
    where?: VoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Votes to fetch.
     */
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Votes.
     */
    cursor?: VoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Votes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Votes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Votes.
     */
    distinct?: VoteScalarFieldEnum | VoteScalarFieldEnum[]
  }

  /**
   * Vote findMany
   */
  export type VoteFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter, which Votes to fetch.
     */
    where?: VoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Votes to fetch.
     */
    orderBy?: VoteOrderByWithRelationInput | VoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Votes.
     */
    cursor?: VoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Votes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Votes.
     */
    skip?: number
    distinct?: VoteScalarFieldEnum | VoteScalarFieldEnum[]
  }

  /**
   * Vote create
   */
  export type VoteCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * The data needed to create a Vote.
     */
    data: XOR<VoteCreateInput, VoteUncheckedCreateInput>
  }

  /**
   * Vote createMany
   */
  export type VoteCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Votes.
     */
    data: VoteCreateManyInput | VoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Vote createManyAndReturn
   */
  export type VoteCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * The data used to create many Votes.
     */
    data: VoteCreateManyInput | VoteCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Vote update
   */
  export type VoteUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * The data needed to update a Vote.
     */
    data: XOR<VoteUpdateInput, VoteUncheckedUpdateInput>
    /**
     * Choose, which Vote to update.
     */
    where: VoteWhereUniqueInput
  }

  /**
   * Vote updateMany
   */
  export type VoteUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Votes.
     */
    data: XOR<VoteUpdateManyMutationInput, VoteUncheckedUpdateManyInput>
    /**
     * Filter which Votes to update
     */
    where?: VoteWhereInput
    /**
     * Limit how many Votes to update.
     */
    limit?: number
  }

  /**
   * Vote updateManyAndReturn
   */
  export type VoteUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * The data used to update Votes.
     */
    data: XOR<VoteUpdateManyMutationInput, VoteUncheckedUpdateManyInput>
    /**
     * Filter which Votes to update
     */
    where?: VoteWhereInput
    /**
     * Limit how many Votes to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Vote upsert
   */
  export type VoteUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * The filter to search for the Vote to update in case it exists.
     */
    where: VoteWhereUniqueInput
    /**
     * In case the Vote found by the `where` argument doesn't exist, create a new Vote with this data.
     */
    create: XOR<VoteCreateInput, VoteUncheckedCreateInput>
    /**
     * In case the Vote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VoteUpdateInput, VoteUncheckedUpdateInput>
  }

  /**
   * Vote delete
   */
  export type VoteDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
    /**
     * Filter which Vote to delete.
     */
    where: VoteWhereUniqueInput
  }

  /**
   * Vote deleteMany
   */
  export type VoteDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Votes to delete
     */
    where?: VoteWhereInput
    /**
     * Limit how many Votes to delete.
     */
    limit?: number
  }

  /**
   * Vote without action
   */
  export type VoteDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Vote
     */
    select?: VoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Vote
     */
    omit?: VoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VoteInclude<ExtArgs> | null
  }

  /**
   * Model Comment
   */

  export type AggregateComment = {
    _count: CommentCountAggregateOutputType | null
    _min: CommentMinAggregateOutputType | null
    _max: CommentMaxAggregateOutputType | null
  }

  export type CommentMinAggregateOutputType = {
    id: string | null
    content: string | null
    userId: string | null
    listingId: string | null
    parentId: string | null
    createdAt: Date | null
  }

  export type CommentMaxAggregateOutputType = {
    id: string | null
    content: string | null
    userId: string | null
    listingId: string | null
    parentId: string | null
    createdAt: Date | null
  }

  export type CommentCountAggregateOutputType = {
    id: number
    content: number
    userId: number
    listingId: number
    parentId: number
    createdAt: number
    _all: number
  }

  export type CommentMinAggregateInputType = {
    id?: true
    content?: true
    userId?: true
    listingId?: true
    parentId?: true
    createdAt?: true
  }

  export type CommentMaxAggregateInputType = {
    id?: true
    content?: true
    userId?: true
    listingId?: true
    parentId?: true
    createdAt?: true
  }

  export type CommentCountAggregateInputType = {
    id?: true
    content?: true
    userId?: true
    listingId?: true
    parentId?: true
    createdAt?: true
    _all?: true
  }

  export type CommentAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Comment to aggregate.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Comments to fetch.
     */
    orderBy?:
      | CommentOrderByWithRelationInput
      | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Comments
     **/
    _count?: true | CommentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: CommentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: CommentMaxAggregateInputType
  }

  export type GetCommentAggregateType<T extends CommentAggregateArgs> = {
    [P in keyof T & keyof AggregateComment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateComment[P]>
      : GetScalarType<T[P], AggregateComment[P]>
  }

  export type CommentGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CommentWhereInput
    orderBy?:
      | CommentOrderByWithAggregationInput
      | CommentOrderByWithAggregationInput[]
    by: CommentScalarFieldEnum[] | CommentScalarFieldEnum
    having?: CommentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CommentCountAggregateInputType | true
    _min?: CommentMinAggregateInputType
    _max?: CommentMaxAggregateInputType
  }

  export type CommentGroupByOutputType = {
    id: string
    content: string
    userId: string
    listingId: string
    parentId: string | null
    createdAt: Date
    _count: CommentCountAggregateOutputType | null
    _min: CommentMinAggregateOutputType | null
    _max: CommentMaxAggregateOutputType | null
  }

  type GetCommentGroupByPayload<T extends CommentGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<CommentGroupByOutputType, T['by']> & {
          [P in keyof T & keyof CommentGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CommentGroupByOutputType[P]>
            : GetScalarType<T[P], CommentGroupByOutputType[P]>
        }
      >
    >

  export type CommentSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      content?: boolean
      userId?: boolean
      listingId?: boolean
      parentId?: boolean
      createdAt?: boolean
      user?: boolean | UserDefaultArgs<ExtArgs>
      listing?: boolean | ListingDefaultArgs<ExtArgs>
      parent?: boolean | Comment$parentArgs<ExtArgs>
      replies?: boolean | Comment$repliesArgs<ExtArgs>
      _count?: boolean | CommentCountOutputTypeDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['comment']
  >

  export type CommentSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      content?: boolean
      userId?: boolean
      listingId?: boolean
      parentId?: boolean
      createdAt?: boolean
      user?: boolean | UserDefaultArgs<ExtArgs>
      listing?: boolean | ListingDefaultArgs<ExtArgs>
      parent?: boolean | Comment$parentArgs<ExtArgs>
    },
    ExtArgs['result']['comment']
  >

  export type CommentSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      content?: boolean
      userId?: boolean
      listingId?: boolean
      parentId?: boolean
      createdAt?: boolean
      user?: boolean | UserDefaultArgs<ExtArgs>
      listing?: boolean | ListingDefaultArgs<ExtArgs>
      parent?: boolean | Comment$parentArgs<ExtArgs>
    },
    ExtArgs['result']['comment']
  >

  export type CommentSelectScalar = {
    id?: boolean
    content?: boolean
    userId?: boolean
    listingId?: boolean
    parentId?: boolean
    createdAt?: boolean
  }

  export type CommentOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    'id' | 'content' | 'userId' | 'listingId' | 'parentId' | 'createdAt',
    ExtArgs['result']['comment']
  >
  export type CommentInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    listing?: boolean | ListingDefaultArgs<ExtArgs>
    parent?: boolean | Comment$parentArgs<ExtArgs>
    replies?: boolean | Comment$repliesArgs<ExtArgs>
    _count?: boolean | CommentCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CommentIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    listing?: boolean | ListingDefaultArgs<ExtArgs>
    parent?: boolean | Comment$parentArgs<ExtArgs>
  }
  export type CommentIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    listing?: boolean | ListingDefaultArgs<ExtArgs>
    parent?: boolean | Comment$parentArgs<ExtArgs>
  }

  export type $CommentPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'Comment'
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      listing: Prisma.$ListingPayload<ExtArgs>
      parent: Prisma.$CommentPayload<ExtArgs> | null
      replies: Prisma.$CommentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<
      {
        id: string
        content: string
        userId: string
        listingId: string
        parentId: string | null
        createdAt: Date
      },
      ExtArgs['result']['comment']
    >
    composites: {}
  }

  type CommentGetPayload<
    S extends boolean | null | undefined | CommentDefaultArgs,
  > = $Result.GetResult<Prisma.$CommentPayload, S>

  type CommentCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<CommentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: CommentCountAggregateInputType | true
  }

  export interface CommentDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['Comment']
      meta: { name: 'Comment' }
    }
    /**
     * Find zero or one Comment that matches the filter.
     * @param {CommentFindUniqueArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CommentFindUniqueArgs>(
      args: SelectSubset<T, CommentFindUniqueArgs<ExtArgs>>,
    ): Prisma__CommentClient<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find one Comment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CommentFindUniqueOrThrowArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CommentFindUniqueOrThrowArgs>(
      args: SelectSubset<T, CommentFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__CommentClient<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Comment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindFirstArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CommentFindFirstArgs>(
      args?: SelectSubset<T, CommentFindFirstArgs<ExtArgs>>,
    ): Prisma__CommentClient<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first Comment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindFirstOrThrowArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CommentFindFirstOrThrowArgs>(
      args?: SelectSubset<T, CommentFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__CommentClient<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find zero or more Comments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Comments
     * const comments = await prisma.comment.findMany()
     *
     * // Get first 10 Comments
     * const comments = await prisma.comment.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const commentWithIdOnly = await prisma.comment.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CommentFindManyArgs>(
      args?: SelectSubset<T, CommentFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >

    /**
     * Create a Comment.
     * @param {CommentCreateArgs} args - Arguments to create a Comment.
     * @example
     * // Create one Comment
     * const Comment = await prisma.comment.create({
     *   data: {
     *     // ... data to create a Comment
     *   }
     * })
     *
     */
    create<T extends CommentCreateArgs>(
      args: SelectSubset<T, CommentCreateArgs<ExtArgs>>,
    ): Prisma__CommentClient<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Create many Comments.
     * @param {CommentCreateManyArgs} args - Arguments to create many Comments.
     * @example
     * // Create many Comments
     * const comment = await prisma.comment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CommentCreateManyArgs>(
      args?: SelectSubset<T, CommentCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Comments and returns the data saved in the database.
     * @param {CommentCreateManyAndReturnArgs} args - Arguments to create many Comments.
     * @example
     * // Create many Comments
     * const comment = await prisma.comment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Comments and only return the `id`
     * const commentWithIdOnly = await prisma.comment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CommentCreateManyAndReturnArgs>(
      args?: SelectSubset<T, CommentCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Delete a Comment.
     * @param {CommentDeleteArgs} args - Arguments to delete one Comment.
     * @example
     * // Delete one Comment
     * const Comment = await prisma.comment.delete({
     *   where: {
     *     // ... filter to delete one Comment
     *   }
     * })
     *
     */
    delete<T extends CommentDeleteArgs>(
      args: SelectSubset<T, CommentDeleteArgs<ExtArgs>>,
    ): Prisma__CommentClient<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Update one Comment.
     * @param {CommentUpdateArgs} args - Arguments to update one Comment.
     * @example
     * // Update one Comment
     * const comment = await prisma.comment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CommentUpdateArgs>(
      args: SelectSubset<T, CommentUpdateArgs<ExtArgs>>,
    ): Prisma__CommentClient<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Delete zero or more Comments.
     * @param {CommentDeleteManyArgs} args - Arguments to filter Comments to delete.
     * @example
     * // Delete a few Comments
     * const { count } = await prisma.comment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CommentDeleteManyArgs>(
      args?: SelectSubset<T, CommentDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Comments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Comments
     * const comment = await prisma.comment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CommentUpdateManyArgs>(
      args: SelectSubset<T, CommentUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Comments and returns the data updated in the database.
     * @param {CommentUpdateManyAndReturnArgs} args - Arguments to update many Comments.
     * @example
     * // Update many Comments
     * const comment = await prisma.comment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Comments and only return the `id`
     * const commentWithIdOnly = await prisma.comment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CommentUpdateManyAndReturnArgs>(
      args: SelectSubset<T, CommentUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Create or update one Comment.
     * @param {CommentUpsertArgs} args - Arguments to update or create a Comment.
     * @example
     * // Update or create a Comment
     * const comment = await prisma.comment.upsert({
     *   create: {
     *     // ... data to create a Comment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Comment we want to update
     *   }
     * })
     */
    upsert<T extends CommentUpsertArgs>(
      args: SelectSubset<T, CommentUpsertArgs<ExtArgs>>,
    ): Prisma__CommentClient<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Count the number of Comments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentCountArgs} args - Arguments to filter Comments to count.
     * @example
     * // Count the number of Comments
     * const count = await prisma.comment.count({
     *   where: {
     *     // ... the filter for the Comments we want to count
     *   }
     * })
     **/
    count<T extends CommentCountArgs>(
      args?: Subset<T, CommentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CommentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Comment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends CommentAggregateArgs>(
      args: Subset<T, CommentAggregateArgs>,
    ): Prisma.PrismaPromise<GetCommentAggregateType<T>>

    /**
     * Group by Comment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends CommentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CommentGroupByArgs['orderBy'] }
        : { orderBy?: CommentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ]
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, CommentGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors
      ? GetCommentGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>
    /**
     * Fields of the Comment model
     */
    readonly fields: CommentFieldRefs
  }

  /**
   * The delegate class that acts as a "Promise-like" for Comment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CommentClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise'
    user<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>,
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    listing<T extends ListingDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, ListingDefaultArgs<ExtArgs>>,
    ): Prisma__ListingClient<
      | $Result.GetResult<
          Prisma.$ListingPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    parent<T extends Comment$parentArgs<ExtArgs> = {}>(
      args?: Subset<T, Comment$parentArgs<ExtArgs>>,
    ): Prisma__CommentClient<
      $Result.GetResult<
        Prisma.$CommentPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >
    replies<T extends Comment$repliesArgs<ExtArgs> = {}>(
      args?: Subset<T, Comment$repliesArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$CommentPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }

  /**
   * Fields of the Comment model
   */
  interface CommentFieldRefs {
    readonly id: FieldRef<'Comment', 'String'>
    readonly content: FieldRef<'Comment', 'String'>
    readonly userId: FieldRef<'Comment', 'String'>
    readonly listingId: FieldRef<'Comment', 'String'>
    readonly parentId: FieldRef<'Comment', 'String'>
    readonly createdAt: FieldRef<'Comment', 'DateTime'>
  }

  // Custom InputTypes
  /**
   * Comment findUnique
   */
  export type CommentFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment findUniqueOrThrow
   */
  export type CommentFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment findFirst
   */
  export type CommentFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Comments to fetch.
     */
    orderBy?:
      | CommentOrderByWithRelationInput
      | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Comments.
     */
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Comment findFirstOrThrow
   */
  export type CommentFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Comments to fetch.
     */
    orderBy?:
      | CommentOrderByWithRelationInput
      | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Comments.
     */
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Comment findMany
   */
  export type CommentFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comments to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Comments to fetch.
     */
    orderBy?:
      | CommentOrderByWithRelationInput
      | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Comments.
     */
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Comment create
   */
  export type CommentCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The data needed to create a Comment.
     */
    data: XOR<CommentCreateInput, CommentUncheckedCreateInput>
  }

  /**
   * Comment createMany
   */
  export type CommentCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Comments.
     */
    data: CommentCreateManyInput | CommentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Comment createManyAndReturn
   */
  export type CommentCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * The data used to create many Comments.
     */
    data: CommentCreateManyInput | CommentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Comment update
   */
  export type CommentUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The data needed to update a Comment.
     */
    data: XOR<CommentUpdateInput, CommentUncheckedUpdateInput>
    /**
     * Choose, which Comment to update.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment updateMany
   */
  export type CommentUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Comments.
     */
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyInput>
    /**
     * Filter which Comments to update
     */
    where?: CommentWhereInput
    /**
     * Limit how many Comments to update.
     */
    limit?: number
  }

  /**
   * Comment updateManyAndReturn
   */
  export type CommentUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * The data used to update Comments.
     */
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyInput>
    /**
     * Filter which Comments to update
     */
    where?: CommentWhereInput
    /**
     * Limit how many Comments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Comment upsert
   */
  export type CommentUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The filter to search for the Comment to update in case it exists.
     */
    where: CommentWhereUniqueInput
    /**
     * In case the Comment found by the `where` argument doesn't exist, create a new Comment with this data.
     */
    create: XOR<CommentCreateInput, CommentUncheckedCreateInput>
    /**
     * In case the Comment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CommentUpdateInput, CommentUncheckedUpdateInput>
  }

  /**
   * Comment delete
   */
  export type CommentDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter which Comment to delete.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment deleteMany
   */
  export type CommentDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Comments to delete
     */
    where?: CommentWhereInput
    /**
     * Limit how many Comments to delete.
     */
    limit?: number
  }

  /**
   * Comment.parent
   */
  export type Comment$parentArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
  }

  /**
   * Comment.replies
   */
  export type Comment$repliesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?:
      | CommentOrderByWithRelationInput
      | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Comment without action
   */
  export type CommentDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
  }

  /**
   * Model ListingApproval
   */

  export type AggregateListingApproval = {
    _count: ListingApprovalCountAggregateOutputType | null
    _min: ListingApprovalMinAggregateOutputType | null
    _max: ListingApprovalMaxAggregateOutputType | null
  }

  export type ListingApprovalMinAggregateOutputType = {
    id: string | null
    listingId: string | null
    approvedById: string | null
    approvedByRole: $Enums.Role | null
    approvedAt: Date | null
    status: $Enums.ApprovalStatus | null
    notes: string | null
  }

  export type ListingApprovalMaxAggregateOutputType = {
    id: string | null
    listingId: string | null
    approvedById: string | null
    approvedByRole: $Enums.Role | null
    approvedAt: Date | null
    status: $Enums.ApprovalStatus | null
    notes: string | null
  }

  export type ListingApprovalCountAggregateOutputType = {
    id: number
    listingId: number
    approvedById: number
    approvedByRole: number
    approvedAt: number
    status: number
    notes: number
    _all: number
  }

  export type ListingApprovalMinAggregateInputType = {
    id?: true
    listingId?: true
    approvedById?: true
    approvedByRole?: true
    approvedAt?: true
    status?: true
    notes?: true
  }

  export type ListingApprovalMaxAggregateInputType = {
    id?: true
    listingId?: true
    approvedById?: true
    approvedByRole?: true
    approvedAt?: true
    status?: true
    notes?: true
  }

  export type ListingApprovalCountAggregateInputType = {
    id?: true
    listingId?: true
    approvedById?: true
    approvedByRole?: true
    approvedAt?: true
    status?: true
    notes?: true
    _all?: true
  }

  export type ListingApprovalAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which ListingApproval to aggregate.
     */
    where?: ListingApprovalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ListingApprovals to fetch.
     */
    orderBy?:
      | ListingApprovalOrderByWithRelationInput
      | ListingApprovalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: ListingApprovalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ListingApprovals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ListingApprovals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned ListingApprovals
     **/
    _count?: true | ListingApprovalCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: ListingApprovalMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: ListingApprovalMaxAggregateInputType
  }

  export type GetListingApprovalAggregateType<
    T extends ListingApprovalAggregateArgs,
  > = {
    [P in keyof T & keyof AggregateListingApproval]: P extends
      | '_count'
      | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateListingApproval[P]>
      : GetScalarType<T[P], AggregateListingApproval[P]>
  }

  export type ListingApprovalGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ListingApprovalWhereInput
    orderBy?:
      | ListingApprovalOrderByWithAggregationInput
      | ListingApprovalOrderByWithAggregationInput[]
    by: ListingApprovalScalarFieldEnum[] | ListingApprovalScalarFieldEnum
    having?: ListingApprovalScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ListingApprovalCountAggregateInputType | true
    _min?: ListingApprovalMinAggregateInputType
    _max?: ListingApprovalMaxAggregateInputType
  }

  export type ListingApprovalGroupByOutputType = {
    id: string
    listingId: string
    approvedById: string
    approvedByRole: $Enums.Role
    approvedAt: Date
    status: $Enums.ApprovalStatus
    notes: string | null
    _count: ListingApprovalCountAggregateOutputType | null
    _min: ListingApprovalMinAggregateOutputType | null
    _max: ListingApprovalMaxAggregateOutputType | null
  }

  type GetListingApprovalGroupByPayload<T extends ListingApprovalGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<ListingApprovalGroupByOutputType, T['by']> & {
          [P in keyof T &
            keyof ListingApprovalGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ListingApprovalGroupByOutputType[P]>
            : GetScalarType<T[P], ListingApprovalGroupByOutputType[P]>
        }
      >
    >

  export type ListingApprovalSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      listingId?: boolean
      approvedById?: boolean
      approvedByRole?: boolean
      approvedAt?: boolean
      status?: boolean
      notes?: boolean
      listing?: boolean | ListingDefaultArgs<ExtArgs>
      approvedBy?: boolean | UserDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['listingApproval']
  >

  export type ListingApprovalSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      listingId?: boolean
      approvedById?: boolean
      approvedByRole?: boolean
      approvedAt?: boolean
      status?: boolean
      notes?: boolean
      listing?: boolean | ListingDefaultArgs<ExtArgs>
      approvedBy?: boolean | UserDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['listingApproval']
  >

  export type ListingApprovalSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean
      listingId?: boolean
      approvedById?: boolean
      approvedByRole?: boolean
      approvedAt?: boolean
      status?: boolean
      notes?: boolean
      listing?: boolean | ListingDefaultArgs<ExtArgs>
      approvedBy?: boolean | UserDefaultArgs<ExtArgs>
    },
    ExtArgs['result']['listingApproval']
  >

  export type ListingApprovalSelectScalar = {
    id?: boolean
    listingId?: boolean
    approvedById?: boolean
    approvedByRole?: boolean
    approvedAt?: boolean
    status?: boolean
    notes?: boolean
  }

  export type ListingApprovalOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'listingId'
    | 'approvedById'
    | 'approvedByRole'
    | 'approvedAt'
    | 'status'
    | 'notes',
    ExtArgs['result']['listingApproval']
  >
  export type ListingApprovalInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listing?: boolean | ListingDefaultArgs<ExtArgs>
    approvedBy?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ListingApprovalIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listing?: boolean | ListingDefaultArgs<ExtArgs>
    approvedBy?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ListingApprovalIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    listing?: boolean | ListingDefaultArgs<ExtArgs>
    approvedBy?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $ListingApprovalPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'ListingApproval'
    objects: {
      listing: Prisma.$ListingPayload<ExtArgs>
      approvedBy: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<
      {
        id: string
        listingId: string
        approvedById: string
        approvedByRole: $Enums.Role
        approvedAt: Date
        status: $Enums.ApprovalStatus
        notes: string | null
      },
      ExtArgs['result']['listingApproval']
    >
    composites: {}
  }

  type ListingApprovalGetPayload<
    S extends boolean | null | undefined | ListingApprovalDefaultArgs,
  > = $Result.GetResult<Prisma.$ListingApprovalPayload, S>

  type ListingApprovalCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    ListingApprovalFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: ListingApprovalCountAggregateInputType | true
  }

  export interface ListingApprovalDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['ListingApproval']
      meta: { name: 'ListingApproval' }
    }
    /**
     * Find zero or one ListingApproval that matches the filter.
     * @param {ListingApprovalFindUniqueArgs} args - Arguments to find a ListingApproval
     * @example
     * // Get one ListingApproval
     * const listingApproval = await prisma.listingApproval.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ListingApprovalFindUniqueArgs>(
      args: SelectSubset<T, ListingApprovalFindUniqueArgs<ExtArgs>>,
    ): Prisma__ListingApprovalClient<
      $Result.GetResult<
        Prisma.$ListingApprovalPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find one ListingApproval that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ListingApprovalFindUniqueOrThrowArgs} args - Arguments to find a ListingApproval
     * @example
     * // Get one ListingApproval
     * const listingApproval = await prisma.listingApproval.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ListingApprovalFindUniqueOrThrowArgs>(
      args: SelectSubset<T, ListingApprovalFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__ListingApprovalClient<
      $Result.GetResult<
        Prisma.$ListingApprovalPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first ListingApproval that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingApprovalFindFirstArgs} args - Arguments to find a ListingApproval
     * @example
     * // Get one ListingApproval
     * const listingApproval = await prisma.listingApproval.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ListingApprovalFindFirstArgs>(
      args?: SelectSubset<T, ListingApprovalFindFirstArgs<ExtArgs>>,
    ): Prisma__ListingApprovalClient<
      $Result.GetResult<
        Prisma.$ListingApprovalPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find the first ListingApproval that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingApprovalFindFirstOrThrowArgs} args - Arguments to find a ListingApproval
     * @example
     * // Get one ListingApproval
     * const listingApproval = await prisma.listingApproval.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ListingApprovalFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ListingApprovalFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__ListingApprovalClient<
      $Result.GetResult<
        Prisma.$ListingApprovalPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Find zero or more ListingApprovals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingApprovalFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ListingApprovals
     * const listingApprovals = await prisma.listingApproval.findMany()
     *
     * // Get first 10 ListingApprovals
     * const listingApprovals = await prisma.listingApproval.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const listingApprovalWithIdOnly = await prisma.listingApproval.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ListingApprovalFindManyArgs>(
      args?: SelectSubset<T, ListingApprovalFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ListingApprovalPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >

    /**
     * Create a ListingApproval.
     * @param {ListingApprovalCreateArgs} args - Arguments to create a ListingApproval.
     * @example
     * // Create one ListingApproval
     * const ListingApproval = await prisma.listingApproval.create({
     *   data: {
     *     // ... data to create a ListingApproval
     *   }
     * })
     *
     */
    create<T extends ListingApprovalCreateArgs>(
      args: SelectSubset<T, ListingApprovalCreateArgs<ExtArgs>>,
    ): Prisma__ListingApprovalClient<
      $Result.GetResult<
        Prisma.$ListingApprovalPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Create many ListingApprovals.
     * @param {ListingApprovalCreateManyArgs} args - Arguments to create many ListingApprovals.
     * @example
     * // Create many ListingApprovals
     * const listingApproval = await prisma.listingApproval.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ListingApprovalCreateManyArgs>(
      args?: SelectSubset<T, ListingApprovalCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ListingApprovals and returns the data saved in the database.
     * @param {ListingApprovalCreateManyAndReturnArgs} args - Arguments to create many ListingApprovals.
     * @example
     * // Create many ListingApprovals
     * const listingApproval = await prisma.listingApproval.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many ListingApprovals and only return the `id`
     * const listingApprovalWithIdOnly = await prisma.listingApproval.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ListingApprovalCreateManyAndReturnArgs>(
      args?: SelectSubset<T, ListingApprovalCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ListingApprovalPayload<ExtArgs>,
        T,
        'createManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Delete a ListingApproval.
     * @param {ListingApprovalDeleteArgs} args - Arguments to delete one ListingApproval.
     * @example
     * // Delete one ListingApproval
     * const ListingApproval = await prisma.listingApproval.delete({
     *   where: {
     *     // ... filter to delete one ListingApproval
     *   }
     * })
     *
     */
    delete<T extends ListingApprovalDeleteArgs>(
      args: SelectSubset<T, ListingApprovalDeleteArgs<ExtArgs>>,
    ): Prisma__ListingApprovalClient<
      $Result.GetResult<
        Prisma.$ListingApprovalPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Update one ListingApproval.
     * @param {ListingApprovalUpdateArgs} args - Arguments to update one ListingApproval.
     * @example
     * // Update one ListingApproval
     * const listingApproval = await prisma.listingApproval.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ListingApprovalUpdateArgs>(
      args: SelectSubset<T, ListingApprovalUpdateArgs<ExtArgs>>,
    ): Prisma__ListingApprovalClient<
      $Result.GetResult<
        Prisma.$ListingApprovalPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Delete zero or more ListingApprovals.
     * @param {ListingApprovalDeleteManyArgs} args - Arguments to filter ListingApprovals to delete.
     * @example
     * // Delete a few ListingApprovals
     * const { count } = await prisma.listingApproval.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ListingApprovalDeleteManyArgs>(
      args?: SelectSubset<T, ListingApprovalDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ListingApprovals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingApprovalUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ListingApprovals
     * const listingApproval = await prisma.listingApproval.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ListingApprovalUpdateManyArgs>(
      args: SelectSubset<T, ListingApprovalUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ListingApprovals and returns the data updated in the database.
     * @param {ListingApprovalUpdateManyAndReturnArgs} args - Arguments to update many ListingApprovals.
     * @example
     * // Update many ListingApprovals
     * const listingApproval = await prisma.listingApproval.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more ListingApprovals and only return the `id`
     * const listingApprovalWithIdOnly = await prisma.listingApproval.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ListingApprovalUpdateManyAndReturnArgs>(
      args: SelectSubset<T, ListingApprovalUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ListingApprovalPayload<ExtArgs>,
        T,
        'updateManyAndReturn',
        GlobalOmitOptions
      >
    >

    /**
     * Create or update one ListingApproval.
     * @param {ListingApprovalUpsertArgs} args - Arguments to update or create a ListingApproval.
     * @example
     * // Update or create a ListingApproval
     * const listingApproval = await prisma.listingApproval.upsert({
     *   create: {
     *     // ... data to create a ListingApproval
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ListingApproval we want to update
     *   }
     * })
     */
    upsert<T extends ListingApprovalUpsertArgs>(
      args: SelectSubset<T, ListingApprovalUpsertArgs<ExtArgs>>,
    ): Prisma__ListingApprovalClient<
      $Result.GetResult<
        Prisma.$ListingApprovalPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >

    /**
     * Count the number of ListingApprovals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingApprovalCountArgs} args - Arguments to filter ListingApprovals to count.
     * @example
     * // Count the number of ListingApprovals
     * const count = await prisma.listingApproval.count({
     *   where: {
     *     // ... the filter for the ListingApprovals we want to count
     *   }
     * })
     **/
    count<T extends ListingApprovalCountArgs>(
      args?: Subset<T, ListingApprovalCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ListingApprovalCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ListingApproval.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingApprovalAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends ListingApprovalAggregateArgs>(
      args: Subset<T, ListingApprovalAggregateArgs>,
    ): Prisma.PrismaPromise<GetListingApprovalAggregateType<T>>

    /**
     * Group by ListingApproval.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ListingApprovalGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends ListingApprovalGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ListingApprovalGroupByArgs['orderBy'] }
        : { orderBy?: ListingApprovalGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ]
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, ListingApprovalGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetListingApprovalGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>
    /**
     * Fields of the ListingApproval model
     */
    readonly fields: ListingApprovalFieldRefs
  }

  /**
   * The delegate class that acts as a "Promise-like" for ListingApproval.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ListingApprovalClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise'
    listing<T extends ListingDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, ListingDefaultArgs<ExtArgs>>,
    ): Prisma__ListingClient<
      | $Result.GetResult<
          Prisma.$ListingPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    approvedBy<T extends UserDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, UserDefaultArgs<ExtArgs>>,
    ): Prisma__UserClient<
      | $Result.GetResult<
          Prisma.$UserPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }

  /**
   * Fields of the ListingApproval model
   */
  interface ListingApprovalFieldRefs {
    readonly id: FieldRef<'ListingApproval', 'String'>
    readonly listingId: FieldRef<'ListingApproval', 'String'>
    readonly approvedById: FieldRef<'ListingApproval', 'String'>
    readonly approvedByRole: FieldRef<'ListingApproval', 'Role'>
    readonly approvedAt: FieldRef<'ListingApproval', 'DateTime'>
    readonly status: FieldRef<'ListingApproval', 'ApprovalStatus'>
    readonly notes: FieldRef<'ListingApproval', 'String'>
  }

  // Custom InputTypes
  /**
   * ListingApproval findUnique
   */
  export type ListingApprovalFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
    /**
     * Filter, which ListingApproval to fetch.
     */
    where: ListingApprovalWhereUniqueInput
  }

  /**
   * ListingApproval findUniqueOrThrow
   */
  export type ListingApprovalFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
    /**
     * Filter, which ListingApproval to fetch.
     */
    where: ListingApprovalWhereUniqueInput
  }

  /**
   * ListingApproval findFirst
   */
  export type ListingApprovalFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
    /**
     * Filter, which ListingApproval to fetch.
     */
    where?: ListingApprovalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ListingApprovals to fetch.
     */
    orderBy?:
      | ListingApprovalOrderByWithRelationInput
      | ListingApprovalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ListingApprovals.
     */
    cursor?: ListingApprovalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ListingApprovals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ListingApprovals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ListingApprovals.
     */
    distinct?: ListingApprovalScalarFieldEnum | ListingApprovalScalarFieldEnum[]
  }

  /**
   * ListingApproval findFirstOrThrow
   */
  export type ListingApprovalFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
    /**
     * Filter, which ListingApproval to fetch.
     */
    where?: ListingApprovalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ListingApprovals to fetch.
     */
    orderBy?:
      | ListingApprovalOrderByWithRelationInput
      | ListingApprovalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ListingApprovals.
     */
    cursor?: ListingApprovalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ListingApprovals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ListingApprovals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ListingApprovals.
     */
    distinct?: ListingApprovalScalarFieldEnum | ListingApprovalScalarFieldEnum[]
  }

  /**
   * ListingApproval findMany
   */
  export type ListingApprovalFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
    /**
     * Filter, which ListingApprovals to fetch.
     */
    where?: ListingApprovalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ListingApprovals to fetch.
     */
    orderBy?:
      | ListingApprovalOrderByWithRelationInput
      | ListingApprovalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing ListingApprovals.
     */
    cursor?: ListingApprovalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ListingApprovals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ListingApprovals.
     */
    skip?: number
    distinct?: ListingApprovalScalarFieldEnum | ListingApprovalScalarFieldEnum[]
  }

  /**
   * ListingApproval create
   */
  export type ListingApprovalCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
    /**
     * The data needed to create a ListingApproval.
     */
    data: XOR<ListingApprovalCreateInput, ListingApprovalUncheckedCreateInput>
  }

  /**
   * ListingApproval createMany
   */
  export type ListingApprovalCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many ListingApprovals.
     */
    data: ListingApprovalCreateManyInput | ListingApprovalCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ListingApproval createManyAndReturn
   */
  export type ListingApprovalCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * The data used to create many ListingApprovals.
     */
    data: ListingApprovalCreateManyInput | ListingApprovalCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ListingApproval update
   */
  export type ListingApprovalUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
    /**
     * The data needed to update a ListingApproval.
     */
    data: XOR<ListingApprovalUpdateInput, ListingApprovalUncheckedUpdateInput>
    /**
     * Choose, which ListingApproval to update.
     */
    where: ListingApprovalWhereUniqueInput
  }

  /**
   * ListingApproval updateMany
   */
  export type ListingApprovalUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update ListingApprovals.
     */
    data: XOR<
      ListingApprovalUpdateManyMutationInput,
      ListingApprovalUncheckedUpdateManyInput
    >
    /**
     * Filter which ListingApprovals to update
     */
    where?: ListingApprovalWhereInput
    /**
     * Limit how many ListingApprovals to update.
     */
    limit?: number
  }

  /**
   * ListingApproval updateManyAndReturn
   */
  export type ListingApprovalUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * The data used to update ListingApprovals.
     */
    data: XOR<
      ListingApprovalUpdateManyMutationInput,
      ListingApprovalUncheckedUpdateManyInput
    >
    /**
     * Filter which ListingApprovals to update
     */
    where?: ListingApprovalWhereInput
    /**
     * Limit how many ListingApprovals to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ListingApproval upsert
   */
  export type ListingApprovalUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
    /**
     * The filter to search for the ListingApproval to update in case it exists.
     */
    where: ListingApprovalWhereUniqueInput
    /**
     * In case the ListingApproval found by the `where` argument doesn't exist, create a new ListingApproval with this data.
     */
    create: XOR<ListingApprovalCreateInput, ListingApprovalUncheckedCreateInput>
    /**
     * In case the ListingApproval was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ListingApprovalUpdateInput, ListingApprovalUncheckedUpdateInput>
  }

  /**
   * ListingApproval delete
   */
  export type ListingApprovalDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
    /**
     * Filter which ListingApproval to delete.
     */
    where: ListingApprovalWhereUniqueInput
  }

  /**
   * ListingApproval deleteMany
   */
  export type ListingApprovalDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which ListingApprovals to delete
     */
    where?: ListingApprovalWhereInput
    /**
     * Limit how many ListingApprovals to delete.
     */
    limit?: number
  }

  /**
   * ListingApproval without action
   */
  export type ListingApprovalDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ListingApproval
     */
    select?: ListingApprovalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ListingApproval
     */
    omit?: ListingApprovalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ListingApprovalInclude<ExtArgs> | null
  }

  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted'
    ReadCommitted: 'ReadCommitted'
    RepeatableRead: 'RepeatableRead'
    Serializable: 'Serializable'
  }

  export type TransactionIsolationLevel =
    (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]

  export const UserScalarFieldEnum: {
    id: 'id'
    email: 'email'
    hashedPassword: 'hashedPassword'
    name: 'name'
    profileImage: 'profileImage'
    role: 'role'
    createdAt: 'createdAt'
  }

  export type UserScalarFieldEnum =
    (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]

  export const DeviceScalarFieldEnum: {
    id: 'id'
    brand: 'brand'
    modelName: 'modelName'
  }

  export type DeviceScalarFieldEnum =
    (typeof DeviceScalarFieldEnum)[keyof typeof DeviceScalarFieldEnum]

  export const SystemScalarFieldEnum: {
    id: 'id'
    name: 'name'
  }

  export type SystemScalarFieldEnum =
    (typeof SystemScalarFieldEnum)[keyof typeof SystemScalarFieldEnum]

  export const GameScalarFieldEnum: {
    id: 'id'
    title: 'title'
    systemId: 'systemId'
    imageUrl: 'imageUrl'
  }

  export type GameScalarFieldEnum =
    (typeof GameScalarFieldEnum)[keyof typeof GameScalarFieldEnum]

  export const EmulatorScalarFieldEnum: {
    id: 'id'
    name: 'name'
  }

  export type EmulatorScalarFieldEnum =
    (typeof EmulatorScalarFieldEnum)[keyof typeof EmulatorScalarFieldEnum]

  export const PerformanceScaleScalarFieldEnum: {
    id: 'id'
    label: 'label'
    rank: 'rank'
  }

  export type PerformanceScaleScalarFieldEnum =
    (typeof PerformanceScaleScalarFieldEnum)[keyof typeof PerformanceScaleScalarFieldEnum]

  export const ListingScalarFieldEnum: {
    id: 'id'
    deviceId: 'deviceId'
    gameId: 'gameId'
    emulatorId: 'emulatorId'
    performanceId: 'performanceId'
    notes: 'notes'
    authorId: 'authorId'
    createdAt: 'createdAt'
  }

  export type ListingScalarFieldEnum =
    (typeof ListingScalarFieldEnum)[keyof typeof ListingScalarFieldEnum]

  export const VoteScalarFieldEnum: {
    id: 'id'
    value: 'value'
    userId: 'userId'
    listingId: 'listingId'
  }

  export type VoteScalarFieldEnum =
    (typeof VoteScalarFieldEnum)[keyof typeof VoteScalarFieldEnum]

  export const CommentScalarFieldEnum: {
    id: 'id'
    content: 'content'
    userId: 'userId'
    listingId: 'listingId'
    parentId: 'parentId'
    createdAt: 'createdAt'
  }

  export type CommentScalarFieldEnum =
    (typeof CommentScalarFieldEnum)[keyof typeof CommentScalarFieldEnum]

  export const ListingApprovalScalarFieldEnum: {
    id: 'id'
    listingId: 'listingId'
    approvedById: 'approvedById'
    approvedByRole: 'approvedByRole'
    approvedAt: 'approvedAt'
    status: 'status'
    notes: 'notes'
  }

  export type ListingApprovalScalarFieldEnum =
    (typeof ListingApprovalScalarFieldEnum)[keyof typeof ListingApprovalScalarFieldEnum]

  export const SortOrder: {
    asc: 'asc'
    desc: 'desc'
  }

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]

  export const QueryMode: {
    default: 'default'
    insensitive: 'insensitive'
  }

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]

  export const NullsOrder: {
    first: 'first'
    last: 'last'
  }

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]

  /**
   * Field references
   */

  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'String'
  >

  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'String[]'
  >

  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Role'
  >

  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Role[]'
  >

  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'DateTime'
  >

  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'DateTime[]'
  >

  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Int'
  >

  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Int[]'
  >

  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Boolean'
  >

  /**
   * Reference to a field of type 'ApprovalStatus'
   */
  export type EnumApprovalStatusFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'ApprovalStatus'
  >

  /**
   * Reference to a field of type 'ApprovalStatus[]'
   */
  export type ListEnumApprovalStatusFieldRefInput<$PrismaModel> =
    FieldRefInputType<$PrismaModel, 'ApprovalStatus[]'>

  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Float'
  >

  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Float[]'
  >

  /**
   * Deep Input Types
   */

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<'User'> | string
    email?: StringFilter<'User'> | string
    hashedPassword?: StringFilter<'User'> | string
    name?: StringNullableFilter<'User'> | string | null
    profileImage?: StringNullableFilter<'User'> | string | null
    role?: EnumRoleFilter<'User'> | $Enums.Role
    createdAt?: DateTimeFilter<'User'> | Date | string
    listings?: ListingListRelationFilter
    votes?: VoteListRelationFilter
    comments?: CommentListRelationFilter
    approvalsGiven?: ListingApprovalListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    hashedPassword?: SortOrder
    name?: SortOrderInput | SortOrder
    profileImage?: SortOrderInput | SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    listings?: ListingOrderByRelationAggregateInput
    votes?: VoteOrderByRelationAggregateInput
    comments?: CommentOrderByRelationAggregateInput
    approvalsGiven?: ListingApprovalOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string
      email?: string
      AND?: UserWhereInput | UserWhereInput[]
      OR?: UserWhereInput[]
      NOT?: UserWhereInput | UserWhereInput[]
      hashedPassword?: StringFilter<'User'> | string
      name?: StringNullableFilter<'User'> | string | null
      profileImage?: StringNullableFilter<'User'> | string | null
      role?: EnumRoleFilter<'User'> | $Enums.Role
      createdAt?: DateTimeFilter<'User'> | Date | string
      listings?: ListingListRelationFilter
      votes?: VoteListRelationFilter
      comments?: CommentListRelationFilter
      approvalsGiven?: ListingApprovalListRelationFilter
    },
    'id' | 'email'
  >

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    hashedPassword?: SortOrder
    name?: SortOrderInput | SortOrder
    profileImage?: SortOrderInput | SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?:
      | UserScalarWhereWithAggregatesInput
      | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?:
      | UserScalarWhereWithAggregatesInput
      | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<'User'> | string
    email?: StringWithAggregatesFilter<'User'> | string
    hashedPassword?: StringWithAggregatesFilter<'User'> | string
    name?: StringNullableWithAggregatesFilter<'User'> | string | null
    profileImage?: StringNullableWithAggregatesFilter<'User'> | string | null
    role?: EnumRoleWithAggregatesFilter<'User'> | $Enums.Role
    createdAt?: DateTimeWithAggregatesFilter<'User'> | Date | string
  }

  export type DeviceWhereInput = {
    AND?: DeviceWhereInput | DeviceWhereInput[]
    OR?: DeviceWhereInput[]
    NOT?: DeviceWhereInput | DeviceWhereInput[]
    id?: StringFilter<'Device'> | string
    brand?: StringFilter<'Device'> | string
    modelName?: StringFilter<'Device'> | string
    listings?: ListingListRelationFilter
  }

  export type DeviceOrderByWithRelationInput = {
    id?: SortOrder
    brand?: SortOrder
    modelName?: SortOrder
    listings?: ListingOrderByRelationAggregateInput
  }

  export type DeviceWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string
      AND?: DeviceWhereInput | DeviceWhereInput[]
      OR?: DeviceWhereInput[]
      NOT?: DeviceWhereInput | DeviceWhereInput[]
      brand?: StringFilter<'Device'> | string
      modelName?: StringFilter<'Device'> | string
      listings?: ListingListRelationFilter
    },
    'id'
  >

  export type DeviceOrderByWithAggregationInput = {
    id?: SortOrder
    brand?: SortOrder
    modelName?: SortOrder
    _count?: DeviceCountOrderByAggregateInput
    _max?: DeviceMaxOrderByAggregateInput
    _min?: DeviceMinOrderByAggregateInput
  }

  export type DeviceScalarWhereWithAggregatesInput = {
    AND?:
      | DeviceScalarWhereWithAggregatesInput
      | DeviceScalarWhereWithAggregatesInput[]
    OR?: DeviceScalarWhereWithAggregatesInput[]
    NOT?:
      | DeviceScalarWhereWithAggregatesInput
      | DeviceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<'Device'> | string
    brand?: StringWithAggregatesFilter<'Device'> | string
    modelName?: StringWithAggregatesFilter<'Device'> | string
  }

  export type SystemWhereInput = {
    AND?: SystemWhereInput | SystemWhereInput[]
    OR?: SystemWhereInput[]
    NOT?: SystemWhereInput | SystemWhereInput[]
    id?: StringFilter<'System'> | string
    name?: StringFilter<'System'> | string
    games?: GameListRelationFilter
  }

  export type SystemOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    games?: GameOrderByRelationAggregateInput
  }

  export type SystemWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string
      name?: string
      AND?: SystemWhereInput | SystemWhereInput[]
      OR?: SystemWhereInput[]
      NOT?: SystemWhereInput | SystemWhereInput[]
      games?: GameListRelationFilter
    },
    'id' | 'name'
  >

  export type SystemOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    _count?: SystemCountOrderByAggregateInput
    _max?: SystemMaxOrderByAggregateInput
    _min?: SystemMinOrderByAggregateInput
  }

  export type SystemScalarWhereWithAggregatesInput = {
    AND?:
      | SystemScalarWhereWithAggregatesInput
      | SystemScalarWhereWithAggregatesInput[]
    OR?: SystemScalarWhereWithAggregatesInput[]
    NOT?:
      | SystemScalarWhereWithAggregatesInput
      | SystemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<'System'> | string
    name?: StringWithAggregatesFilter<'System'> | string
  }

  export type GameWhereInput = {
    AND?: GameWhereInput | GameWhereInput[]
    OR?: GameWhereInput[]
    NOT?: GameWhereInput | GameWhereInput[]
    id?: StringFilter<'Game'> | string
    title?: StringFilter<'Game'> | string
    systemId?: StringFilter<'Game'> | string
    imageUrl?: StringNullableFilter<'Game'> | string | null
    system?: XOR<SystemScalarRelationFilter, SystemWhereInput>
    listings?: ListingListRelationFilter
  }

  export type GameOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    systemId?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    system?: SystemOrderByWithRelationInput
    listings?: ListingOrderByRelationAggregateInput
  }

  export type GameWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string
      AND?: GameWhereInput | GameWhereInput[]
      OR?: GameWhereInput[]
      NOT?: GameWhereInput | GameWhereInput[]
      title?: StringFilter<'Game'> | string
      systemId?: StringFilter<'Game'> | string
      imageUrl?: StringNullableFilter<'Game'> | string | null
      system?: XOR<SystemScalarRelationFilter, SystemWhereInput>
      listings?: ListingListRelationFilter
    },
    'id'
  >

  export type GameOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    systemId?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    _count?: GameCountOrderByAggregateInput
    _max?: GameMaxOrderByAggregateInput
    _min?: GameMinOrderByAggregateInput
  }

  export type GameScalarWhereWithAggregatesInput = {
    AND?:
      | GameScalarWhereWithAggregatesInput
      | GameScalarWhereWithAggregatesInput[]
    OR?: GameScalarWhereWithAggregatesInput[]
    NOT?:
      | GameScalarWhereWithAggregatesInput
      | GameScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<'Game'> | string
    title?: StringWithAggregatesFilter<'Game'> | string
    systemId?: StringWithAggregatesFilter<'Game'> | string
    imageUrl?: StringNullableWithAggregatesFilter<'Game'> | string | null
  }

  export type EmulatorWhereInput = {
    AND?: EmulatorWhereInput | EmulatorWhereInput[]
    OR?: EmulatorWhereInput[]
    NOT?: EmulatorWhereInput | EmulatorWhereInput[]
    id?: StringFilter<'Emulator'> | string
    name?: StringFilter<'Emulator'> | string
    listings?: ListingListRelationFilter
  }

  export type EmulatorOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    listings?: ListingOrderByRelationAggregateInput
  }

  export type EmulatorWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string
      name?: string
      AND?: EmulatorWhereInput | EmulatorWhereInput[]
      OR?: EmulatorWhereInput[]
      NOT?: EmulatorWhereInput | EmulatorWhereInput[]
      listings?: ListingListRelationFilter
    },
    'id' | 'name'
  >

  export type EmulatorOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    _count?: EmulatorCountOrderByAggregateInput
    _max?: EmulatorMaxOrderByAggregateInput
    _min?: EmulatorMinOrderByAggregateInput
  }

  export type EmulatorScalarWhereWithAggregatesInput = {
    AND?:
      | EmulatorScalarWhereWithAggregatesInput
      | EmulatorScalarWhereWithAggregatesInput[]
    OR?: EmulatorScalarWhereWithAggregatesInput[]
    NOT?:
      | EmulatorScalarWhereWithAggregatesInput
      | EmulatorScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<'Emulator'> | string
    name?: StringWithAggregatesFilter<'Emulator'> | string
  }

  export type PerformanceScaleWhereInput = {
    AND?: PerformanceScaleWhereInput | PerformanceScaleWhereInput[]
    OR?: PerformanceScaleWhereInput[]
    NOT?: PerformanceScaleWhereInput | PerformanceScaleWhereInput[]
    id?: IntFilter<'PerformanceScale'> | number
    label?: StringFilter<'PerformanceScale'> | string
    rank?: IntFilter<'PerformanceScale'> | number
    listings?: ListingListRelationFilter
  }

  export type PerformanceScaleOrderByWithRelationInput = {
    id?: SortOrder
    label?: SortOrder
    rank?: SortOrder
    listings?: ListingOrderByRelationAggregateInput
  }

  export type PerformanceScaleWhereUniqueInput = Prisma.AtLeast<
    {
      id?: number
      label?: string
      AND?: PerformanceScaleWhereInput | PerformanceScaleWhereInput[]
      OR?: PerformanceScaleWhereInput[]
      NOT?: PerformanceScaleWhereInput | PerformanceScaleWhereInput[]
      rank?: IntFilter<'PerformanceScale'> | number
      listings?: ListingListRelationFilter
    },
    'id' | 'label'
  >

  export type PerformanceScaleOrderByWithAggregationInput = {
    id?: SortOrder
    label?: SortOrder
    rank?: SortOrder
    _count?: PerformanceScaleCountOrderByAggregateInput
    _avg?: PerformanceScaleAvgOrderByAggregateInput
    _max?: PerformanceScaleMaxOrderByAggregateInput
    _min?: PerformanceScaleMinOrderByAggregateInput
    _sum?: PerformanceScaleSumOrderByAggregateInput
  }

  export type PerformanceScaleScalarWhereWithAggregatesInput = {
    AND?:
      | PerformanceScaleScalarWhereWithAggregatesInput
      | PerformanceScaleScalarWhereWithAggregatesInput[]
    OR?: PerformanceScaleScalarWhereWithAggregatesInput[]
    NOT?:
      | PerformanceScaleScalarWhereWithAggregatesInput
      | PerformanceScaleScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<'PerformanceScale'> | number
    label?: StringWithAggregatesFilter<'PerformanceScale'> | string
    rank?: IntWithAggregatesFilter<'PerformanceScale'> | number
  }

  export type ListingWhereInput = {
    AND?: ListingWhereInput | ListingWhereInput[]
    OR?: ListingWhereInput[]
    NOT?: ListingWhereInput | ListingWhereInput[]
    id?: StringFilter<'Listing'> | string
    deviceId?: StringFilter<'Listing'> | string
    gameId?: StringFilter<'Listing'> | string
    emulatorId?: StringFilter<'Listing'> | string
    performanceId?: IntFilter<'Listing'> | number
    notes?: StringNullableFilter<'Listing'> | string | null
    authorId?: StringFilter<'Listing'> | string
    createdAt?: DateTimeFilter<'Listing'> | Date | string
    device?: XOR<DeviceScalarRelationFilter, DeviceWhereInput>
    game?: XOR<GameScalarRelationFilter, GameWhereInput>
    emulator?: XOR<EmulatorScalarRelationFilter, EmulatorWhereInput>
    performance?: XOR<
      PerformanceScaleScalarRelationFilter,
      PerformanceScaleWhereInput
    >
    author?: XOR<UserScalarRelationFilter, UserWhereInput>
    votes?: VoteListRelationFilter
    comments?: CommentListRelationFilter
    approvals?: ListingApprovalListRelationFilter
  }

  export type ListingOrderByWithRelationInput = {
    id?: SortOrder
    deviceId?: SortOrder
    gameId?: SortOrder
    emulatorId?: SortOrder
    performanceId?: SortOrder
    notes?: SortOrderInput | SortOrder
    authorId?: SortOrder
    createdAt?: SortOrder
    device?: DeviceOrderByWithRelationInput
    game?: GameOrderByWithRelationInput
    emulator?: EmulatorOrderByWithRelationInput
    performance?: PerformanceScaleOrderByWithRelationInput
    author?: UserOrderByWithRelationInput
    votes?: VoteOrderByRelationAggregateInput
    comments?: CommentOrderByRelationAggregateInput
    approvals?: ListingApprovalOrderByRelationAggregateInput
  }

  export type ListingWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string
      AND?: ListingWhereInput | ListingWhereInput[]
      OR?: ListingWhereInput[]
      NOT?: ListingWhereInput | ListingWhereInput[]
      deviceId?: StringFilter<'Listing'> | string
      gameId?: StringFilter<'Listing'> | string
      emulatorId?: StringFilter<'Listing'> | string
      performanceId?: IntFilter<'Listing'> | number
      notes?: StringNullableFilter<'Listing'> | string | null
      authorId?: StringFilter<'Listing'> | string
      createdAt?: DateTimeFilter<'Listing'> | Date | string
      device?: XOR<DeviceScalarRelationFilter, DeviceWhereInput>
      game?: XOR<GameScalarRelationFilter, GameWhereInput>
      emulator?: XOR<EmulatorScalarRelationFilter, EmulatorWhereInput>
      performance?: XOR<
        PerformanceScaleScalarRelationFilter,
        PerformanceScaleWhereInput
      >
      author?: XOR<UserScalarRelationFilter, UserWhereInput>
      votes?: VoteListRelationFilter
      comments?: CommentListRelationFilter
      approvals?: ListingApprovalListRelationFilter
    },
    'id'
  >

  export type ListingOrderByWithAggregationInput = {
    id?: SortOrder
    deviceId?: SortOrder
    gameId?: SortOrder
    emulatorId?: SortOrder
    performanceId?: SortOrder
    notes?: SortOrderInput | SortOrder
    authorId?: SortOrder
    createdAt?: SortOrder
    _count?: ListingCountOrderByAggregateInput
    _avg?: ListingAvgOrderByAggregateInput
    _max?: ListingMaxOrderByAggregateInput
    _min?: ListingMinOrderByAggregateInput
    _sum?: ListingSumOrderByAggregateInput
  }

  export type ListingScalarWhereWithAggregatesInput = {
    AND?:
      | ListingScalarWhereWithAggregatesInput
      | ListingScalarWhereWithAggregatesInput[]
    OR?: ListingScalarWhereWithAggregatesInput[]
    NOT?:
      | ListingScalarWhereWithAggregatesInput
      | ListingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<'Listing'> | string
    deviceId?: StringWithAggregatesFilter<'Listing'> | string
    gameId?: StringWithAggregatesFilter<'Listing'> | string
    emulatorId?: StringWithAggregatesFilter<'Listing'> | string
    performanceId?: IntWithAggregatesFilter<'Listing'> | number
    notes?: StringNullableWithAggregatesFilter<'Listing'> | string | null
    authorId?: StringWithAggregatesFilter<'Listing'> | string
    createdAt?: DateTimeWithAggregatesFilter<'Listing'> | Date | string
  }

  export type VoteWhereInput = {
    AND?: VoteWhereInput | VoteWhereInput[]
    OR?: VoteWhereInput[]
    NOT?: VoteWhereInput | VoteWhereInput[]
    id?: StringFilter<'Vote'> | string
    value?: BoolFilter<'Vote'> | boolean
    userId?: StringFilter<'Vote'> | string
    listingId?: StringFilter<'Vote'> | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    listing?: XOR<ListingScalarRelationFilter, ListingWhereInput>
  }

  export type VoteOrderByWithRelationInput = {
    id?: SortOrder
    value?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    user?: UserOrderByWithRelationInput
    listing?: ListingOrderByWithRelationInput
  }

  export type VoteWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string
      userId_listingId?: VoteUserIdListingIdCompoundUniqueInput
      AND?: VoteWhereInput | VoteWhereInput[]
      OR?: VoteWhereInput[]
      NOT?: VoteWhereInput | VoteWhereInput[]
      value?: BoolFilter<'Vote'> | boolean
      userId?: StringFilter<'Vote'> | string
      listingId?: StringFilter<'Vote'> | string
      user?: XOR<UserScalarRelationFilter, UserWhereInput>
      listing?: XOR<ListingScalarRelationFilter, ListingWhereInput>
    },
    'id' | 'userId_listingId'
  >

  export type VoteOrderByWithAggregationInput = {
    id?: SortOrder
    value?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    _count?: VoteCountOrderByAggregateInput
    _max?: VoteMaxOrderByAggregateInput
    _min?: VoteMinOrderByAggregateInput
  }

  export type VoteScalarWhereWithAggregatesInput = {
    AND?:
      | VoteScalarWhereWithAggregatesInput
      | VoteScalarWhereWithAggregatesInput[]
    OR?: VoteScalarWhereWithAggregatesInput[]
    NOT?:
      | VoteScalarWhereWithAggregatesInput
      | VoteScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<'Vote'> | string
    value?: BoolWithAggregatesFilter<'Vote'> | boolean
    userId?: StringWithAggregatesFilter<'Vote'> | string
    listingId?: StringWithAggregatesFilter<'Vote'> | string
  }

  export type CommentWhereInput = {
    AND?: CommentWhereInput | CommentWhereInput[]
    OR?: CommentWhereInput[]
    NOT?: CommentWhereInput | CommentWhereInput[]
    id?: StringFilter<'Comment'> | string
    content?: StringFilter<'Comment'> | string
    userId?: StringFilter<'Comment'> | string
    listingId?: StringFilter<'Comment'> | string
    parentId?: StringNullableFilter<'Comment'> | string | null
    createdAt?: DateTimeFilter<'Comment'> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    listing?: XOR<ListingScalarRelationFilter, ListingWhereInput>
    parent?: XOR<CommentNullableScalarRelationFilter, CommentWhereInput> | null
    replies?: CommentListRelationFilter
  }

  export type CommentOrderByWithRelationInput = {
    id?: SortOrder
    content?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    parentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    listing?: ListingOrderByWithRelationInput
    parent?: CommentOrderByWithRelationInput
    replies?: CommentOrderByRelationAggregateInput
  }

  export type CommentWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string
      AND?: CommentWhereInput | CommentWhereInput[]
      OR?: CommentWhereInput[]
      NOT?: CommentWhereInput | CommentWhereInput[]
      content?: StringFilter<'Comment'> | string
      userId?: StringFilter<'Comment'> | string
      listingId?: StringFilter<'Comment'> | string
      parentId?: StringNullableFilter<'Comment'> | string | null
      createdAt?: DateTimeFilter<'Comment'> | Date | string
      user?: XOR<UserScalarRelationFilter, UserWhereInput>
      listing?: XOR<ListingScalarRelationFilter, ListingWhereInput>
      parent?: XOR<
        CommentNullableScalarRelationFilter,
        CommentWhereInput
      > | null
      replies?: CommentListRelationFilter
    },
    'id'
  >

  export type CommentOrderByWithAggregationInput = {
    id?: SortOrder
    content?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    parentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: CommentCountOrderByAggregateInput
    _max?: CommentMaxOrderByAggregateInput
    _min?: CommentMinOrderByAggregateInput
  }

  export type CommentScalarWhereWithAggregatesInput = {
    AND?:
      | CommentScalarWhereWithAggregatesInput
      | CommentScalarWhereWithAggregatesInput[]
    OR?: CommentScalarWhereWithAggregatesInput[]
    NOT?:
      | CommentScalarWhereWithAggregatesInput
      | CommentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<'Comment'> | string
    content?: StringWithAggregatesFilter<'Comment'> | string
    userId?: StringWithAggregatesFilter<'Comment'> | string
    listingId?: StringWithAggregatesFilter<'Comment'> | string
    parentId?: StringNullableWithAggregatesFilter<'Comment'> | string | null
    createdAt?: DateTimeWithAggregatesFilter<'Comment'> | Date | string
  }

  export type ListingApprovalWhereInput = {
    AND?: ListingApprovalWhereInput | ListingApprovalWhereInput[]
    OR?: ListingApprovalWhereInput[]
    NOT?: ListingApprovalWhereInput | ListingApprovalWhereInput[]
    id?: StringFilter<'ListingApproval'> | string
    listingId?: StringFilter<'ListingApproval'> | string
    approvedById?: StringFilter<'ListingApproval'> | string
    approvedByRole?: EnumRoleFilter<'ListingApproval'> | $Enums.Role
    approvedAt?: DateTimeFilter<'ListingApproval'> | Date | string
    status?: EnumApprovalStatusFilter<'ListingApproval'> | $Enums.ApprovalStatus
    notes?: StringNullableFilter<'ListingApproval'> | string | null
    listing?: XOR<ListingScalarRelationFilter, ListingWhereInput>
    approvedBy?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type ListingApprovalOrderByWithRelationInput = {
    id?: SortOrder
    listingId?: SortOrder
    approvedById?: SortOrder
    approvedByRole?: SortOrder
    approvedAt?: SortOrder
    status?: SortOrder
    notes?: SortOrderInput | SortOrder
    listing?: ListingOrderByWithRelationInput
    approvedBy?: UserOrderByWithRelationInput
  }

  export type ListingApprovalWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string
      AND?: ListingApprovalWhereInput | ListingApprovalWhereInput[]
      OR?: ListingApprovalWhereInput[]
      NOT?: ListingApprovalWhereInput | ListingApprovalWhereInput[]
      listingId?: StringFilter<'ListingApproval'> | string
      approvedById?: StringFilter<'ListingApproval'> | string
      approvedByRole?: EnumRoleFilter<'ListingApproval'> | $Enums.Role
      approvedAt?: DateTimeFilter<'ListingApproval'> | Date | string
      status?:
        | EnumApprovalStatusFilter<'ListingApproval'>
        | $Enums.ApprovalStatus
      notes?: StringNullableFilter<'ListingApproval'> | string | null
      listing?: XOR<ListingScalarRelationFilter, ListingWhereInput>
      approvedBy?: XOR<UserScalarRelationFilter, UserWhereInput>
    },
    'id'
  >

  export type ListingApprovalOrderByWithAggregationInput = {
    id?: SortOrder
    listingId?: SortOrder
    approvedById?: SortOrder
    approvedByRole?: SortOrder
    approvedAt?: SortOrder
    status?: SortOrder
    notes?: SortOrderInput | SortOrder
    _count?: ListingApprovalCountOrderByAggregateInput
    _max?: ListingApprovalMaxOrderByAggregateInput
    _min?: ListingApprovalMinOrderByAggregateInput
  }

  export type ListingApprovalScalarWhereWithAggregatesInput = {
    AND?:
      | ListingApprovalScalarWhereWithAggregatesInput
      | ListingApprovalScalarWhereWithAggregatesInput[]
    OR?: ListingApprovalScalarWhereWithAggregatesInput[]
    NOT?:
      | ListingApprovalScalarWhereWithAggregatesInput
      | ListingApprovalScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<'ListingApproval'> | string
    listingId?: StringWithAggregatesFilter<'ListingApproval'> | string
    approvedById?: StringWithAggregatesFilter<'ListingApproval'> | string
    approvedByRole?:
      | EnumRoleWithAggregatesFilter<'ListingApproval'>
      | $Enums.Role
    approvedAt?: DateTimeWithAggregatesFilter<'ListingApproval'> | Date | string
    status?:
      | EnumApprovalStatusWithAggregatesFilter<'ListingApproval'>
      | $Enums.ApprovalStatus
    notes?:
      | StringNullableWithAggregatesFilter<'ListingApproval'>
      | string
      | null
  }

  export type UserCreateInput = {
    id?: string
    email: string
    hashedPassword: string
    name?: string | null
    profileImage?: string | null
    role?: $Enums.Role
    createdAt?: Date | string
    listings?: ListingCreateNestedManyWithoutAuthorInput
    votes?: VoteCreateNestedManyWithoutUserInput
    comments?: CommentCreateNestedManyWithoutUserInput
    approvalsGiven?: ListingApprovalCreateNestedManyWithoutApprovedByInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    hashedPassword: string
    name?: string | null
    profileImage?: string | null
    role?: $Enums.Role
    createdAt?: Date | string
    listings?: ListingUncheckedCreateNestedManyWithoutAuthorInput
    votes?: VoteUncheckedCreateNestedManyWithoutUserInput
    comments?: CommentUncheckedCreateNestedManyWithoutUserInput
    approvalsGiven?: ListingApprovalUncheckedCreateNestedManyWithoutApprovedByInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listings?: ListingUpdateManyWithoutAuthorNestedInput
    votes?: VoteUpdateManyWithoutUserNestedInput
    comments?: CommentUpdateManyWithoutUserNestedInput
    approvalsGiven?: ListingApprovalUpdateManyWithoutApprovedByNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listings?: ListingUncheckedUpdateManyWithoutAuthorNestedInput
    votes?: VoteUncheckedUpdateManyWithoutUserNestedInput
    comments?: CommentUncheckedUpdateManyWithoutUserNestedInput
    approvalsGiven?: ListingApprovalUncheckedUpdateManyWithoutApprovedByNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    hashedPassword: string
    name?: string | null
    profileImage?: string | null
    role?: $Enums.Role
    createdAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DeviceCreateInput = {
    id?: string
    brand: string
    modelName: string
    listings?: ListingCreateNestedManyWithoutDeviceInput
  }

  export type DeviceUncheckedCreateInput = {
    id?: string
    brand: string
    modelName: string
    listings?: ListingUncheckedCreateNestedManyWithoutDeviceInput
  }

  export type DeviceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    listings?: ListingUpdateManyWithoutDeviceNestedInput
  }

  export type DeviceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    listings?: ListingUncheckedUpdateManyWithoutDeviceNestedInput
  }

  export type DeviceCreateManyInput = {
    id?: string
    brand: string
    modelName: string
  }

  export type DeviceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
  }

  export type DeviceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
  }

  export type SystemCreateInput = {
    id?: string
    name: string
    games?: GameCreateNestedManyWithoutSystemInput
  }

  export type SystemUncheckedCreateInput = {
    id?: string
    name: string
    games?: GameUncheckedCreateNestedManyWithoutSystemInput
  }

  export type SystemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    games?: GameUpdateManyWithoutSystemNestedInput
  }

  export type SystemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    games?: GameUncheckedUpdateManyWithoutSystemNestedInput
  }

  export type SystemCreateManyInput = {
    id?: string
    name: string
  }

  export type SystemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type SystemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type GameCreateInput = {
    id?: string
    title: string
    imageUrl?: string | null
    system: SystemCreateNestedOneWithoutGamesInput
    listings?: ListingCreateNestedManyWithoutGameInput
  }

  export type GameUncheckedCreateInput = {
    id?: string
    title: string
    systemId: string
    imageUrl?: string | null
    listings?: ListingUncheckedCreateNestedManyWithoutGameInput
  }

  export type GameUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    system?: SystemUpdateOneRequiredWithoutGamesNestedInput
    listings?: ListingUpdateManyWithoutGameNestedInput
  }

  export type GameUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    systemId?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listings?: ListingUncheckedUpdateManyWithoutGameNestedInput
  }

  export type GameCreateManyInput = {
    id?: string
    title: string
    systemId: string
    imageUrl?: string | null
  }

  export type GameUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type GameUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    systemId?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EmulatorCreateInput = {
    id?: string
    name: string
    listings?: ListingCreateNestedManyWithoutEmulatorInput
  }

  export type EmulatorUncheckedCreateInput = {
    id?: string
    name: string
    listings?: ListingUncheckedCreateNestedManyWithoutEmulatorInput
  }

  export type EmulatorUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    listings?: ListingUpdateManyWithoutEmulatorNestedInput
  }

  export type EmulatorUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    listings?: ListingUncheckedUpdateManyWithoutEmulatorNestedInput
  }

  export type EmulatorCreateManyInput = {
    id?: string
    name: string
  }

  export type EmulatorUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type EmulatorUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type PerformanceScaleCreateInput = {
    label: string
    rank: number
    listings?: ListingCreateNestedManyWithoutPerformanceInput
  }

  export type PerformanceScaleUncheckedCreateInput = {
    id?: number
    label: string
    rank: number
    listings?: ListingUncheckedCreateNestedManyWithoutPerformanceInput
  }

  export type PerformanceScaleUpdateInput = {
    label?: StringFieldUpdateOperationsInput | string
    rank?: IntFieldUpdateOperationsInput | number
    listings?: ListingUpdateManyWithoutPerformanceNestedInput
  }

  export type PerformanceScaleUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    label?: StringFieldUpdateOperationsInput | string
    rank?: IntFieldUpdateOperationsInput | number
    listings?: ListingUncheckedUpdateManyWithoutPerformanceNestedInput
  }

  export type PerformanceScaleCreateManyInput = {
    id?: number
    label: string
    rank: number
  }

  export type PerformanceScaleUpdateManyMutationInput = {
    label?: StringFieldUpdateOperationsInput | string
    rank?: IntFieldUpdateOperationsInput | number
  }

  export type PerformanceScaleUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    label?: StringFieldUpdateOperationsInput | string
    rank?: IntFieldUpdateOperationsInput | number
  }

  export type ListingCreateInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    device: DeviceCreateNestedOneWithoutListingsInput
    game: GameCreateNestedOneWithoutListingsInput
    emulator: EmulatorCreateNestedOneWithoutListingsInput
    performance: PerformanceScaleCreateNestedOneWithoutListingsInput
    author: UserCreateNestedOneWithoutListingsInput
    votes?: VoteCreateNestedManyWithoutListingInput
    comments?: CommentCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateInput = {
    id?: string
    deviceId: string
    gameId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    authorId: string
    createdAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutListingInput
    comments?: CommentUncheckedCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    device?: DeviceUpdateOneRequiredWithoutListingsNestedInput
    game?: GameUpdateOneRequiredWithoutListingsNestedInput
    emulator?: EmulatorUpdateOneRequiredWithoutListingsNestedInput
    performance?: PerformanceScaleUpdateOneRequiredWithoutListingsNestedInput
    author?: UserUpdateOneRequiredWithoutListingsNestedInput
    votes?: VoteUpdateManyWithoutListingNestedInput
    comments?: CommentUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutListingNestedInput
    comments?: CommentUncheckedUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUncheckedUpdateManyWithoutListingNestedInput
  }

  export type ListingCreateManyInput = {
    id?: string
    deviceId: string
    gameId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    authorId: string
    createdAt?: Date | string
  }

  export type ListingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteCreateInput = {
    id?: string
    value: boolean
    user: UserCreateNestedOneWithoutVotesInput
    listing: ListingCreateNestedOneWithoutVotesInput
  }

  export type VoteUncheckedCreateInput = {
    id?: string
    value: boolean
    userId: string
    listingId: string
  }

  export type VoteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: BoolFieldUpdateOperationsInput | boolean
    user?: UserUpdateOneRequiredWithoutVotesNestedInput
    listing?: ListingUpdateOneRequiredWithoutVotesNestedInput
  }

  export type VoteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
  }

  export type VoteCreateManyInput = {
    id?: string
    value: boolean
    userId: string
    listingId: string
  }

  export type VoteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: BoolFieldUpdateOperationsInput | boolean
  }

  export type VoteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
  }

  export type CommentCreateInput = {
    id?: string
    content: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutCommentsInput
    listing: ListingCreateNestedOneWithoutCommentsInput
    parent?: CommentCreateNestedOneWithoutRepliesInput
    replies?: CommentCreateNestedManyWithoutParentInput
  }

  export type CommentUncheckedCreateInput = {
    id?: string
    content: string
    userId: string
    listingId: string
    parentId?: string | null
    createdAt?: Date | string
    replies?: CommentUncheckedCreateNestedManyWithoutParentInput
  }

  export type CommentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCommentsNestedInput
    listing?: ListingUpdateOneRequiredWithoutCommentsNestedInput
    parent?: CommentUpdateOneWithoutRepliesNestedInput
    replies?: CommentUpdateManyWithoutParentNestedInput
  }

  export type CommentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: CommentUncheckedUpdateManyWithoutParentNestedInput
  }

  export type CommentCreateManyInput = {
    id?: string
    content: string
    userId: string
    listingId: string
    parentId?: string | null
    createdAt?: Date | string
  }

  export type CommentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingApprovalCreateInput = {
    id?: string
    approvedByRole: $Enums.Role
    approvedAt?: Date | string
    status: $Enums.ApprovalStatus
    notes?: string | null
    listing: ListingCreateNestedOneWithoutApprovalsInput
    approvedBy: UserCreateNestedOneWithoutApprovalsGivenInput
  }

  export type ListingApprovalUncheckedCreateInput = {
    id?: string
    listingId: string
    approvedById: string
    approvedByRole: $Enums.Role
    approvedAt?: Date | string
    status: $Enums.ApprovalStatus
    notes?: string | null
  }

  export type ListingApprovalUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    approvedByRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    approvedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?:
      | EnumApprovalStatusFieldUpdateOperationsInput
      | $Enums.ApprovalStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listing?: ListingUpdateOneRequiredWithoutApprovalsNestedInput
    approvedBy?: UserUpdateOneRequiredWithoutApprovalsGivenNestedInput
  }

  export type ListingApprovalUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    approvedById?: StringFieldUpdateOperationsInput | string
    approvedByRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    approvedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?:
      | EnumApprovalStatusFieldUpdateOperationsInput
      | $Enums.ApprovalStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ListingApprovalCreateManyInput = {
    id?: string
    listingId: string
    approvedById: string
    approvedByRole: $Enums.Role
    approvedAt?: Date | string
    status: $Enums.ApprovalStatus
    notes?: string | null
  }

  export type ListingApprovalUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    approvedByRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    approvedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?:
      | EnumApprovalStatusFieldUpdateOperationsInput
      | $Enums.ApprovalStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ListingApprovalUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    approvedById?: StringFieldUpdateOperationsInput | string
    approvedByRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    approvedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?:
      | EnumApprovalStatusFieldUpdateOperationsInput
      | $Enums.ApprovalStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ListingListRelationFilter = {
    every?: ListingWhereInput
    some?: ListingWhereInput
    none?: ListingWhereInput
  }

  export type VoteListRelationFilter = {
    every?: VoteWhereInput
    some?: VoteWhereInput
    none?: VoteWhereInput
  }

  export type CommentListRelationFilter = {
    every?: CommentWhereInput
    some?: CommentWhereInput
    none?: CommentWhereInput
  }

  export type ListingApprovalListRelationFilter = {
    every?: ListingApprovalWhereInput
    some?: ListingApprovalWhereInput
    none?: ListingApprovalWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ListingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VoteOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CommentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ListingApprovalOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    hashedPassword?: SortOrder
    name?: SortOrder
    profileImage?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    hashedPassword?: SortOrder
    name?: SortOrder
    profileImage?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    hashedPassword?: SortOrder
    name?: SortOrder
    profileImage?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DeviceCountOrderByAggregateInput = {
    id?: SortOrder
    brand?: SortOrder
    modelName?: SortOrder
  }

  export type DeviceMaxOrderByAggregateInput = {
    id?: SortOrder
    brand?: SortOrder
    modelName?: SortOrder
  }

  export type DeviceMinOrderByAggregateInput = {
    id?: SortOrder
    brand?: SortOrder
    modelName?: SortOrder
  }

  export type GameListRelationFilter = {
    every?: GameWhereInput
    some?: GameWhereInput
    none?: GameWhereInput
  }

  export type GameOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SystemCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type SystemMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type SystemMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type SystemScalarRelationFilter = {
    is?: SystemWhereInput
    isNot?: SystemWhereInput
  }

  export type GameCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    systemId?: SortOrder
    imageUrl?: SortOrder
  }

  export type GameMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    systemId?: SortOrder
    imageUrl?: SortOrder
  }

  export type GameMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    systemId?: SortOrder
    imageUrl?: SortOrder
  }

  export type EmulatorCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type EmulatorMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type EmulatorMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type PerformanceScaleCountOrderByAggregateInput = {
    id?: SortOrder
    label?: SortOrder
    rank?: SortOrder
  }

  export type PerformanceScaleAvgOrderByAggregateInput = {
    id?: SortOrder
    rank?: SortOrder
  }

  export type PerformanceScaleMaxOrderByAggregateInput = {
    id?: SortOrder
    label?: SortOrder
    rank?: SortOrder
  }

  export type PerformanceScaleMinOrderByAggregateInput = {
    id?: SortOrder
    label?: SortOrder
    rank?: SortOrder
  }

  export type PerformanceScaleSumOrderByAggregateInput = {
    id?: SortOrder
    rank?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DeviceScalarRelationFilter = {
    is?: DeviceWhereInput
    isNot?: DeviceWhereInput
  }

  export type GameScalarRelationFilter = {
    is?: GameWhereInput
    isNot?: GameWhereInput
  }

  export type EmulatorScalarRelationFilter = {
    is?: EmulatorWhereInput
    isNot?: EmulatorWhereInput
  }

  export type PerformanceScaleScalarRelationFilter = {
    is?: PerformanceScaleWhereInput
    isNot?: PerformanceScaleWhereInput
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type ListingCountOrderByAggregateInput = {
    id?: SortOrder
    deviceId?: SortOrder
    gameId?: SortOrder
    emulatorId?: SortOrder
    performanceId?: SortOrder
    notes?: SortOrder
    authorId?: SortOrder
    createdAt?: SortOrder
  }

  export type ListingAvgOrderByAggregateInput = {
    performanceId?: SortOrder
  }

  export type ListingMaxOrderByAggregateInput = {
    id?: SortOrder
    deviceId?: SortOrder
    gameId?: SortOrder
    emulatorId?: SortOrder
    performanceId?: SortOrder
    notes?: SortOrder
    authorId?: SortOrder
    createdAt?: SortOrder
  }

  export type ListingMinOrderByAggregateInput = {
    id?: SortOrder
    deviceId?: SortOrder
    gameId?: SortOrder
    emulatorId?: SortOrder
    performanceId?: SortOrder
    notes?: SortOrder
    authorId?: SortOrder
    createdAt?: SortOrder
  }

  export type ListingSumOrderByAggregateInput = {
    performanceId?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type ListingScalarRelationFilter = {
    is?: ListingWhereInput
    isNot?: ListingWhereInput
  }

  export type VoteUserIdListingIdCompoundUniqueInput = {
    userId: string
    listingId: string
  }

  export type VoteCountOrderByAggregateInput = {
    id?: SortOrder
    value?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
  }

  export type VoteMaxOrderByAggregateInput = {
    id?: SortOrder
    value?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
  }

  export type VoteMinOrderByAggregateInput = {
    id?: SortOrder
    value?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type CommentNullableScalarRelationFilter = {
    is?: CommentWhereInput | null
    isNot?: CommentWhereInput | null
  }

  export type CommentCountOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
  }

  export type CommentMaxOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
  }

  export type CommentMinOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    userId?: SortOrder
    listingId?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumApprovalStatusFilter<$PrismaModel = never> = {
    equals?:
      | $Enums.ApprovalStatus
      | EnumApprovalStatusFieldRefInput<$PrismaModel>
    in?:
      | $Enums.ApprovalStatus[]
      | ListEnumApprovalStatusFieldRefInput<$PrismaModel>
    notIn?:
      | $Enums.ApprovalStatus[]
      | ListEnumApprovalStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumApprovalStatusFilter<$PrismaModel> | $Enums.ApprovalStatus
  }

  export type ListingApprovalCountOrderByAggregateInput = {
    id?: SortOrder
    listingId?: SortOrder
    approvedById?: SortOrder
    approvedByRole?: SortOrder
    approvedAt?: SortOrder
    status?: SortOrder
    notes?: SortOrder
  }

  export type ListingApprovalMaxOrderByAggregateInput = {
    id?: SortOrder
    listingId?: SortOrder
    approvedById?: SortOrder
    approvedByRole?: SortOrder
    approvedAt?: SortOrder
    status?: SortOrder
    notes?: SortOrder
  }

  export type ListingApprovalMinOrderByAggregateInput = {
    id?: SortOrder
    listingId?: SortOrder
    approvedById?: SortOrder
    approvedByRole?: SortOrder
    approvedAt?: SortOrder
    status?: SortOrder
    notes?: SortOrder
  }

  export type EnumApprovalStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?:
      | $Enums.ApprovalStatus
      | EnumApprovalStatusFieldRefInput<$PrismaModel>
    in?:
      | $Enums.ApprovalStatus[]
      | ListEnumApprovalStatusFieldRefInput<$PrismaModel>
    notIn?:
      | $Enums.ApprovalStatus[]
      | ListEnumApprovalStatusFieldRefInput<$PrismaModel>
    not?:
      | NestedEnumApprovalStatusWithAggregatesFilter<$PrismaModel>
      | $Enums.ApprovalStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumApprovalStatusFilter<$PrismaModel>
    _max?: NestedEnumApprovalStatusFilter<$PrismaModel>
  }

  export type ListingCreateNestedManyWithoutAuthorInput = {
    create?:
      | XOR<
          ListingCreateWithoutAuthorInput,
          ListingUncheckedCreateWithoutAuthorInput
        >
      | ListingCreateWithoutAuthorInput[]
      | ListingUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutAuthorInput
      | ListingCreateOrConnectWithoutAuthorInput[]
    createMany?: ListingCreateManyAuthorInputEnvelope
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
  }

  export type VoteCreateNestedManyWithoutUserInput = {
    create?:
      | XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput>
      | VoteCreateWithoutUserInput[]
      | VoteUncheckedCreateWithoutUserInput[]
    connectOrCreate?:
      | VoteCreateOrConnectWithoutUserInput
      | VoteCreateOrConnectWithoutUserInput[]
    createMany?: VoteCreateManyUserInputEnvelope
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
  }

  export type CommentCreateNestedManyWithoutUserInput = {
    create?:
      | XOR<
          CommentCreateWithoutUserInput,
          CommentUncheckedCreateWithoutUserInput
        >
      | CommentCreateWithoutUserInput[]
      | CommentUncheckedCreateWithoutUserInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutUserInput
      | CommentCreateOrConnectWithoutUserInput[]
    createMany?: CommentCreateManyUserInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type ListingApprovalCreateNestedManyWithoutApprovedByInput = {
    create?:
      | XOR<
          ListingApprovalCreateWithoutApprovedByInput,
          ListingApprovalUncheckedCreateWithoutApprovedByInput
        >
      | ListingApprovalCreateWithoutApprovedByInput[]
      | ListingApprovalUncheckedCreateWithoutApprovedByInput[]
    connectOrCreate?:
      | ListingApprovalCreateOrConnectWithoutApprovedByInput
      | ListingApprovalCreateOrConnectWithoutApprovedByInput[]
    createMany?: ListingApprovalCreateManyApprovedByInputEnvelope
    connect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
  }

  export type ListingUncheckedCreateNestedManyWithoutAuthorInput = {
    create?:
      | XOR<
          ListingCreateWithoutAuthorInput,
          ListingUncheckedCreateWithoutAuthorInput
        >
      | ListingCreateWithoutAuthorInput[]
      | ListingUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutAuthorInput
      | ListingCreateOrConnectWithoutAuthorInput[]
    createMany?: ListingCreateManyAuthorInputEnvelope
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
  }

  export type VoteUncheckedCreateNestedManyWithoutUserInput = {
    create?:
      | XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput>
      | VoteCreateWithoutUserInput[]
      | VoteUncheckedCreateWithoutUserInput[]
    connectOrCreate?:
      | VoteCreateOrConnectWithoutUserInput
      | VoteCreateOrConnectWithoutUserInput[]
    createMany?: VoteCreateManyUserInputEnvelope
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
  }

  export type CommentUncheckedCreateNestedManyWithoutUserInput = {
    create?:
      | XOR<
          CommentCreateWithoutUserInput,
          CommentUncheckedCreateWithoutUserInput
        >
      | CommentCreateWithoutUserInput[]
      | CommentUncheckedCreateWithoutUserInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutUserInput
      | CommentCreateOrConnectWithoutUserInput[]
    createMany?: CommentCreateManyUserInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type ListingApprovalUncheckedCreateNestedManyWithoutApprovedByInput = {
    create?:
      | XOR<
          ListingApprovalCreateWithoutApprovedByInput,
          ListingApprovalUncheckedCreateWithoutApprovedByInput
        >
      | ListingApprovalCreateWithoutApprovedByInput[]
      | ListingApprovalUncheckedCreateWithoutApprovedByInput[]
    connectOrCreate?:
      | ListingApprovalCreateOrConnectWithoutApprovedByInput
      | ListingApprovalCreateOrConnectWithoutApprovedByInput[]
    createMany?: ListingApprovalCreateManyApprovedByInputEnvelope
    connect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ListingUpdateManyWithoutAuthorNestedInput = {
    create?:
      | XOR<
          ListingCreateWithoutAuthorInput,
          ListingUncheckedCreateWithoutAuthorInput
        >
      | ListingCreateWithoutAuthorInput[]
      | ListingUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutAuthorInput
      | ListingCreateOrConnectWithoutAuthorInput[]
    upsert?:
      | ListingUpsertWithWhereUniqueWithoutAuthorInput
      | ListingUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: ListingCreateManyAuthorInputEnvelope
    set?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    disconnect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    delete?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    update?:
      | ListingUpdateWithWhereUniqueWithoutAuthorInput
      | ListingUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?:
      | ListingUpdateManyWithWhereWithoutAuthorInput
      | ListingUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: ListingScalarWhereInput | ListingScalarWhereInput[]
  }

  export type VoteUpdateManyWithoutUserNestedInput = {
    create?:
      | XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput>
      | VoteCreateWithoutUserInput[]
      | VoteUncheckedCreateWithoutUserInput[]
    connectOrCreate?:
      | VoteCreateOrConnectWithoutUserInput
      | VoteCreateOrConnectWithoutUserInput[]
    upsert?:
      | VoteUpsertWithWhereUniqueWithoutUserInput
      | VoteUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: VoteCreateManyUserInputEnvelope
    set?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    disconnect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    delete?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    update?:
      | VoteUpdateWithWhereUniqueWithoutUserInput
      | VoteUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?:
      | VoteUpdateManyWithWhereWithoutUserInput
      | VoteUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: VoteScalarWhereInput | VoteScalarWhereInput[]
  }

  export type CommentUpdateManyWithoutUserNestedInput = {
    create?:
      | XOR<
          CommentCreateWithoutUserInput,
          CommentUncheckedCreateWithoutUserInput
        >
      | CommentCreateWithoutUserInput[]
      | CommentUncheckedCreateWithoutUserInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutUserInput
      | CommentCreateOrConnectWithoutUserInput[]
    upsert?:
      | CommentUpsertWithWhereUniqueWithoutUserInput
      | CommentUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CommentCreateManyUserInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?:
      | CommentUpdateWithWhereUniqueWithoutUserInput
      | CommentUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?:
      | CommentUpdateManyWithWhereWithoutUserInput
      | CommentUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type ListingApprovalUpdateManyWithoutApprovedByNestedInput = {
    create?:
      | XOR<
          ListingApprovalCreateWithoutApprovedByInput,
          ListingApprovalUncheckedCreateWithoutApprovedByInput
        >
      | ListingApprovalCreateWithoutApprovedByInput[]
      | ListingApprovalUncheckedCreateWithoutApprovedByInput[]
    connectOrCreate?:
      | ListingApprovalCreateOrConnectWithoutApprovedByInput
      | ListingApprovalCreateOrConnectWithoutApprovedByInput[]
    upsert?:
      | ListingApprovalUpsertWithWhereUniqueWithoutApprovedByInput
      | ListingApprovalUpsertWithWhereUniqueWithoutApprovedByInput[]
    createMany?: ListingApprovalCreateManyApprovedByInputEnvelope
    set?: ListingApprovalWhereUniqueInput | ListingApprovalWhereUniqueInput[]
    disconnect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
    delete?: ListingApprovalWhereUniqueInput | ListingApprovalWhereUniqueInput[]
    connect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
    update?:
      | ListingApprovalUpdateWithWhereUniqueWithoutApprovedByInput
      | ListingApprovalUpdateWithWhereUniqueWithoutApprovedByInput[]
    updateMany?:
      | ListingApprovalUpdateManyWithWhereWithoutApprovedByInput
      | ListingApprovalUpdateManyWithWhereWithoutApprovedByInput[]
    deleteMany?:
      | ListingApprovalScalarWhereInput
      | ListingApprovalScalarWhereInput[]
  }

  export type ListingUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?:
      | XOR<
          ListingCreateWithoutAuthorInput,
          ListingUncheckedCreateWithoutAuthorInput
        >
      | ListingCreateWithoutAuthorInput[]
      | ListingUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutAuthorInput
      | ListingCreateOrConnectWithoutAuthorInput[]
    upsert?:
      | ListingUpsertWithWhereUniqueWithoutAuthorInput
      | ListingUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: ListingCreateManyAuthorInputEnvelope
    set?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    disconnect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    delete?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    update?:
      | ListingUpdateWithWhereUniqueWithoutAuthorInput
      | ListingUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?:
      | ListingUpdateManyWithWhereWithoutAuthorInput
      | ListingUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: ListingScalarWhereInput | ListingScalarWhereInput[]
  }

  export type VoteUncheckedUpdateManyWithoutUserNestedInput = {
    create?:
      | XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput>
      | VoteCreateWithoutUserInput[]
      | VoteUncheckedCreateWithoutUserInput[]
    connectOrCreate?:
      | VoteCreateOrConnectWithoutUserInput
      | VoteCreateOrConnectWithoutUserInput[]
    upsert?:
      | VoteUpsertWithWhereUniqueWithoutUserInput
      | VoteUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: VoteCreateManyUserInputEnvelope
    set?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    disconnect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    delete?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    update?:
      | VoteUpdateWithWhereUniqueWithoutUserInput
      | VoteUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?:
      | VoteUpdateManyWithWhereWithoutUserInput
      | VoteUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: VoteScalarWhereInput | VoteScalarWhereInput[]
  }

  export type CommentUncheckedUpdateManyWithoutUserNestedInput = {
    create?:
      | XOR<
          CommentCreateWithoutUserInput,
          CommentUncheckedCreateWithoutUserInput
        >
      | CommentCreateWithoutUserInput[]
      | CommentUncheckedCreateWithoutUserInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutUserInput
      | CommentCreateOrConnectWithoutUserInput[]
    upsert?:
      | CommentUpsertWithWhereUniqueWithoutUserInput
      | CommentUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CommentCreateManyUserInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?:
      | CommentUpdateWithWhereUniqueWithoutUserInput
      | CommentUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?:
      | CommentUpdateManyWithWhereWithoutUserInput
      | CommentUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type ListingApprovalUncheckedUpdateManyWithoutApprovedByNestedInput = {
    create?:
      | XOR<
          ListingApprovalCreateWithoutApprovedByInput,
          ListingApprovalUncheckedCreateWithoutApprovedByInput
        >
      | ListingApprovalCreateWithoutApprovedByInput[]
      | ListingApprovalUncheckedCreateWithoutApprovedByInput[]
    connectOrCreate?:
      | ListingApprovalCreateOrConnectWithoutApprovedByInput
      | ListingApprovalCreateOrConnectWithoutApprovedByInput[]
    upsert?:
      | ListingApprovalUpsertWithWhereUniqueWithoutApprovedByInput
      | ListingApprovalUpsertWithWhereUniqueWithoutApprovedByInput[]
    createMany?: ListingApprovalCreateManyApprovedByInputEnvelope
    set?: ListingApprovalWhereUniqueInput | ListingApprovalWhereUniqueInput[]
    disconnect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
    delete?: ListingApprovalWhereUniqueInput | ListingApprovalWhereUniqueInput[]
    connect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
    update?:
      | ListingApprovalUpdateWithWhereUniqueWithoutApprovedByInput
      | ListingApprovalUpdateWithWhereUniqueWithoutApprovedByInput[]
    updateMany?:
      | ListingApprovalUpdateManyWithWhereWithoutApprovedByInput
      | ListingApprovalUpdateManyWithWhereWithoutApprovedByInput[]
    deleteMany?:
      | ListingApprovalScalarWhereInput
      | ListingApprovalScalarWhereInput[]
  }

  export type ListingCreateNestedManyWithoutDeviceInput = {
    create?:
      | XOR<
          ListingCreateWithoutDeviceInput,
          ListingUncheckedCreateWithoutDeviceInput
        >
      | ListingCreateWithoutDeviceInput[]
      | ListingUncheckedCreateWithoutDeviceInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutDeviceInput
      | ListingCreateOrConnectWithoutDeviceInput[]
    createMany?: ListingCreateManyDeviceInputEnvelope
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
  }

  export type ListingUncheckedCreateNestedManyWithoutDeviceInput = {
    create?:
      | XOR<
          ListingCreateWithoutDeviceInput,
          ListingUncheckedCreateWithoutDeviceInput
        >
      | ListingCreateWithoutDeviceInput[]
      | ListingUncheckedCreateWithoutDeviceInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutDeviceInput
      | ListingCreateOrConnectWithoutDeviceInput[]
    createMany?: ListingCreateManyDeviceInputEnvelope
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
  }

  export type ListingUpdateManyWithoutDeviceNestedInput = {
    create?:
      | XOR<
          ListingCreateWithoutDeviceInput,
          ListingUncheckedCreateWithoutDeviceInput
        >
      | ListingCreateWithoutDeviceInput[]
      | ListingUncheckedCreateWithoutDeviceInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutDeviceInput
      | ListingCreateOrConnectWithoutDeviceInput[]
    upsert?:
      | ListingUpsertWithWhereUniqueWithoutDeviceInput
      | ListingUpsertWithWhereUniqueWithoutDeviceInput[]
    createMany?: ListingCreateManyDeviceInputEnvelope
    set?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    disconnect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    delete?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    update?:
      | ListingUpdateWithWhereUniqueWithoutDeviceInput
      | ListingUpdateWithWhereUniqueWithoutDeviceInput[]
    updateMany?:
      | ListingUpdateManyWithWhereWithoutDeviceInput
      | ListingUpdateManyWithWhereWithoutDeviceInput[]
    deleteMany?: ListingScalarWhereInput | ListingScalarWhereInput[]
  }

  export type ListingUncheckedUpdateManyWithoutDeviceNestedInput = {
    create?:
      | XOR<
          ListingCreateWithoutDeviceInput,
          ListingUncheckedCreateWithoutDeviceInput
        >
      | ListingCreateWithoutDeviceInput[]
      | ListingUncheckedCreateWithoutDeviceInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutDeviceInput
      | ListingCreateOrConnectWithoutDeviceInput[]
    upsert?:
      | ListingUpsertWithWhereUniqueWithoutDeviceInput
      | ListingUpsertWithWhereUniqueWithoutDeviceInput[]
    createMany?: ListingCreateManyDeviceInputEnvelope
    set?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    disconnect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    delete?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    update?:
      | ListingUpdateWithWhereUniqueWithoutDeviceInput
      | ListingUpdateWithWhereUniqueWithoutDeviceInput[]
    updateMany?:
      | ListingUpdateManyWithWhereWithoutDeviceInput
      | ListingUpdateManyWithWhereWithoutDeviceInput[]
    deleteMany?: ListingScalarWhereInput | ListingScalarWhereInput[]
  }

  export type GameCreateNestedManyWithoutSystemInput = {
    create?:
      | XOR<GameCreateWithoutSystemInput, GameUncheckedCreateWithoutSystemInput>
      | GameCreateWithoutSystemInput[]
      | GameUncheckedCreateWithoutSystemInput[]
    connectOrCreate?:
      | GameCreateOrConnectWithoutSystemInput
      | GameCreateOrConnectWithoutSystemInput[]
    createMany?: GameCreateManySystemInputEnvelope
    connect?: GameWhereUniqueInput | GameWhereUniqueInput[]
  }

  export type GameUncheckedCreateNestedManyWithoutSystemInput = {
    create?:
      | XOR<GameCreateWithoutSystemInput, GameUncheckedCreateWithoutSystemInput>
      | GameCreateWithoutSystemInput[]
      | GameUncheckedCreateWithoutSystemInput[]
    connectOrCreate?:
      | GameCreateOrConnectWithoutSystemInput
      | GameCreateOrConnectWithoutSystemInput[]
    createMany?: GameCreateManySystemInputEnvelope
    connect?: GameWhereUniqueInput | GameWhereUniqueInput[]
  }

  export type GameUpdateManyWithoutSystemNestedInput = {
    create?:
      | XOR<GameCreateWithoutSystemInput, GameUncheckedCreateWithoutSystemInput>
      | GameCreateWithoutSystemInput[]
      | GameUncheckedCreateWithoutSystemInput[]
    connectOrCreate?:
      | GameCreateOrConnectWithoutSystemInput
      | GameCreateOrConnectWithoutSystemInput[]
    upsert?:
      | GameUpsertWithWhereUniqueWithoutSystemInput
      | GameUpsertWithWhereUniqueWithoutSystemInput[]
    createMany?: GameCreateManySystemInputEnvelope
    set?: GameWhereUniqueInput | GameWhereUniqueInput[]
    disconnect?: GameWhereUniqueInput | GameWhereUniqueInput[]
    delete?: GameWhereUniqueInput | GameWhereUniqueInput[]
    connect?: GameWhereUniqueInput | GameWhereUniqueInput[]
    update?:
      | GameUpdateWithWhereUniqueWithoutSystemInput
      | GameUpdateWithWhereUniqueWithoutSystemInput[]
    updateMany?:
      | GameUpdateManyWithWhereWithoutSystemInput
      | GameUpdateManyWithWhereWithoutSystemInput[]
    deleteMany?: GameScalarWhereInput | GameScalarWhereInput[]
  }

  export type GameUncheckedUpdateManyWithoutSystemNestedInput = {
    create?:
      | XOR<GameCreateWithoutSystemInput, GameUncheckedCreateWithoutSystemInput>
      | GameCreateWithoutSystemInput[]
      | GameUncheckedCreateWithoutSystemInput[]
    connectOrCreate?:
      | GameCreateOrConnectWithoutSystemInput
      | GameCreateOrConnectWithoutSystemInput[]
    upsert?:
      | GameUpsertWithWhereUniqueWithoutSystemInput
      | GameUpsertWithWhereUniqueWithoutSystemInput[]
    createMany?: GameCreateManySystemInputEnvelope
    set?: GameWhereUniqueInput | GameWhereUniqueInput[]
    disconnect?: GameWhereUniqueInput | GameWhereUniqueInput[]
    delete?: GameWhereUniqueInput | GameWhereUniqueInput[]
    connect?: GameWhereUniqueInput | GameWhereUniqueInput[]
    update?:
      | GameUpdateWithWhereUniqueWithoutSystemInput
      | GameUpdateWithWhereUniqueWithoutSystemInput[]
    updateMany?:
      | GameUpdateManyWithWhereWithoutSystemInput
      | GameUpdateManyWithWhereWithoutSystemInput[]
    deleteMany?: GameScalarWhereInput | GameScalarWhereInput[]
  }

  export type SystemCreateNestedOneWithoutGamesInput = {
    create?: XOR<
      SystemCreateWithoutGamesInput,
      SystemUncheckedCreateWithoutGamesInput
    >
    connectOrCreate?: SystemCreateOrConnectWithoutGamesInput
    connect?: SystemWhereUniqueInput
  }

  export type ListingCreateNestedManyWithoutGameInput = {
    create?:
      | XOR<
          ListingCreateWithoutGameInput,
          ListingUncheckedCreateWithoutGameInput
        >
      | ListingCreateWithoutGameInput[]
      | ListingUncheckedCreateWithoutGameInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutGameInput
      | ListingCreateOrConnectWithoutGameInput[]
    createMany?: ListingCreateManyGameInputEnvelope
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
  }

  export type ListingUncheckedCreateNestedManyWithoutGameInput = {
    create?:
      | XOR<
          ListingCreateWithoutGameInput,
          ListingUncheckedCreateWithoutGameInput
        >
      | ListingCreateWithoutGameInput[]
      | ListingUncheckedCreateWithoutGameInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutGameInput
      | ListingCreateOrConnectWithoutGameInput[]
    createMany?: ListingCreateManyGameInputEnvelope
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
  }

  export type SystemUpdateOneRequiredWithoutGamesNestedInput = {
    create?: XOR<
      SystemCreateWithoutGamesInput,
      SystemUncheckedCreateWithoutGamesInput
    >
    connectOrCreate?: SystemCreateOrConnectWithoutGamesInput
    upsert?: SystemUpsertWithoutGamesInput
    connect?: SystemWhereUniqueInput
    update?: XOR<
      XOR<
        SystemUpdateToOneWithWhereWithoutGamesInput,
        SystemUpdateWithoutGamesInput
      >,
      SystemUncheckedUpdateWithoutGamesInput
    >
  }

  export type ListingUpdateManyWithoutGameNestedInput = {
    create?:
      | XOR<
          ListingCreateWithoutGameInput,
          ListingUncheckedCreateWithoutGameInput
        >
      | ListingCreateWithoutGameInput[]
      | ListingUncheckedCreateWithoutGameInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutGameInput
      | ListingCreateOrConnectWithoutGameInput[]
    upsert?:
      | ListingUpsertWithWhereUniqueWithoutGameInput
      | ListingUpsertWithWhereUniqueWithoutGameInput[]
    createMany?: ListingCreateManyGameInputEnvelope
    set?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    disconnect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    delete?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    update?:
      | ListingUpdateWithWhereUniqueWithoutGameInput
      | ListingUpdateWithWhereUniqueWithoutGameInput[]
    updateMany?:
      | ListingUpdateManyWithWhereWithoutGameInput
      | ListingUpdateManyWithWhereWithoutGameInput[]
    deleteMany?: ListingScalarWhereInput | ListingScalarWhereInput[]
  }

  export type ListingUncheckedUpdateManyWithoutGameNestedInput = {
    create?:
      | XOR<
          ListingCreateWithoutGameInput,
          ListingUncheckedCreateWithoutGameInput
        >
      | ListingCreateWithoutGameInput[]
      | ListingUncheckedCreateWithoutGameInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutGameInput
      | ListingCreateOrConnectWithoutGameInput[]
    upsert?:
      | ListingUpsertWithWhereUniqueWithoutGameInput
      | ListingUpsertWithWhereUniqueWithoutGameInput[]
    createMany?: ListingCreateManyGameInputEnvelope
    set?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    disconnect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    delete?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    update?:
      | ListingUpdateWithWhereUniqueWithoutGameInput
      | ListingUpdateWithWhereUniqueWithoutGameInput[]
    updateMany?:
      | ListingUpdateManyWithWhereWithoutGameInput
      | ListingUpdateManyWithWhereWithoutGameInput[]
    deleteMany?: ListingScalarWhereInput | ListingScalarWhereInput[]
  }

  export type ListingCreateNestedManyWithoutEmulatorInput = {
    create?:
      | XOR<
          ListingCreateWithoutEmulatorInput,
          ListingUncheckedCreateWithoutEmulatorInput
        >
      | ListingCreateWithoutEmulatorInput[]
      | ListingUncheckedCreateWithoutEmulatorInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutEmulatorInput
      | ListingCreateOrConnectWithoutEmulatorInput[]
    createMany?: ListingCreateManyEmulatorInputEnvelope
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
  }

  export type ListingUncheckedCreateNestedManyWithoutEmulatorInput = {
    create?:
      | XOR<
          ListingCreateWithoutEmulatorInput,
          ListingUncheckedCreateWithoutEmulatorInput
        >
      | ListingCreateWithoutEmulatorInput[]
      | ListingUncheckedCreateWithoutEmulatorInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutEmulatorInput
      | ListingCreateOrConnectWithoutEmulatorInput[]
    createMany?: ListingCreateManyEmulatorInputEnvelope
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
  }

  export type ListingUpdateManyWithoutEmulatorNestedInput = {
    create?:
      | XOR<
          ListingCreateWithoutEmulatorInput,
          ListingUncheckedCreateWithoutEmulatorInput
        >
      | ListingCreateWithoutEmulatorInput[]
      | ListingUncheckedCreateWithoutEmulatorInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutEmulatorInput
      | ListingCreateOrConnectWithoutEmulatorInput[]
    upsert?:
      | ListingUpsertWithWhereUniqueWithoutEmulatorInput
      | ListingUpsertWithWhereUniqueWithoutEmulatorInput[]
    createMany?: ListingCreateManyEmulatorInputEnvelope
    set?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    disconnect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    delete?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    update?:
      | ListingUpdateWithWhereUniqueWithoutEmulatorInput
      | ListingUpdateWithWhereUniqueWithoutEmulatorInput[]
    updateMany?:
      | ListingUpdateManyWithWhereWithoutEmulatorInput
      | ListingUpdateManyWithWhereWithoutEmulatorInput[]
    deleteMany?: ListingScalarWhereInput | ListingScalarWhereInput[]
  }

  export type ListingUncheckedUpdateManyWithoutEmulatorNestedInput = {
    create?:
      | XOR<
          ListingCreateWithoutEmulatorInput,
          ListingUncheckedCreateWithoutEmulatorInput
        >
      | ListingCreateWithoutEmulatorInput[]
      | ListingUncheckedCreateWithoutEmulatorInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutEmulatorInput
      | ListingCreateOrConnectWithoutEmulatorInput[]
    upsert?:
      | ListingUpsertWithWhereUniqueWithoutEmulatorInput
      | ListingUpsertWithWhereUniqueWithoutEmulatorInput[]
    createMany?: ListingCreateManyEmulatorInputEnvelope
    set?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    disconnect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    delete?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    update?:
      | ListingUpdateWithWhereUniqueWithoutEmulatorInput
      | ListingUpdateWithWhereUniqueWithoutEmulatorInput[]
    updateMany?:
      | ListingUpdateManyWithWhereWithoutEmulatorInput
      | ListingUpdateManyWithWhereWithoutEmulatorInput[]
    deleteMany?: ListingScalarWhereInput | ListingScalarWhereInput[]
  }

  export type ListingCreateNestedManyWithoutPerformanceInput = {
    create?:
      | XOR<
          ListingCreateWithoutPerformanceInput,
          ListingUncheckedCreateWithoutPerformanceInput
        >
      | ListingCreateWithoutPerformanceInput[]
      | ListingUncheckedCreateWithoutPerformanceInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutPerformanceInput
      | ListingCreateOrConnectWithoutPerformanceInput[]
    createMany?: ListingCreateManyPerformanceInputEnvelope
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
  }

  export type ListingUncheckedCreateNestedManyWithoutPerformanceInput = {
    create?:
      | XOR<
          ListingCreateWithoutPerformanceInput,
          ListingUncheckedCreateWithoutPerformanceInput
        >
      | ListingCreateWithoutPerformanceInput[]
      | ListingUncheckedCreateWithoutPerformanceInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutPerformanceInput
      | ListingCreateOrConnectWithoutPerformanceInput[]
    createMany?: ListingCreateManyPerformanceInputEnvelope
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ListingUpdateManyWithoutPerformanceNestedInput = {
    create?:
      | XOR<
          ListingCreateWithoutPerformanceInput,
          ListingUncheckedCreateWithoutPerformanceInput
        >
      | ListingCreateWithoutPerformanceInput[]
      | ListingUncheckedCreateWithoutPerformanceInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutPerformanceInput
      | ListingCreateOrConnectWithoutPerformanceInput[]
    upsert?:
      | ListingUpsertWithWhereUniqueWithoutPerformanceInput
      | ListingUpsertWithWhereUniqueWithoutPerformanceInput[]
    createMany?: ListingCreateManyPerformanceInputEnvelope
    set?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    disconnect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    delete?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    update?:
      | ListingUpdateWithWhereUniqueWithoutPerformanceInput
      | ListingUpdateWithWhereUniqueWithoutPerformanceInput[]
    updateMany?:
      | ListingUpdateManyWithWhereWithoutPerformanceInput
      | ListingUpdateManyWithWhereWithoutPerformanceInput[]
    deleteMany?: ListingScalarWhereInput | ListingScalarWhereInput[]
  }

  export type ListingUncheckedUpdateManyWithoutPerformanceNestedInput = {
    create?:
      | XOR<
          ListingCreateWithoutPerformanceInput,
          ListingUncheckedCreateWithoutPerformanceInput
        >
      | ListingCreateWithoutPerformanceInput[]
      | ListingUncheckedCreateWithoutPerformanceInput[]
    connectOrCreate?:
      | ListingCreateOrConnectWithoutPerformanceInput
      | ListingCreateOrConnectWithoutPerformanceInput[]
    upsert?:
      | ListingUpsertWithWhereUniqueWithoutPerformanceInput
      | ListingUpsertWithWhereUniqueWithoutPerformanceInput[]
    createMany?: ListingCreateManyPerformanceInputEnvelope
    set?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    disconnect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    delete?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    connect?: ListingWhereUniqueInput | ListingWhereUniqueInput[]
    update?:
      | ListingUpdateWithWhereUniqueWithoutPerformanceInput
      | ListingUpdateWithWhereUniqueWithoutPerformanceInput[]
    updateMany?:
      | ListingUpdateManyWithWhereWithoutPerformanceInput
      | ListingUpdateManyWithWhereWithoutPerformanceInput[]
    deleteMany?: ListingScalarWhereInput | ListingScalarWhereInput[]
  }

  export type DeviceCreateNestedOneWithoutListingsInput = {
    create?: XOR<
      DeviceCreateWithoutListingsInput,
      DeviceUncheckedCreateWithoutListingsInput
    >
    connectOrCreate?: DeviceCreateOrConnectWithoutListingsInput
    connect?: DeviceWhereUniqueInput
  }

  export type GameCreateNestedOneWithoutListingsInput = {
    create?: XOR<
      GameCreateWithoutListingsInput,
      GameUncheckedCreateWithoutListingsInput
    >
    connectOrCreate?: GameCreateOrConnectWithoutListingsInput
    connect?: GameWhereUniqueInput
  }

  export type EmulatorCreateNestedOneWithoutListingsInput = {
    create?: XOR<
      EmulatorCreateWithoutListingsInput,
      EmulatorUncheckedCreateWithoutListingsInput
    >
    connectOrCreate?: EmulatorCreateOrConnectWithoutListingsInput
    connect?: EmulatorWhereUniqueInput
  }

  export type PerformanceScaleCreateNestedOneWithoutListingsInput = {
    create?: XOR<
      PerformanceScaleCreateWithoutListingsInput,
      PerformanceScaleUncheckedCreateWithoutListingsInput
    >
    connectOrCreate?: PerformanceScaleCreateOrConnectWithoutListingsInput
    connect?: PerformanceScaleWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutListingsInput = {
    create?: XOR<
      UserCreateWithoutListingsInput,
      UserUncheckedCreateWithoutListingsInput
    >
    connectOrCreate?: UserCreateOrConnectWithoutListingsInput
    connect?: UserWhereUniqueInput
  }

  export type VoteCreateNestedManyWithoutListingInput = {
    create?:
      | XOR<
          VoteCreateWithoutListingInput,
          VoteUncheckedCreateWithoutListingInput
        >
      | VoteCreateWithoutListingInput[]
      | VoteUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | VoteCreateOrConnectWithoutListingInput
      | VoteCreateOrConnectWithoutListingInput[]
    createMany?: VoteCreateManyListingInputEnvelope
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
  }

  export type CommentCreateNestedManyWithoutListingInput = {
    create?:
      | XOR<
          CommentCreateWithoutListingInput,
          CommentUncheckedCreateWithoutListingInput
        >
      | CommentCreateWithoutListingInput[]
      | CommentUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutListingInput
      | CommentCreateOrConnectWithoutListingInput[]
    createMany?: CommentCreateManyListingInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type ListingApprovalCreateNestedManyWithoutListingInput = {
    create?:
      | XOR<
          ListingApprovalCreateWithoutListingInput,
          ListingApprovalUncheckedCreateWithoutListingInput
        >
      | ListingApprovalCreateWithoutListingInput[]
      | ListingApprovalUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | ListingApprovalCreateOrConnectWithoutListingInput
      | ListingApprovalCreateOrConnectWithoutListingInput[]
    createMany?: ListingApprovalCreateManyListingInputEnvelope
    connect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
  }

  export type VoteUncheckedCreateNestedManyWithoutListingInput = {
    create?:
      | XOR<
          VoteCreateWithoutListingInput,
          VoteUncheckedCreateWithoutListingInput
        >
      | VoteCreateWithoutListingInput[]
      | VoteUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | VoteCreateOrConnectWithoutListingInput
      | VoteCreateOrConnectWithoutListingInput[]
    createMany?: VoteCreateManyListingInputEnvelope
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
  }

  export type CommentUncheckedCreateNestedManyWithoutListingInput = {
    create?:
      | XOR<
          CommentCreateWithoutListingInput,
          CommentUncheckedCreateWithoutListingInput
        >
      | CommentCreateWithoutListingInput[]
      | CommentUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutListingInput
      | CommentCreateOrConnectWithoutListingInput[]
    createMany?: CommentCreateManyListingInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type ListingApprovalUncheckedCreateNestedManyWithoutListingInput = {
    create?:
      | XOR<
          ListingApprovalCreateWithoutListingInput,
          ListingApprovalUncheckedCreateWithoutListingInput
        >
      | ListingApprovalCreateWithoutListingInput[]
      | ListingApprovalUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | ListingApprovalCreateOrConnectWithoutListingInput
      | ListingApprovalCreateOrConnectWithoutListingInput[]
    createMany?: ListingApprovalCreateManyListingInputEnvelope
    connect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
  }

  export type DeviceUpdateOneRequiredWithoutListingsNestedInput = {
    create?: XOR<
      DeviceCreateWithoutListingsInput,
      DeviceUncheckedCreateWithoutListingsInput
    >
    connectOrCreate?: DeviceCreateOrConnectWithoutListingsInput
    upsert?: DeviceUpsertWithoutListingsInput
    connect?: DeviceWhereUniqueInput
    update?: XOR<
      XOR<
        DeviceUpdateToOneWithWhereWithoutListingsInput,
        DeviceUpdateWithoutListingsInput
      >,
      DeviceUncheckedUpdateWithoutListingsInput
    >
  }

  export type GameUpdateOneRequiredWithoutListingsNestedInput = {
    create?: XOR<
      GameCreateWithoutListingsInput,
      GameUncheckedCreateWithoutListingsInput
    >
    connectOrCreate?: GameCreateOrConnectWithoutListingsInput
    upsert?: GameUpsertWithoutListingsInput
    connect?: GameWhereUniqueInput
    update?: XOR<
      XOR<
        GameUpdateToOneWithWhereWithoutListingsInput,
        GameUpdateWithoutListingsInput
      >,
      GameUncheckedUpdateWithoutListingsInput
    >
  }

  export type EmulatorUpdateOneRequiredWithoutListingsNestedInput = {
    create?: XOR<
      EmulatorCreateWithoutListingsInput,
      EmulatorUncheckedCreateWithoutListingsInput
    >
    connectOrCreate?: EmulatorCreateOrConnectWithoutListingsInput
    upsert?: EmulatorUpsertWithoutListingsInput
    connect?: EmulatorWhereUniqueInput
    update?: XOR<
      XOR<
        EmulatorUpdateToOneWithWhereWithoutListingsInput,
        EmulatorUpdateWithoutListingsInput
      >,
      EmulatorUncheckedUpdateWithoutListingsInput
    >
  }

  export type PerformanceScaleUpdateOneRequiredWithoutListingsNestedInput = {
    create?: XOR<
      PerformanceScaleCreateWithoutListingsInput,
      PerformanceScaleUncheckedCreateWithoutListingsInput
    >
    connectOrCreate?: PerformanceScaleCreateOrConnectWithoutListingsInput
    upsert?: PerformanceScaleUpsertWithoutListingsInput
    connect?: PerformanceScaleWhereUniqueInput
    update?: XOR<
      XOR<
        PerformanceScaleUpdateToOneWithWhereWithoutListingsInput,
        PerformanceScaleUpdateWithoutListingsInput
      >,
      PerformanceScaleUncheckedUpdateWithoutListingsInput
    >
  }

  export type UserUpdateOneRequiredWithoutListingsNestedInput = {
    create?: XOR<
      UserCreateWithoutListingsInput,
      UserUncheckedCreateWithoutListingsInput
    >
    connectOrCreate?: UserCreateOrConnectWithoutListingsInput
    upsert?: UserUpsertWithoutListingsInput
    connect?: UserWhereUniqueInput
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutListingsInput,
        UserUpdateWithoutListingsInput
      >,
      UserUncheckedUpdateWithoutListingsInput
    >
  }

  export type VoteUpdateManyWithoutListingNestedInput = {
    create?:
      | XOR<
          VoteCreateWithoutListingInput,
          VoteUncheckedCreateWithoutListingInput
        >
      | VoteCreateWithoutListingInput[]
      | VoteUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | VoteCreateOrConnectWithoutListingInput
      | VoteCreateOrConnectWithoutListingInput[]
    upsert?:
      | VoteUpsertWithWhereUniqueWithoutListingInput
      | VoteUpsertWithWhereUniqueWithoutListingInput[]
    createMany?: VoteCreateManyListingInputEnvelope
    set?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    disconnect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    delete?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    update?:
      | VoteUpdateWithWhereUniqueWithoutListingInput
      | VoteUpdateWithWhereUniqueWithoutListingInput[]
    updateMany?:
      | VoteUpdateManyWithWhereWithoutListingInput
      | VoteUpdateManyWithWhereWithoutListingInput[]
    deleteMany?: VoteScalarWhereInput | VoteScalarWhereInput[]
  }

  export type CommentUpdateManyWithoutListingNestedInput = {
    create?:
      | XOR<
          CommentCreateWithoutListingInput,
          CommentUncheckedCreateWithoutListingInput
        >
      | CommentCreateWithoutListingInput[]
      | CommentUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutListingInput
      | CommentCreateOrConnectWithoutListingInput[]
    upsert?:
      | CommentUpsertWithWhereUniqueWithoutListingInput
      | CommentUpsertWithWhereUniqueWithoutListingInput[]
    createMany?: CommentCreateManyListingInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?:
      | CommentUpdateWithWhereUniqueWithoutListingInput
      | CommentUpdateWithWhereUniqueWithoutListingInput[]
    updateMany?:
      | CommentUpdateManyWithWhereWithoutListingInput
      | CommentUpdateManyWithWhereWithoutListingInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type ListingApprovalUpdateManyWithoutListingNestedInput = {
    create?:
      | XOR<
          ListingApprovalCreateWithoutListingInput,
          ListingApprovalUncheckedCreateWithoutListingInput
        >
      | ListingApprovalCreateWithoutListingInput[]
      | ListingApprovalUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | ListingApprovalCreateOrConnectWithoutListingInput
      | ListingApprovalCreateOrConnectWithoutListingInput[]
    upsert?:
      | ListingApprovalUpsertWithWhereUniqueWithoutListingInput
      | ListingApprovalUpsertWithWhereUniqueWithoutListingInput[]
    createMany?: ListingApprovalCreateManyListingInputEnvelope
    set?: ListingApprovalWhereUniqueInput | ListingApprovalWhereUniqueInput[]
    disconnect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
    delete?: ListingApprovalWhereUniqueInput | ListingApprovalWhereUniqueInput[]
    connect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
    update?:
      | ListingApprovalUpdateWithWhereUniqueWithoutListingInput
      | ListingApprovalUpdateWithWhereUniqueWithoutListingInput[]
    updateMany?:
      | ListingApprovalUpdateManyWithWhereWithoutListingInput
      | ListingApprovalUpdateManyWithWhereWithoutListingInput[]
    deleteMany?:
      | ListingApprovalScalarWhereInput
      | ListingApprovalScalarWhereInput[]
  }

  export type VoteUncheckedUpdateManyWithoutListingNestedInput = {
    create?:
      | XOR<
          VoteCreateWithoutListingInput,
          VoteUncheckedCreateWithoutListingInput
        >
      | VoteCreateWithoutListingInput[]
      | VoteUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | VoteCreateOrConnectWithoutListingInput
      | VoteCreateOrConnectWithoutListingInput[]
    upsert?:
      | VoteUpsertWithWhereUniqueWithoutListingInput
      | VoteUpsertWithWhereUniqueWithoutListingInput[]
    createMany?: VoteCreateManyListingInputEnvelope
    set?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    disconnect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    delete?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    connect?: VoteWhereUniqueInput | VoteWhereUniqueInput[]
    update?:
      | VoteUpdateWithWhereUniqueWithoutListingInput
      | VoteUpdateWithWhereUniqueWithoutListingInput[]
    updateMany?:
      | VoteUpdateManyWithWhereWithoutListingInput
      | VoteUpdateManyWithWhereWithoutListingInput[]
    deleteMany?: VoteScalarWhereInput | VoteScalarWhereInput[]
  }

  export type CommentUncheckedUpdateManyWithoutListingNestedInput = {
    create?:
      | XOR<
          CommentCreateWithoutListingInput,
          CommentUncheckedCreateWithoutListingInput
        >
      | CommentCreateWithoutListingInput[]
      | CommentUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutListingInput
      | CommentCreateOrConnectWithoutListingInput[]
    upsert?:
      | CommentUpsertWithWhereUniqueWithoutListingInput
      | CommentUpsertWithWhereUniqueWithoutListingInput[]
    createMany?: CommentCreateManyListingInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?:
      | CommentUpdateWithWhereUniqueWithoutListingInput
      | CommentUpdateWithWhereUniqueWithoutListingInput[]
    updateMany?:
      | CommentUpdateManyWithWhereWithoutListingInput
      | CommentUpdateManyWithWhereWithoutListingInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type ListingApprovalUncheckedUpdateManyWithoutListingNestedInput = {
    create?:
      | XOR<
          ListingApprovalCreateWithoutListingInput,
          ListingApprovalUncheckedCreateWithoutListingInput
        >
      | ListingApprovalCreateWithoutListingInput[]
      | ListingApprovalUncheckedCreateWithoutListingInput[]
    connectOrCreate?:
      | ListingApprovalCreateOrConnectWithoutListingInput
      | ListingApprovalCreateOrConnectWithoutListingInput[]
    upsert?:
      | ListingApprovalUpsertWithWhereUniqueWithoutListingInput
      | ListingApprovalUpsertWithWhereUniqueWithoutListingInput[]
    createMany?: ListingApprovalCreateManyListingInputEnvelope
    set?: ListingApprovalWhereUniqueInput | ListingApprovalWhereUniqueInput[]
    disconnect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
    delete?: ListingApprovalWhereUniqueInput | ListingApprovalWhereUniqueInput[]
    connect?:
      | ListingApprovalWhereUniqueInput
      | ListingApprovalWhereUniqueInput[]
    update?:
      | ListingApprovalUpdateWithWhereUniqueWithoutListingInput
      | ListingApprovalUpdateWithWhereUniqueWithoutListingInput[]
    updateMany?:
      | ListingApprovalUpdateManyWithWhereWithoutListingInput
      | ListingApprovalUpdateManyWithWhereWithoutListingInput[]
    deleteMany?:
      | ListingApprovalScalarWhereInput
      | ListingApprovalScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutVotesInput = {
    create?: XOR<
      UserCreateWithoutVotesInput,
      UserUncheckedCreateWithoutVotesInput
    >
    connectOrCreate?: UserCreateOrConnectWithoutVotesInput
    connect?: UserWhereUniqueInput
  }

  export type ListingCreateNestedOneWithoutVotesInput = {
    create?: XOR<
      ListingCreateWithoutVotesInput,
      ListingUncheckedCreateWithoutVotesInput
    >
    connectOrCreate?: ListingCreateOrConnectWithoutVotesInput
    connect?: ListingWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type UserUpdateOneRequiredWithoutVotesNestedInput = {
    create?: XOR<
      UserCreateWithoutVotesInput,
      UserUncheckedCreateWithoutVotesInput
    >
    connectOrCreate?: UserCreateOrConnectWithoutVotesInput
    upsert?: UserUpsertWithoutVotesInput
    connect?: UserWhereUniqueInput
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutVotesInput,
        UserUpdateWithoutVotesInput
      >,
      UserUncheckedUpdateWithoutVotesInput
    >
  }

  export type ListingUpdateOneRequiredWithoutVotesNestedInput = {
    create?: XOR<
      ListingCreateWithoutVotesInput,
      ListingUncheckedCreateWithoutVotesInput
    >
    connectOrCreate?: ListingCreateOrConnectWithoutVotesInput
    upsert?: ListingUpsertWithoutVotesInput
    connect?: ListingWhereUniqueInput
    update?: XOR<
      XOR<
        ListingUpdateToOneWithWhereWithoutVotesInput,
        ListingUpdateWithoutVotesInput
      >,
      ListingUncheckedUpdateWithoutVotesInput
    >
  }

  export type UserCreateNestedOneWithoutCommentsInput = {
    create?: XOR<
      UserCreateWithoutCommentsInput,
      UserUncheckedCreateWithoutCommentsInput
    >
    connectOrCreate?: UserCreateOrConnectWithoutCommentsInput
    connect?: UserWhereUniqueInput
  }

  export type ListingCreateNestedOneWithoutCommentsInput = {
    create?: XOR<
      ListingCreateWithoutCommentsInput,
      ListingUncheckedCreateWithoutCommentsInput
    >
    connectOrCreate?: ListingCreateOrConnectWithoutCommentsInput
    connect?: ListingWhereUniqueInput
  }

  export type CommentCreateNestedOneWithoutRepliesInput = {
    create?: XOR<
      CommentCreateWithoutRepliesInput,
      CommentUncheckedCreateWithoutRepliesInput
    >
    connectOrCreate?: CommentCreateOrConnectWithoutRepliesInput
    connect?: CommentWhereUniqueInput
  }

  export type CommentCreateNestedManyWithoutParentInput = {
    create?:
      | XOR<
          CommentCreateWithoutParentInput,
          CommentUncheckedCreateWithoutParentInput
        >
      | CommentCreateWithoutParentInput[]
      | CommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutParentInput
      | CommentCreateOrConnectWithoutParentInput[]
    createMany?: CommentCreateManyParentInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type CommentUncheckedCreateNestedManyWithoutParentInput = {
    create?:
      | XOR<
          CommentCreateWithoutParentInput,
          CommentUncheckedCreateWithoutParentInput
        >
      | CommentCreateWithoutParentInput[]
      | CommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutParentInput
      | CommentCreateOrConnectWithoutParentInput[]
    createMany?: CommentCreateManyParentInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: XOR<
      UserCreateWithoutCommentsInput,
      UserUncheckedCreateWithoutCommentsInput
    >
    connectOrCreate?: UserCreateOrConnectWithoutCommentsInput
    upsert?: UserUpsertWithoutCommentsInput
    connect?: UserWhereUniqueInput
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutCommentsInput,
        UserUpdateWithoutCommentsInput
      >,
      UserUncheckedUpdateWithoutCommentsInput
    >
  }

  export type ListingUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: XOR<
      ListingCreateWithoutCommentsInput,
      ListingUncheckedCreateWithoutCommentsInput
    >
    connectOrCreate?: ListingCreateOrConnectWithoutCommentsInput
    upsert?: ListingUpsertWithoutCommentsInput
    connect?: ListingWhereUniqueInput
    update?: XOR<
      XOR<
        ListingUpdateToOneWithWhereWithoutCommentsInput,
        ListingUpdateWithoutCommentsInput
      >,
      ListingUncheckedUpdateWithoutCommentsInput
    >
  }

  export type CommentUpdateOneWithoutRepliesNestedInput = {
    create?: XOR<
      CommentCreateWithoutRepliesInput,
      CommentUncheckedCreateWithoutRepliesInput
    >
    connectOrCreate?: CommentCreateOrConnectWithoutRepliesInput
    upsert?: CommentUpsertWithoutRepliesInput
    disconnect?: CommentWhereInput | boolean
    delete?: CommentWhereInput | boolean
    connect?: CommentWhereUniqueInput
    update?: XOR<
      XOR<
        CommentUpdateToOneWithWhereWithoutRepliesInput,
        CommentUpdateWithoutRepliesInput
      >,
      CommentUncheckedUpdateWithoutRepliesInput
    >
  }

  export type CommentUpdateManyWithoutParentNestedInput = {
    create?:
      | XOR<
          CommentCreateWithoutParentInput,
          CommentUncheckedCreateWithoutParentInput
        >
      | CommentCreateWithoutParentInput[]
      | CommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutParentInput
      | CommentCreateOrConnectWithoutParentInput[]
    upsert?:
      | CommentUpsertWithWhereUniqueWithoutParentInput
      | CommentUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: CommentCreateManyParentInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?:
      | CommentUpdateWithWhereUniqueWithoutParentInput
      | CommentUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?:
      | CommentUpdateManyWithWhereWithoutParentInput
      | CommentUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type CommentUncheckedUpdateManyWithoutParentNestedInput = {
    create?:
      | XOR<
          CommentCreateWithoutParentInput,
          CommentUncheckedCreateWithoutParentInput
        >
      | CommentCreateWithoutParentInput[]
      | CommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?:
      | CommentCreateOrConnectWithoutParentInput
      | CommentCreateOrConnectWithoutParentInput[]
    upsert?:
      | CommentUpsertWithWhereUniqueWithoutParentInput
      | CommentUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: CommentCreateManyParentInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?:
      | CommentUpdateWithWhereUniqueWithoutParentInput
      | CommentUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?:
      | CommentUpdateManyWithWhereWithoutParentInput
      | CommentUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type ListingCreateNestedOneWithoutApprovalsInput = {
    create?: XOR<
      ListingCreateWithoutApprovalsInput,
      ListingUncheckedCreateWithoutApprovalsInput
    >
    connectOrCreate?: ListingCreateOrConnectWithoutApprovalsInput
    connect?: ListingWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutApprovalsGivenInput = {
    create?: XOR<
      UserCreateWithoutApprovalsGivenInput,
      UserUncheckedCreateWithoutApprovalsGivenInput
    >
    connectOrCreate?: UserCreateOrConnectWithoutApprovalsGivenInput
    connect?: UserWhereUniqueInput
  }

  export type EnumApprovalStatusFieldUpdateOperationsInput = {
    set?: $Enums.ApprovalStatus
  }

  export type ListingUpdateOneRequiredWithoutApprovalsNestedInput = {
    create?: XOR<
      ListingCreateWithoutApprovalsInput,
      ListingUncheckedCreateWithoutApprovalsInput
    >
    connectOrCreate?: ListingCreateOrConnectWithoutApprovalsInput
    upsert?: ListingUpsertWithoutApprovalsInput
    connect?: ListingWhereUniqueInput
    update?: XOR<
      XOR<
        ListingUpdateToOneWithWhereWithoutApprovalsInput,
        ListingUpdateWithoutApprovalsInput
      >,
      ListingUncheckedUpdateWithoutApprovalsInput
    >
  }

  export type UserUpdateOneRequiredWithoutApprovalsGivenNestedInput = {
    create?: XOR<
      UserCreateWithoutApprovalsGivenInput,
      UserUncheckedCreateWithoutApprovalsGivenInput
    >
    connectOrCreate?: UserCreateOrConnectWithoutApprovalsGivenInput
    upsert?: UserUpsertWithoutApprovalsGivenInput
    connect?: UserWhereUniqueInput
    update?: XOR<
      XOR<
        UserUpdateToOneWithWhereWithoutApprovalsGivenInput,
        UserUpdateWithoutApprovalsGivenInput
      >,
      UserUncheckedUpdateWithoutApprovalsGivenInput
    >
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumApprovalStatusFilter<$PrismaModel = never> = {
    equals?:
      | $Enums.ApprovalStatus
      | EnumApprovalStatusFieldRefInput<$PrismaModel>
    in?:
      | $Enums.ApprovalStatus[]
      | ListEnumApprovalStatusFieldRefInput<$PrismaModel>
    notIn?:
      | $Enums.ApprovalStatus[]
      | ListEnumApprovalStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumApprovalStatusFilter<$PrismaModel> | $Enums.ApprovalStatus
  }

  export type NestedEnumApprovalStatusWithAggregatesFilter<
    $PrismaModel = never,
  > = {
    equals?:
      | $Enums.ApprovalStatus
      | EnumApprovalStatusFieldRefInput<$PrismaModel>
    in?:
      | $Enums.ApprovalStatus[]
      | ListEnumApprovalStatusFieldRefInput<$PrismaModel>
    notIn?:
      | $Enums.ApprovalStatus[]
      | ListEnumApprovalStatusFieldRefInput<$PrismaModel>
    not?:
      | NestedEnumApprovalStatusWithAggregatesFilter<$PrismaModel>
      | $Enums.ApprovalStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumApprovalStatusFilter<$PrismaModel>
    _max?: NestedEnumApprovalStatusFilter<$PrismaModel>
  }

  export type ListingCreateWithoutAuthorInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    device: DeviceCreateNestedOneWithoutListingsInput
    game: GameCreateNestedOneWithoutListingsInput
    emulator: EmulatorCreateNestedOneWithoutListingsInput
    performance: PerformanceScaleCreateNestedOneWithoutListingsInput
    votes?: VoteCreateNestedManyWithoutListingInput
    comments?: CommentCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateWithoutAuthorInput = {
    id?: string
    deviceId: string
    gameId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    createdAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutListingInput
    comments?: CommentUncheckedCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingCreateOrConnectWithoutAuthorInput = {
    where: ListingWhereUniqueInput
    create: XOR<
      ListingCreateWithoutAuthorInput,
      ListingUncheckedCreateWithoutAuthorInput
    >
  }

  export type ListingCreateManyAuthorInputEnvelope = {
    data: ListingCreateManyAuthorInput | ListingCreateManyAuthorInput[]
    skipDuplicates?: boolean
  }

  export type VoteCreateWithoutUserInput = {
    id?: string
    value: boolean
    listing: ListingCreateNestedOneWithoutVotesInput
  }

  export type VoteUncheckedCreateWithoutUserInput = {
    id?: string
    value: boolean
    listingId: string
  }

  export type VoteCreateOrConnectWithoutUserInput = {
    where: VoteWhereUniqueInput
    create: XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput>
  }

  export type VoteCreateManyUserInputEnvelope = {
    data: VoteCreateManyUserInput | VoteCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type CommentCreateWithoutUserInput = {
    id?: string
    content: string
    createdAt?: Date | string
    listing: ListingCreateNestedOneWithoutCommentsInput
    parent?: CommentCreateNestedOneWithoutRepliesInput
    replies?: CommentCreateNestedManyWithoutParentInput
  }

  export type CommentUncheckedCreateWithoutUserInput = {
    id?: string
    content: string
    listingId: string
    parentId?: string | null
    createdAt?: Date | string
    replies?: CommentUncheckedCreateNestedManyWithoutParentInput
  }

  export type CommentCreateOrConnectWithoutUserInput = {
    where: CommentWhereUniqueInput
    create: XOR<
      CommentCreateWithoutUserInput,
      CommentUncheckedCreateWithoutUserInput
    >
  }

  export type CommentCreateManyUserInputEnvelope = {
    data: CommentCreateManyUserInput | CommentCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type ListingApprovalCreateWithoutApprovedByInput = {
    id?: string
    approvedByRole: $Enums.Role
    approvedAt?: Date | string
    status: $Enums.ApprovalStatus
    notes?: string | null
    listing: ListingCreateNestedOneWithoutApprovalsInput
  }

  export type ListingApprovalUncheckedCreateWithoutApprovedByInput = {
    id?: string
    listingId: string
    approvedByRole: $Enums.Role
    approvedAt?: Date | string
    status: $Enums.ApprovalStatus
    notes?: string | null
  }

  export type ListingApprovalCreateOrConnectWithoutApprovedByInput = {
    where: ListingApprovalWhereUniqueInput
    create: XOR<
      ListingApprovalCreateWithoutApprovedByInput,
      ListingApprovalUncheckedCreateWithoutApprovedByInput
    >
  }

  export type ListingApprovalCreateManyApprovedByInputEnvelope = {
    data:
      | ListingApprovalCreateManyApprovedByInput
      | ListingApprovalCreateManyApprovedByInput[]
    skipDuplicates?: boolean
  }

  export type ListingUpsertWithWhereUniqueWithoutAuthorInput = {
    where: ListingWhereUniqueInput
    update: XOR<
      ListingUpdateWithoutAuthorInput,
      ListingUncheckedUpdateWithoutAuthorInput
    >
    create: XOR<
      ListingCreateWithoutAuthorInput,
      ListingUncheckedCreateWithoutAuthorInput
    >
  }

  export type ListingUpdateWithWhereUniqueWithoutAuthorInput = {
    where: ListingWhereUniqueInput
    data: XOR<
      ListingUpdateWithoutAuthorInput,
      ListingUncheckedUpdateWithoutAuthorInput
    >
  }

  export type ListingUpdateManyWithWhereWithoutAuthorInput = {
    where: ListingScalarWhereInput
    data: XOR<
      ListingUpdateManyMutationInput,
      ListingUncheckedUpdateManyWithoutAuthorInput
    >
  }

  export type ListingScalarWhereInput = {
    AND?: ListingScalarWhereInput | ListingScalarWhereInput[]
    OR?: ListingScalarWhereInput[]
    NOT?: ListingScalarWhereInput | ListingScalarWhereInput[]
    id?: StringFilter<'Listing'> | string
    deviceId?: StringFilter<'Listing'> | string
    gameId?: StringFilter<'Listing'> | string
    emulatorId?: StringFilter<'Listing'> | string
    performanceId?: IntFilter<'Listing'> | number
    notes?: StringNullableFilter<'Listing'> | string | null
    authorId?: StringFilter<'Listing'> | string
    createdAt?: DateTimeFilter<'Listing'> | Date | string
  }

  export type VoteUpsertWithWhereUniqueWithoutUserInput = {
    where: VoteWhereUniqueInput
    update: XOR<VoteUpdateWithoutUserInput, VoteUncheckedUpdateWithoutUserInput>
    create: XOR<VoteCreateWithoutUserInput, VoteUncheckedCreateWithoutUserInput>
  }

  export type VoteUpdateWithWhereUniqueWithoutUserInput = {
    where: VoteWhereUniqueInput
    data: XOR<VoteUpdateWithoutUserInput, VoteUncheckedUpdateWithoutUserInput>
  }

  export type VoteUpdateManyWithWhereWithoutUserInput = {
    where: VoteScalarWhereInput
    data: XOR<
      VoteUpdateManyMutationInput,
      VoteUncheckedUpdateManyWithoutUserInput
    >
  }

  export type VoteScalarWhereInput = {
    AND?: VoteScalarWhereInput | VoteScalarWhereInput[]
    OR?: VoteScalarWhereInput[]
    NOT?: VoteScalarWhereInput | VoteScalarWhereInput[]
    id?: StringFilter<'Vote'> | string
    value?: BoolFilter<'Vote'> | boolean
    userId?: StringFilter<'Vote'> | string
    listingId?: StringFilter<'Vote'> | string
  }

  export type CommentUpsertWithWhereUniqueWithoutUserInput = {
    where: CommentWhereUniqueInput
    update: XOR<
      CommentUpdateWithoutUserInput,
      CommentUncheckedUpdateWithoutUserInput
    >
    create: XOR<
      CommentCreateWithoutUserInput,
      CommentUncheckedCreateWithoutUserInput
    >
  }

  export type CommentUpdateWithWhereUniqueWithoutUserInput = {
    where: CommentWhereUniqueInput
    data: XOR<
      CommentUpdateWithoutUserInput,
      CommentUncheckedUpdateWithoutUserInput
    >
  }

  export type CommentUpdateManyWithWhereWithoutUserInput = {
    where: CommentScalarWhereInput
    data: XOR<
      CommentUpdateManyMutationInput,
      CommentUncheckedUpdateManyWithoutUserInput
    >
  }

  export type CommentScalarWhereInput = {
    AND?: CommentScalarWhereInput | CommentScalarWhereInput[]
    OR?: CommentScalarWhereInput[]
    NOT?: CommentScalarWhereInput | CommentScalarWhereInput[]
    id?: StringFilter<'Comment'> | string
    content?: StringFilter<'Comment'> | string
    userId?: StringFilter<'Comment'> | string
    listingId?: StringFilter<'Comment'> | string
    parentId?: StringNullableFilter<'Comment'> | string | null
    createdAt?: DateTimeFilter<'Comment'> | Date | string
  }

  export type ListingApprovalUpsertWithWhereUniqueWithoutApprovedByInput = {
    where: ListingApprovalWhereUniqueInput
    update: XOR<
      ListingApprovalUpdateWithoutApprovedByInput,
      ListingApprovalUncheckedUpdateWithoutApprovedByInput
    >
    create: XOR<
      ListingApprovalCreateWithoutApprovedByInput,
      ListingApprovalUncheckedCreateWithoutApprovedByInput
    >
  }

  export type ListingApprovalUpdateWithWhereUniqueWithoutApprovedByInput = {
    where: ListingApprovalWhereUniqueInput
    data: XOR<
      ListingApprovalUpdateWithoutApprovedByInput,
      ListingApprovalUncheckedUpdateWithoutApprovedByInput
    >
  }

  export type ListingApprovalUpdateManyWithWhereWithoutApprovedByInput = {
    where: ListingApprovalScalarWhereInput
    data: XOR<
      ListingApprovalUpdateManyMutationInput,
      ListingApprovalUncheckedUpdateManyWithoutApprovedByInput
    >
  }

  export type ListingApprovalScalarWhereInput = {
    AND?: ListingApprovalScalarWhereInput | ListingApprovalScalarWhereInput[]
    OR?: ListingApprovalScalarWhereInput[]
    NOT?: ListingApprovalScalarWhereInput | ListingApprovalScalarWhereInput[]
    id?: StringFilter<'ListingApproval'> | string
    listingId?: StringFilter<'ListingApproval'> | string
    approvedById?: StringFilter<'ListingApproval'> | string
    approvedByRole?: EnumRoleFilter<'ListingApproval'> | $Enums.Role
    approvedAt?: DateTimeFilter<'ListingApproval'> | Date | string
    status?: EnumApprovalStatusFilter<'ListingApproval'> | $Enums.ApprovalStatus
    notes?: StringNullableFilter<'ListingApproval'> | string | null
  }

  export type ListingCreateWithoutDeviceInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    game: GameCreateNestedOneWithoutListingsInput
    emulator: EmulatorCreateNestedOneWithoutListingsInput
    performance: PerformanceScaleCreateNestedOneWithoutListingsInput
    author: UserCreateNestedOneWithoutListingsInput
    votes?: VoteCreateNestedManyWithoutListingInput
    comments?: CommentCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateWithoutDeviceInput = {
    id?: string
    gameId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    authorId: string
    createdAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutListingInput
    comments?: CommentUncheckedCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingCreateOrConnectWithoutDeviceInput = {
    where: ListingWhereUniqueInput
    create: XOR<
      ListingCreateWithoutDeviceInput,
      ListingUncheckedCreateWithoutDeviceInput
    >
  }

  export type ListingCreateManyDeviceInputEnvelope = {
    data: ListingCreateManyDeviceInput | ListingCreateManyDeviceInput[]
    skipDuplicates?: boolean
  }

  export type ListingUpsertWithWhereUniqueWithoutDeviceInput = {
    where: ListingWhereUniqueInput
    update: XOR<
      ListingUpdateWithoutDeviceInput,
      ListingUncheckedUpdateWithoutDeviceInput
    >
    create: XOR<
      ListingCreateWithoutDeviceInput,
      ListingUncheckedCreateWithoutDeviceInput
    >
  }

  export type ListingUpdateWithWhereUniqueWithoutDeviceInput = {
    where: ListingWhereUniqueInput
    data: XOR<
      ListingUpdateWithoutDeviceInput,
      ListingUncheckedUpdateWithoutDeviceInput
    >
  }

  export type ListingUpdateManyWithWhereWithoutDeviceInput = {
    where: ListingScalarWhereInput
    data: XOR<
      ListingUpdateManyMutationInput,
      ListingUncheckedUpdateManyWithoutDeviceInput
    >
  }

  export type GameCreateWithoutSystemInput = {
    id?: string
    title: string
    imageUrl?: string | null
    listings?: ListingCreateNestedManyWithoutGameInput
  }

  export type GameUncheckedCreateWithoutSystemInput = {
    id?: string
    title: string
    imageUrl?: string | null
    listings?: ListingUncheckedCreateNestedManyWithoutGameInput
  }

  export type GameCreateOrConnectWithoutSystemInput = {
    where: GameWhereUniqueInput
    create: XOR<
      GameCreateWithoutSystemInput,
      GameUncheckedCreateWithoutSystemInput
    >
  }

  export type GameCreateManySystemInputEnvelope = {
    data: GameCreateManySystemInput | GameCreateManySystemInput[]
    skipDuplicates?: boolean
  }

  export type GameUpsertWithWhereUniqueWithoutSystemInput = {
    where: GameWhereUniqueInput
    update: XOR<
      GameUpdateWithoutSystemInput,
      GameUncheckedUpdateWithoutSystemInput
    >
    create: XOR<
      GameCreateWithoutSystemInput,
      GameUncheckedCreateWithoutSystemInput
    >
  }

  export type GameUpdateWithWhereUniqueWithoutSystemInput = {
    where: GameWhereUniqueInput
    data: XOR<
      GameUpdateWithoutSystemInput,
      GameUncheckedUpdateWithoutSystemInput
    >
  }

  export type GameUpdateManyWithWhereWithoutSystemInput = {
    where: GameScalarWhereInput
    data: XOR<
      GameUpdateManyMutationInput,
      GameUncheckedUpdateManyWithoutSystemInput
    >
  }

  export type GameScalarWhereInput = {
    AND?: GameScalarWhereInput | GameScalarWhereInput[]
    OR?: GameScalarWhereInput[]
    NOT?: GameScalarWhereInput | GameScalarWhereInput[]
    id?: StringFilter<'Game'> | string
    title?: StringFilter<'Game'> | string
    systemId?: StringFilter<'Game'> | string
    imageUrl?: StringNullableFilter<'Game'> | string | null
  }

  export type SystemCreateWithoutGamesInput = {
    id?: string
    name: string
  }

  export type SystemUncheckedCreateWithoutGamesInput = {
    id?: string
    name: string
  }

  export type SystemCreateOrConnectWithoutGamesInput = {
    where: SystemWhereUniqueInput
    create: XOR<
      SystemCreateWithoutGamesInput,
      SystemUncheckedCreateWithoutGamesInput
    >
  }

  export type ListingCreateWithoutGameInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    device: DeviceCreateNestedOneWithoutListingsInput
    emulator: EmulatorCreateNestedOneWithoutListingsInput
    performance: PerformanceScaleCreateNestedOneWithoutListingsInput
    author: UserCreateNestedOneWithoutListingsInput
    votes?: VoteCreateNestedManyWithoutListingInput
    comments?: CommentCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateWithoutGameInput = {
    id?: string
    deviceId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    authorId: string
    createdAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutListingInput
    comments?: CommentUncheckedCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingCreateOrConnectWithoutGameInput = {
    where: ListingWhereUniqueInput
    create: XOR<
      ListingCreateWithoutGameInput,
      ListingUncheckedCreateWithoutGameInput
    >
  }

  export type ListingCreateManyGameInputEnvelope = {
    data: ListingCreateManyGameInput | ListingCreateManyGameInput[]
    skipDuplicates?: boolean
  }

  export type SystemUpsertWithoutGamesInput = {
    update: XOR<
      SystemUpdateWithoutGamesInput,
      SystemUncheckedUpdateWithoutGamesInput
    >
    create: XOR<
      SystemCreateWithoutGamesInput,
      SystemUncheckedCreateWithoutGamesInput
    >
    where?: SystemWhereInput
  }

  export type SystemUpdateToOneWithWhereWithoutGamesInput = {
    where?: SystemWhereInput
    data: XOR<
      SystemUpdateWithoutGamesInput,
      SystemUncheckedUpdateWithoutGamesInput
    >
  }

  export type SystemUpdateWithoutGamesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type SystemUncheckedUpdateWithoutGamesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type ListingUpsertWithWhereUniqueWithoutGameInput = {
    where: ListingWhereUniqueInput
    update: XOR<
      ListingUpdateWithoutGameInput,
      ListingUncheckedUpdateWithoutGameInput
    >
    create: XOR<
      ListingCreateWithoutGameInput,
      ListingUncheckedCreateWithoutGameInput
    >
  }

  export type ListingUpdateWithWhereUniqueWithoutGameInput = {
    where: ListingWhereUniqueInput
    data: XOR<
      ListingUpdateWithoutGameInput,
      ListingUncheckedUpdateWithoutGameInput
    >
  }

  export type ListingUpdateManyWithWhereWithoutGameInput = {
    where: ListingScalarWhereInput
    data: XOR<
      ListingUpdateManyMutationInput,
      ListingUncheckedUpdateManyWithoutGameInput
    >
  }

  export type ListingCreateWithoutEmulatorInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    device: DeviceCreateNestedOneWithoutListingsInput
    game: GameCreateNestedOneWithoutListingsInput
    performance: PerformanceScaleCreateNestedOneWithoutListingsInput
    author: UserCreateNestedOneWithoutListingsInput
    votes?: VoteCreateNestedManyWithoutListingInput
    comments?: CommentCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateWithoutEmulatorInput = {
    id?: string
    deviceId: string
    gameId: string
    performanceId: number
    notes?: string | null
    authorId: string
    createdAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutListingInput
    comments?: CommentUncheckedCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingCreateOrConnectWithoutEmulatorInput = {
    where: ListingWhereUniqueInput
    create: XOR<
      ListingCreateWithoutEmulatorInput,
      ListingUncheckedCreateWithoutEmulatorInput
    >
  }

  export type ListingCreateManyEmulatorInputEnvelope = {
    data: ListingCreateManyEmulatorInput | ListingCreateManyEmulatorInput[]
    skipDuplicates?: boolean
  }

  export type ListingUpsertWithWhereUniqueWithoutEmulatorInput = {
    where: ListingWhereUniqueInput
    update: XOR<
      ListingUpdateWithoutEmulatorInput,
      ListingUncheckedUpdateWithoutEmulatorInput
    >
    create: XOR<
      ListingCreateWithoutEmulatorInput,
      ListingUncheckedCreateWithoutEmulatorInput
    >
  }

  export type ListingUpdateWithWhereUniqueWithoutEmulatorInput = {
    where: ListingWhereUniqueInput
    data: XOR<
      ListingUpdateWithoutEmulatorInput,
      ListingUncheckedUpdateWithoutEmulatorInput
    >
  }

  export type ListingUpdateManyWithWhereWithoutEmulatorInput = {
    where: ListingScalarWhereInput
    data: XOR<
      ListingUpdateManyMutationInput,
      ListingUncheckedUpdateManyWithoutEmulatorInput
    >
  }

  export type ListingCreateWithoutPerformanceInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    device: DeviceCreateNestedOneWithoutListingsInput
    game: GameCreateNestedOneWithoutListingsInput
    emulator: EmulatorCreateNestedOneWithoutListingsInput
    author: UserCreateNestedOneWithoutListingsInput
    votes?: VoteCreateNestedManyWithoutListingInput
    comments?: CommentCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateWithoutPerformanceInput = {
    id?: string
    deviceId: string
    gameId: string
    emulatorId: string
    notes?: string | null
    authorId: string
    createdAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutListingInput
    comments?: CommentUncheckedCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingCreateOrConnectWithoutPerformanceInput = {
    where: ListingWhereUniqueInput
    create: XOR<
      ListingCreateWithoutPerformanceInput,
      ListingUncheckedCreateWithoutPerformanceInput
    >
  }

  export type ListingCreateManyPerformanceInputEnvelope = {
    data:
      | ListingCreateManyPerformanceInput
      | ListingCreateManyPerformanceInput[]
    skipDuplicates?: boolean
  }

  export type ListingUpsertWithWhereUniqueWithoutPerformanceInput = {
    where: ListingWhereUniqueInput
    update: XOR<
      ListingUpdateWithoutPerformanceInput,
      ListingUncheckedUpdateWithoutPerformanceInput
    >
    create: XOR<
      ListingCreateWithoutPerformanceInput,
      ListingUncheckedCreateWithoutPerformanceInput
    >
  }

  export type ListingUpdateWithWhereUniqueWithoutPerformanceInput = {
    where: ListingWhereUniqueInput
    data: XOR<
      ListingUpdateWithoutPerformanceInput,
      ListingUncheckedUpdateWithoutPerformanceInput
    >
  }

  export type ListingUpdateManyWithWhereWithoutPerformanceInput = {
    where: ListingScalarWhereInput
    data: XOR<
      ListingUpdateManyMutationInput,
      ListingUncheckedUpdateManyWithoutPerformanceInput
    >
  }

  export type DeviceCreateWithoutListingsInput = {
    id?: string
    brand: string
    modelName: string
  }

  export type DeviceUncheckedCreateWithoutListingsInput = {
    id?: string
    brand: string
    modelName: string
  }

  export type DeviceCreateOrConnectWithoutListingsInput = {
    where: DeviceWhereUniqueInput
    create: XOR<
      DeviceCreateWithoutListingsInput,
      DeviceUncheckedCreateWithoutListingsInput
    >
  }

  export type GameCreateWithoutListingsInput = {
    id?: string
    title: string
    imageUrl?: string | null
    system: SystemCreateNestedOneWithoutGamesInput
  }

  export type GameUncheckedCreateWithoutListingsInput = {
    id?: string
    title: string
    systemId: string
    imageUrl?: string | null
  }

  export type GameCreateOrConnectWithoutListingsInput = {
    where: GameWhereUniqueInput
    create: XOR<
      GameCreateWithoutListingsInput,
      GameUncheckedCreateWithoutListingsInput
    >
  }

  export type EmulatorCreateWithoutListingsInput = {
    id?: string
    name: string
  }

  export type EmulatorUncheckedCreateWithoutListingsInput = {
    id?: string
    name: string
  }

  export type EmulatorCreateOrConnectWithoutListingsInput = {
    where: EmulatorWhereUniqueInput
    create: XOR<
      EmulatorCreateWithoutListingsInput,
      EmulatorUncheckedCreateWithoutListingsInput
    >
  }

  export type PerformanceScaleCreateWithoutListingsInput = {
    label: string
    rank: number
  }

  export type PerformanceScaleUncheckedCreateWithoutListingsInput = {
    id?: number
    label: string
    rank: number
  }

  export type PerformanceScaleCreateOrConnectWithoutListingsInput = {
    where: PerformanceScaleWhereUniqueInput
    create: XOR<
      PerformanceScaleCreateWithoutListingsInput,
      PerformanceScaleUncheckedCreateWithoutListingsInput
    >
  }

  export type UserCreateWithoutListingsInput = {
    id?: string
    email: string
    hashedPassword: string
    name?: string | null
    profileImage?: string | null
    role?: $Enums.Role
    createdAt?: Date | string
    votes?: VoteCreateNestedManyWithoutUserInput
    comments?: CommentCreateNestedManyWithoutUserInput
    approvalsGiven?: ListingApprovalCreateNestedManyWithoutApprovedByInput
  }

  export type UserUncheckedCreateWithoutListingsInput = {
    id?: string
    email: string
    hashedPassword: string
    name?: string | null
    profileImage?: string | null
    role?: $Enums.Role
    createdAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutUserInput
    comments?: CommentUncheckedCreateNestedManyWithoutUserInput
    approvalsGiven?: ListingApprovalUncheckedCreateNestedManyWithoutApprovedByInput
  }

  export type UserCreateOrConnectWithoutListingsInput = {
    where: UserWhereUniqueInput
    create: XOR<
      UserCreateWithoutListingsInput,
      UserUncheckedCreateWithoutListingsInput
    >
  }

  export type VoteCreateWithoutListingInput = {
    id?: string
    value: boolean
    user: UserCreateNestedOneWithoutVotesInput
  }

  export type VoteUncheckedCreateWithoutListingInput = {
    id?: string
    value: boolean
    userId: string
  }

  export type VoteCreateOrConnectWithoutListingInput = {
    where: VoteWhereUniqueInput
    create: XOR<
      VoteCreateWithoutListingInput,
      VoteUncheckedCreateWithoutListingInput
    >
  }

  export type VoteCreateManyListingInputEnvelope = {
    data: VoteCreateManyListingInput | VoteCreateManyListingInput[]
    skipDuplicates?: boolean
  }

  export type CommentCreateWithoutListingInput = {
    id?: string
    content: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutCommentsInput
    parent?: CommentCreateNestedOneWithoutRepliesInput
    replies?: CommentCreateNestedManyWithoutParentInput
  }

  export type CommentUncheckedCreateWithoutListingInput = {
    id?: string
    content: string
    userId: string
    parentId?: string | null
    createdAt?: Date | string
    replies?: CommentUncheckedCreateNestedManyWithoutParentInput
  }

  export type CommentCreateOrConnectWithoutListingInput = {
    where: CommentWhereUniqueInput
    create: XOR<
      CommentCreateWithoutListingInput,
      CommentUncheckedCreateWithoutListingInput
    >
  }

  export type CommentCreateManyListingInputEnvelope = {
    data: CommentCreateManyListingInput | CommentCreateManyListingInput[]
    skipDuplicates?: boolean
  }

  export type ListingApprovalCreateWithoutListingInput = {
    id?: string
    approvedByRole: $Enums.Role
    approvedAt?: Date | string
    status: $Enums.ApprovalStatus
    notes?: string | null
    approvedBy: UserCreateNestedOneWithoutApprovalsGivenInput
  }

  export type ListingApprovalUncheckedCreateWithoutListingInput = {
    id?: string
    approvedById: string
    approvedByRole: $Enums.Role
    approvedAt?: Date | string
    status: $Enums.ApprovalStatus
    notes?: string | null
  }

  export type ListingApprovalCreateOrConnectWithoutListingInput = {
    where: ListingApprovalWhereUniqueInput
    create: XOR<
      ListingApprovalCreateWithoutListingInput,
      ListingApprovalUncheckedCreateWithoutListingInput
    >
  }

  export type ListingApprovalCreateManyListingInputEnvelope = {
    data:
      | ListingApprovalCreateManyListingInput
      | ListingApprovalCreateManyListingInput[]
    skipDuplicates?: boolean
  }

  export type DeviceUpsertWithoutListingsInput = {
    update: XOR<
      DeviceUpdateWithoutListingsInput,
      DeviceUncheckedUpdateWithoutListingsInput
    >
    create: XOR<
      DeviceCreateWithoutListingsInput,
      DeviceUncheckedCreateWithoutListingsInput
    >
    where?: DeviceWhereInput
  }

  export type DeviceUpdateToOneWithWhereWithoutListingsInput = {
    where?: DeviceWhereInput
    data: XOR<
      DeviceUpdateWithoutListingsInput,
      DeviceUncheckedUpdateWithoutListingsInput
    >
  }

  export type DeviceUpdateWithoutListingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
  }

  export type DeviceUncheckedUpdateWithoutListingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
  }

  export type GameUpsertWithoutListingsInput = {
    update: XOR<
      GameUpdateWithoutListingsInput,
      GameUncheckedUpdateWithoutListingsInput
    >
    create: XOR<
      GameCreateWithoutListingsInput,
      GameUncheckedCreateWithoutListingsInput
    >
    where?: GameWhereInput
  }

  export type GameUpdateToOneWithWhereWithoutListingsInput = {
    where?: GameWhereInput
    data: XOR<
      GameUpdateWithoutListingsInput,
      GameUncheckedUpdateWithoutListingsInput
    >
  }

  export type GameUpdateWithoutListingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    system?: SystemUpdateOneRequiredWithoutGamesNestedInput
  }

  export type GameUncheckedUpdateWithoutListingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    systemId?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EmulatorUpsertWithoutListingsInput = {
    update: XOR<
      EmulatorUpdateWithoutListingsInput,
      EmulatorUncheckedUpdateWithoutListingsInput
    >
    create: XOR<
      EmulatorCreateWithoutListingsInput,
      EmulatorUncheckedCreateWithoutListingsInput
    >
    where?: EmulatorWhereInput
  }

  export type EmulatorUpdateToOneWithWhereWithoutListingsInput = {
    where?: EmulatorWhereInput
    data: XOR<
      EmulatorUpdateWithoutListingsInput,
      EmulatorUncheckedUpdateWithoutListingsInput
    >
  }

  export type EmulatorUpdateWithoutListingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type EmulatorUncheckedUpdateWithoutListingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
  }

  export type PerformanceScaleUpsertWithoutListingsInput = {
    update: XOR<
      PerformanceScaleUpdateWithoutListingsInput,
      PerformanceScaleUncheckedUpdateWithoutListingsInput
    >
    create: XOR<
      PerformanceScaleCreateWithoutListingsInput,
      PerformanceScaleUncheckedCreateWithoutListingsInput
    >
    where?: PerformanceScaleWhereInput
  }

  export type PerformanceScaleUpdateToOneWithWhereWithoutListingsInput = {
    where?: PerformanceScaleWhereInput
    data: XOR<
      PerformanceScaleUpdateWithoutListingsInput,
      PerformanceScaleUncheckedUpdateWithoutListingsInput
    >
  }

  export type PerformanceScaleUpdateWithoutListingsInput = {
    label?: StringFieldUpdateOperationsInput | string
    rank?: IntFieldUpdateOperationsInput | number
  }

  export type PerformanceScaleUncheckedUpdateWithoutListingsInput = {
    id?: IntFieldUpdateOperationsInput | number
    label?: StringFieldUpdateOperationsInput | string
    rank?: IntFieldUpdateOperationsInput | number
  }

  export type UserUpsertWithoutListingsInput = {
    update: XOR<
      UserUpdateWithoutListingsInput,
      UserUncheckedUpdateWithoutListingsInput
    >
    create: XOR<
      UserCreateWithoutListingsInput,
      UserUncheckedCreateWithoutListingsInput
    >
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutListingsInput = {
    where?: UserWhereInput
    data: XOR<
      UserUpdateWithoutListingsInput,
      UserUncheckedUpdateWithoutListingsInput
    >
  }

  export type UserUpdateWithoutListingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUpdateManyWithoutUserNestedInput
    comments?: CommentUpdateManyWithoutUserNestedInput
    approvalsGiven?: ListingApprovalUpdateManyWithoutApprovedByNestedInput
  }

  export type UserUncheckedUpdateWithoutListingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutUserNestedInput
    comments?: CommentUncheckedUpdateManyWithoutUserNestedInput
    approvalsGiven?: ListingApprovalUncheckedUpdateManyWithoutApprovedByNestedInput
  }

  export type VoteUpsertWithWhereUniqueWithoutListingInput = {
    where: VoteWhereUniqueInput
    update: XOR<
      VoteUpdateWithoutListingInput,
      VoteUncheckedUpdateWithoutListingInput
    >
    create: XOR<
      VoteCreateWithoutListingInput,
      VoteUncheckedCreateWithoutListingInput
    >
  }

  export type VoteUpdateWithWhereUniqueWithoutListingInput = {
    where: VoteWhereUniqueInput
    data: XOR<
      VoteUpdateWithoutListingInput,
      VoteUncheckedUpdateWithoutListingInput
    >
  }

  export type VoteUpdateManyWithWhereWithoutListingInput = {
    where: VoteScalarWhereInput
    data: XOR<
      VoteUpdateManyMutationInput,
      VoteUncheckedUpdateManyWithoutListingInput
    >
  }

  export type CommentUpsertWithWhereUniqueWithoutListingInput = {
    where: CommentWhereUniqueInput
    update: XOR<
      CommentUpdateWithoutListingInput,
      CommentUncheckedUpdateWithoutListingInput
    >
    create: XOR<
      CommentCreateWithoutListingInput,
      CommentUncheckedCreateWithoutListingInput
    >
  }

  export type CommentUpdateWithWhereUniqueWithoutListingInput = {
    where: CommentWhereUniqueInput
    data: XOR<
      CommentUpdateWithoutListingInput,
      CommentUncheckedUpdateWithoutListingInput
    >
  }

  export type CommentUpdateManyWithWhereWithoutListingInput = {
    where: CommentScalarWhereInput
    data: XOR<
      CommentUpdateManyMutationInput,
      CommentUncheckedUpdateManyWithoutListingInput
    >
  }

  export type ListingApprovalUpsertWithWhereUniqueWithoutListingInput = {
    where: ListingApprovalWhereUniqueInput
    update: XOR<
      ListingApprovalUpdateWithoutListingInput,
      ListingApprovalUncheckedUpdateWithoutListingInput
    >
    create: XOR<
      ListingApprovalCreateWithoutListingInput,
      ListingApprovalUncheckedCreateWithoutListingInput
    >
  }

  export type ListingApprovalUpdateWithWhereUniqueWithoutListingInput = {
    where: ListingApprovalWhereUniqueInput
    data: XOR<
      ListingApprovalUpdateWithoutListingInput,
      ListingApprovalUncheckedUpdateWithoutListingInput
    >
  }

  export type ListingApprovalUpdateManyWithWhereWithoutListingInput = {
    where: ListingApprovalScalarWhereInput
    data: XOR<
      ListingApprovalUpdateManyMutationInput,
      ListingApprovalUncheckedUpdateManyWithoutListingInput
    >
  }

  export type UserCreateWithoutVotesInput = {
    id?: string
    email: string
    hashedPassword: string
    name?: string | null
    profileImage?: string | null
    role?: $Enums.Role
    createdAt?: Date | string
    listings?: ListingCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutUserInput
    approvalsGiven?: ListingApprovalCreateNestedManyWithoutApprovedByInput
  }

  export type UserUncheckedCreateWithoutVotesInput = {
    id?: string
    email: string
    hashedPassword: string
    name?: string | null
    profileImage?: string | null
    role?: $Enums.Role
    createdAt?: Date | string
    listings?: ListingUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutUserInput
    approvalsGiven?: ListingApprovalUncheckedCreateNestedManyWithoutApprovedByInput
  }

  export type UserCreateOrConnectWithoutVotesInput = {
    where: UserWhereUniqueInput
    create: XOR<
      UserCreateWithoutVotesInput,
      UserUncheckedCreateWithoutVotesInput
    >
  }

  export type ListingCreateWithoutVotesInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    device: DeviceCreateNestedOneWithoutListingsInput
    game: GameCreateNestedOneWithoutListingsInput
    emulator: EmulatorCreateNestedOneWithoutListingsInput
    performance: PerformanceScaleCreateNestedOneWithoutListingsInput
    author: UserCreateNestedOneWithoutListingsInput
    comments?: CommentCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateWithoutVotesInput = {
    id?: string
    deviceId: string
    gameId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    authorId: string
    createdAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingCreateOrConnectWithoutVotesInput = {
    where: ListingWhereUniqueInput
    create: XOR<
      ListingCreateWithoutVotesInput,
      ListingUncheckedCreateWithoutVotesInput
    >
  }

  export type UserUpsertWithoutVotesInput = {
    update: XOR<
      UserUpdateWithoutVotesInput,
      UserUncheckedUpdateWithoutVotesInput
    >
    create: XOR<
      UserCreateWithoutVotesInput,
      UserUncheckedCreateWithoutVotesInput
    >
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutVotesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutVotesInput, UserUncheckedUpdateWithoutVotesInput>
  }

  export type UserUpdateWithoutVotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listings?: ListingUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutUserNestedInput
    approvalsGiven?: ListingApprovalUpdateManyWithoutApprovedByNestedInput
  }

  export type UserUncheckedUpdateWithoutVotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listings?: ListingUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutUserNestedInput
    approvalsGiven?: ListingApprovalUncheckedUpdateManyWithoutApprovedByNestedInput
  }

  export type ListingUpsertWithoutVotesInput = {
    update: XOR<
      ListingUpdateWithoutVotesInput,
      ListingUncheckedUpdateWithoutVotesInput
    >
    create: XOR<
      ListingCreateWithoutVotesInput,
      ListingUncheckedCreateWithoutVotesInput
    >
    where?: ListingWhereInput
  }

  export type ListingUpdateToOneWithWhereWithoutVotesInput = {
    where?: ListingWhereInput
    data: XOR<
      ListingUpdateWithoutVotesInput,
      ListingUncheckedUpdateWithoutVotesInput
    >
  }

  export type ListingUpdateWithoutVotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    device?: DeviceUpdateOneRequiredWithoutListingsNestedInput
    game?: GameUpdateOneRequiredWithoutListingsNestedInput
    emulator?: EmulatorUpdateOneRequiredWithoutListingsNestedInput
    performance?: PerformanceScaleUpdateOneRequiredWithoutListingsNestedInput
    author?: UserUpdateOneRequiredWithoutListingsNestedInput
    comments?: CommentUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateWithoutVotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUncheckedUpdateManyWithoutListingNestedInput
  }

  export type UserCreateWithoutCommentsInput = {
    id?: string
    email: string
    hashedPassword: string
    name?: string | null
    profileImage?: string | null
    role?: $Enums.Role
    createdAt?: Date | string
    listings?: ListingCreateNestedManyWithoutAuthorInput
    votes?: VoteCreateNestedManyWithoutUserInput
    approvalsGiven?: ListingApprovalCreateNestedManyWithoutApprovedByInput
  }

  export type UserUncheckedCreateWithoutCommentsInput = {
    id?: string
    email: string
    hashedPassword: string
    name?: string | null
    profileImage?: string | null
    role?: $Enums.Role
    createdAt?: Date | string
    listings?: ListingUncheckedCreateNestedManyWithoutAuthorInput
    votes?: VoteUncheckedCreateNestedManyWithoutUserInput
    approvalsGiven?: ListingApprovalUncheckedCreateNestedManyWithoutApprovedByInput
  }

  export type UserCreateOrConnectWithoutCommentsInput = {
    where: UserWhereUniqueInput
    create: XOR<
      UserCreateWithoutCommentsInput,
      UserUncheckedCreateWithoutCommentsInput
    >
  }

  export type ListingCreateWithoutCommentsInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    device: DeviceCreateNestedOneWithoutListingsInput
    game: GameCreateNestedOneWithoutListingsInput
    emulator: EmulatorCreateNestedOneWithoutListingsInput
    performance: PerformanceScaleCreateNestedOneWithoutListingsInput
    author: UserCreateNestedOneWithoutListingsInput
    votes?: VoteCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateWithoutCommentsInput = {
    id?: string
    deviceId: string
    gameId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    authorId: string
    createdAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutListingInput
    approvals?: ListingApprovalUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingCreateOrConnectWithoutCommentsInput = {
    where: ListingWhereUniqueInput
    create: XOR<
      ListingCreateWithoutCommentsInput,
      ListingUncheckedCreateWithoutCommentsInput
    >
  }

  export type CommentCreateWithoutRepliesInput = {
    id?: string
    content: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutCommentsInput
    listing: ListingCreateNestedOneWithoutCommentsInput
    parent?: CommentCreateNestedOneWithoutRepliesInput
  }

  export type CommentUncheckedCreateWithoutRepliesInput = {
    id?: string
    content: string
    userId: string
    listingId: string
    parentId?: string | null
    createdAt?: Date | string
  }

  export type CommentCreateOrConnectWithoutRepliesInput = {
    where: CommentWhereUniqueInput
    create: XOR<
      CommentCreateWithoutRepliesInput,
      CommentUncheckedCreateWithoutRepliesInput
    >
  }

  export type CommentCreateWithoutParentInput = {
    id?: string
    content: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutCommentsInput
    listing: ListingCreateNestedOneWithoutCommentsInput
    replies?: CommentCreateNestedManyWithoutParentInput
  }

  export type CommentUncheckedCreateWithoutParentInput = {
    id?: string
    content: string
    userId: string
    listingId: string
    createdAt?: Date | string
    replies?: CommentUncheckedCreateNestedManyWithoutParentInput
  }

  export type CommentCreateOrConnectWithoutParentInput = {
    where: CommentWhereUniqueInput
    create: XOR<
      CommentCreateWithoutParentInput,
      CommentUncheckedCreateWithoutParentInput
    >
  }

  export type CommentCreateManyParentInputEnvelope = {
    data: CommentCreateManyParentInput | CommentCreateManyParentInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutCommentsInput = {
    update: XOR<
      UserUpdateWithoutCommentsInput,
      UserUncheckedUpdateWithoutCommentsInput
    >
    create: XOR<
      UserCreateWithoutCommentsInput,
      UserUncheckedCreateWithoutCommentsInput
    >
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCommentsInput = {
    where?: UserWhereInput
    data: XOR<
      UserUpdateWithoutCommentsInput,
      UserUncheckedUpdateWithoutCommentsInput
    >
  }

  export type UserUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listings?: ListingUpdateManyWithoutAuthorNestedInput
    votes?: VoteUpdateManyWithoutUserNestedInput
    approvalsGiven?: ListingApprovalUpdateManyWithoutApprovedByNestedInput
  }

  export type UserUncheckedUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listings?: ListingUncheckedUpdateManyWithoutAuthorNestedInput
    votes?: VoteUncheckedUpdateManyWithoutUserNestedInput
    approvalsGiven?: ListingApprovalUncheckedUpdateManyWithoutApprovedByNestedInput
  }

  export type ListingUpsertWithoutCommentsInput = {
    update: XOR<
      ListingUpdateWithoutCommentsInput,
      ListingUncheckedUpdateWithoutCommentsInput
    >
    create: XOR<
      ListingCreateWithoutCommentsInput,
      ListingUncheckedCreateWithoutCommentsInput
    >
    where?: ListingWhereInput
  }

  export type ListingUpdateToOneWithWhereWithoutCommentsInput = {
    where?: ListingWhereInput
    data: XOR<
      ListingUpdateWithoutCommentsInput,
      ListingUncheckedUpdateWithoutCommentsInput
    >
  }

  export type ListingUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    device?: DeviceUpdateOneRequiredWithoutListingsNestedInput
    game?: GameUpdateOneRequiredWithoutListingsNestedInput
    emulator?: EmulatorUpdateOneRequiredWithoutListingsNestedInput
    performance?: PerformanceScaleUpdateOneRequiredWithoutListingsNestedInput
    author?: UserUpdateOneRequiredWithoutListingsNestedInput
    votes?: VoteUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUncheckedUpdateManyWithoutListingNestedInput
  }

  export type CommentUpsertWithoutRepliesInput = {
    update: XOR<
      CommentUpdateWithoutRepliesInput,
      CommentUncheckedUpdateWithoutRepliesInput
    >
    create: XOR<
      CommentCreateWithoutRepliesInput,
      CommentUncheckedCreateWithoutRepliesInput
    >
    where?: CommentWhereInput
  }

  export type CommentUpdateToOneWithWhereWithoutRepliesInput = {
    where?: CommentWhereInput
    data: XOR<
      CommentUpdateWithoutRepliesInput,
      CommentUncheckedUpdateWithoutRepliesInput
    >
  }

  export type CommentUpdateWithoutRepliesInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCommentsNestedInput
    listing?: ListingUpdateOneRequiredWithoutCommentsNestedInput
    parent?: CommentUpdateOneWithoutRepliesNestedInput
  }

  export type CommentUncheckedUpdateWithoutRepliesInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUpsertWithWhereUniqueWithoutParentInput = {
    where: CommentWhereUniqueInput
    update: XOR<
      CommentUpdateWithoutParentInput,
      CommentUncheckedUpdateWithoutParentInput
    >
    create: XOR<
      CommentCreateWithoutParentInput,
      CommentUncheckedCreateWithoutParentInput
    >
  }

  export type CommentUpdateWithWhereUniqueWithoutParentInput = {
    where: CommentWhereUniqueInput
    data: XOR<
      CommentUpdateWithoutParentInput,
      CommentUncheckedUpdateWithoutParentInput
    >
  }

  export type CommentUpdateManyWithWhereWithoutParentInput = {
    where: CommentScalarWhereInput
    data: XOR<
      CommentUpdateManyMutationInput,
      CommentUncheckedUpdateManyWithoutParentInput
    >
  }

  export type ListingCreateWithoutApprovalsInput = {
    id?: string
    notes?: string | null
    createdAt?: Date | string
    device: DeviceCreateNestedOneWithoutListingsInput
    game: GameCreateNestedOneWithoutListingsInput
    emulator: EmulatorCreateNestedOneWithoutListingsInput
    performance: PerformanceScaleCreateNestedOneWithoutListingsInput
    author: UserCreateNestedOneWithoutListingsInput
    votes?: VoteCreateNestedManyWithoutListingInput
    comments?: CommentCreateNestedManyWithoutListingInput
  }

  export type ListingUncheckedCreateWithoutApprovalsInput = {
    id?: string
    deviceId: string
    gameId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    authorId: string
    createdAt?: Date | string
    votes?: VoteUncheckedCreateNestedManyWithoutListingInput
    comments?: CommentUncheckedCreateNestedManyWithoutListingInput
  }

  export type ListingCreateOrConnectWithoutApprovalsInput = {
    where: ListingWhereUniqueInput
    create: XOR<
      ListingCreateWithoutApprovalsInput,
      ListingUncheckedCreateWithoutApprovalsInput
    >
  }

  export type UserCreateWithoutApprovalsGivenInput = {
    id?: string
    email: string
    hashedPassword: string
    name?: string | null
    profileImage?: string | null
    role?: $Enums.Role
    createdAt?: Date | string
    listings?: ListingCreateNestedManyWithoutAuthorInput
    votes?: VoteCreateNestedManyWithoutUserInput
    comments?: CommentCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutApprovalsGivenInput = {
    id?: string
    email: string
    hashedPassword: string
    name?: string | null
    profileImage?: string | null
    role?: $Enums.Role
    createdAt?: Date | string
    listings?: ListingUncheckedCreateNestedManyWithoutAuthorInput
    votes?: VoteUncheckedCreateNestedManyWithoutUserInput
    comments?: CommentUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutApprovalsGivenInput = {
    where: UserWhereUniqueInput
    create: XOR<
      UserCreateWithoutApprovalsGivenInput,
      UserUncheckedCreateWithoutApprovalsGivenInput
    >
  }

  export type ListingUpsertWithoutApprovalsInput = {
    update: XOR<
      ListingUpdateWithoutApprovalsInput,
      ListingUncheckedUpdateWithoutApprovalsInput
    >
    create: XOR<
      ListingCreateWithoutApprovalsInput,
      ListingUncheckedCreateWithoutApprovalsInput
    >
    where?: ListingWhereInput
  }

  export type ListingUpdateToOneWithWhereWithoutApprovalsInput = {
    where?: ListingWhereInput
    data: XOR<
      ListingUpdateWithoutApprovalsInput,
      ListingUncheckedUpdateWithoutApprovalsInput
    >
  }

  export type ListingUpdateWithoutApprovalsInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    device?: DeviceUpdateOneRequiredWithoutListingsNestedInput
    game?: GameUpdateOneRequiredWithoutListingsNestedInput
    emulator?: EmulatorUpdateOneRequiredWithoutListingsNestedInput
    performance?: PerformanceScaleUpdateOneRequiredWithoutListingsNestedInput
    author?: UserUpdateOneRequiredWithoutListingsNestedInput
    votes?: VoteUpdateManyWithoutListingNestedInput
    comments?: CommentUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateWithoutApprovalsInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutListingNestedInput
    comments?: CommentUncheckedUpdateManyWithoutListingNestedInput
  }

  export type UserUpsertWithoutApprovalsGivenInput = {
    update: XOR<
      UserUpdateWithoutApprovalsGivenInput,
      UserUncheckedUpdateWithoutApprovalsGivenInput
    >
    create: XOR<
      UserCreateWithoutApprovalsGivenInput,
      UserUncheckedCreateWithoutApprovalsGivenInput
    >
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutApprovalsGivenInput = {
    where?: UserWhereInput
    data: XOR<
      UserUpdateWithoutApprovalsGivenInput,
      UserUncheckedUpdateWithoutApprovalsGivenInput
    >
  }

  export type UserUpdateWithoutApprovalsGivenInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listings?: ListingUpdateManyWithoutAuthorNestedInput
    votes?: VoteUpdateManyWithoutUserNestedInput
    comments?: CommentUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutApprovalsGivenInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    hashedPassword?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    profileImage?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listings?: ListingUncheckedUpdateManyWithoutAuthorNestedInput
    votes?: VoteUncheckedUpdateManyWithoutUserNestedInput
    comments?: CommentUncheckedUpdateManyWithoutUserNestedInput
  }

  export type ListingCreateManyAuthorInput = {
    id?: string
    deviceId: string
    gameId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    createdAt?: Date | string
  }

  export type VoteCreateManyUserInput = {
    id?: string
    value: boolean
    listingId: string
  }

  export type CommentCreateManyUserInput = {
    id?: string
    content: string
    listingId: string
    parentId?: string | null
    createdAt?: Date | string
  }

  export type ListingApprovalCreateManyApprovedByInput = {
    id?: string
    listingId: string
    approvedByRole: $Enums.Role
    approvedAt?: Date | string
    status: $Enums.ApprovalStatus
    notes?: string | null
  }

  export type ListingUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    device?: DeviceUpdateOneRequiredWithoutListingsNestedInput
    game?: GameUpdateOneRequiredWithoutListingsNestedInput
    emulator?: EmulatorUpdateOneRequiredWithoutListingsNestedInput
    performance?: PerformanceScaleUpdateOneRequiredWithoutListingsNestedInput
    votes?: VoteUpdateManyWithoutListingNestedInput
    comments?: CommentUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutListingNestedInput
    comments?: CommentUncheckedUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUncheckedUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateManyWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: BoolFieldUpdateOperationsInput | boolean
    listing?: ListingUpdateOneRequiredWithoutVotesNestedInput
  }

  export type VoteUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: BoolFieldUpdateOperationsInput | boolean
    listingId?: StringFieldUpdateOperationsInput | string
  }

  export type VoteUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: BoolFieldUpdateOperationsInput | boolean
    listingId?: StringFieldUpdateOperationsInput | string
  }

  export type CommentUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    listing?: ListingUpdateOneRequiredWithoutCommentsNestedInput
    parent?: CommentUpdateOneWithoutRepliesNestedInput
    replies?: CommentUpdateManyWithoutParentNestedInput
  }

  export type CommentUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: CommentUncheckedUpdateManyWithoutParentNestedInput
  }

  export type CommentUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingApprovalUpdateWithoutApprovedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    approvedByRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    approvedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?:
      | EnumApprovalStatusFieldUpdateOperationsInput
      | $Enums.ApprovalStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    listing?: ListingUpdateOneRequiredWithoutApprovalsNestedInput
  }

  export type ListingApprovalUncheckedUpdateWithoutApprovedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    approvedByRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    approvedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?:
      | EnumApprovalStatusFieldUpdateOperationsInput
      | $Enums.ApprovalStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ListingApprovalUncheckedUpdateManyWithoutApprovedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    approvedByRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    approvedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?:
      | EnumApprovalStatusFieldUpdateOperationsInput
      | $Enums.ApprovalStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ListingCreateManyDeviceInput = {
    id?: string
    gameId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    authorId: string
    createdAt?: Date | string
  }

  export type ListingUpdateWithoutDeviceInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    game?: GameUpdateOneRequiredWithoutListingsNestedInput
    emulator?: EmulatorUpdateOneRequiredWithoutListingsNestedInput
    performance?: PerformanceScaleUpdateOneRequiredWithoutListingsNestedInput
    author?: UserUpdateOneRequiredWithoutListingsNestedInput
    votes?: VoteUpdateManyWithoutListingNestedInput
    comments?: CommentUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateWithoutDeviceInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutListingNestedInput
    comments?: CommentUncheckedUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUncheckedUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateManyWithoutDeviceInput = {
    id?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GameCreateManySystemInput = {
    id?: string
    title: string
    imageUrl?: string | null
  }

  export type GameUpdateWithoutSystemInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listings?: ListingUpdateManyWithoutGameNestedInput
  }

  export type GameUncheckedUpdateWithoutSystemInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    listings?: ListingUncheckedUpdateManyWithoutGameNestedInput
  }

  export type GameUncheckedUpdateManyWithoutSystemInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ListingCreateManyGameInput = {
    id?: string
    deviceId: string
    emulatorId: string
    performanceId: number
    notes?: string | null
    authorId: string
    createdAt?: Date | string
  }

  export type ListingUpdateWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    device?: DeviceUpdateOneRequiredWithoutListingsNestedInput
    emulator?: EmulatorUpdateOneRequiredWithoutListingsNestedInput
    performance?: PerformanceScaleUpdateOneRequiredWithoutListingsNestedInput
    author?: UserUpdateOneRequiredWithoutListingsNestedInput
    votes?: VoteUpdateManyWithoutListingNestedInput
    comments?: CommentUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutListingNestedInput
    comments?: CommentUncheckedUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUncheckedUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateManyWithoutGameInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingCreateManyEmulatorInput = {
    id?: string
    deviceId: string
    gameId: string
    performanceId: number
    notes?: string | null
    authorId: string
    createdAt?: Date | string
  }

  export type ListingUpdateWithoutEmulatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    device?: DeviceUpdateOneRequiredWithoutListingsNestedInput
    game?: GameUpdateOneRequiredWithoutListingsNestedInput
    performance?: PerformanceScaleUpdateOneRequiredWithoutListingsNestedInput
    author?: UserUpdateOneRequiredWithoutListingsNestedInput
    votes?: VoteUpdateManyWithoutListingNestedInput
    comments?: CommentUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateWithoutEmulatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutListingNestedInput
    comments?: CommentUncheckedUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUncheckedUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateManyWithoutEmulatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    performanceId?: IntFieldUpdateOperationsInput | number
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingCreateManyPerformanceInput = {
    id?: string
    deviceId: string
    gameId: string
    emulatorId: string
    notes?: string | null
    authorId: string
    createdAt?: Date | string
  }

  export type ListingUpdateWithoutPerformanceInput = {
    id?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    device?: DeviceUpdateOneRequiredWithoutListingsNestedInput
    game?: GameUpdateOneRequiredWithoutListingsNestedInput
    emulator?: EmulatorUpdateOneRequiredWithoutListingsNestedInput
    author?: UserUpdateOneRequiredWithoutListingsNestedInput
    votes?: VoteUpdateManyWithoutListingNestedInput
    comments?: CommentUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateWithoutPerformanceInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    votes?: VoteUncheckedUpdateManyWithoutListingNestedInput
    comments?: CommentUncheckedUpdateManyWithoutListingNestedInput
    approvals?: ListingApprovalUncheckedUpdateManyWithoutListingNestedInput
  }

  export type ListingUncheckedUpdateManyWithoutPerformanceInput = {
    id?: StringFieldUpdateOperationsInput | string
    deviceId?: StringFieldUpdateOperationsInput | string
    gameId?: StringFieldUpdateOperationsInput | string
    emulatorId?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VoteCreateManyListingInput = {
    id?: string
    value: boolean
    userId: string
  }

  export type CommentCreateManyListingInput = {
    id?: string
    content: string
    userId: string
    parentId?: string | null
    createdAt?: Date | string
  }

  export type ListingApprovalCreateManyListingInput = {
    id?: string
    approvedById: string
    approvedByRole: $Enums.Role
    approvedAt?: Date | string
    status: $Enums.ApprovalStatus
    notes?: string | null
  }

  export type VoteUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: BoolFieldUpdateOperationsInput | boolean
    user?: UserUpdateOneRequiredWithoutVotesNestedInput
  }

  export type VoteUncheckedUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type VoteUncheckedUpdateManyWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    value?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type CommentUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCommentsNestedInput
    parent?: CommentUpdateOneWithoutRepliesNestedInput
    replies?: CommentUpdateManyWithoutParentNestedInput
  }

  export type CommentUncheckedUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: CommentUncheckedUpdateManyWithoutParentNestedInput
  }

  export type CommentUncheckedUpdateManyWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ListingApprovalUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    approvedByRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    approvedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?:
      | EnumApprovalStatusFieldUpdateOperationsInput
      | $Enums.ApprovalStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    approvedBy?: UserUpdateOneRequiredWithoutApprovalsGivenNestedInput
  }

  export type ListingApprovalUncheckedUpdateWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    approvedById?: StringFieldUpdateOperationsInput | string
    approvedByRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    approvedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?:
      | EnumApprovalStatusFieldUpdateOperationsInput
      | $Enums.ApprovalStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ListingApprovalUncheckedUpdateManyWithoutListingInput = {
    id?: StringFieldUpdateOperationsInput | string
    approvedById?: StringFieldUpdateOperationsInput | string
    approvedByRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    approvedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?:
      | EnumApprovalStatusFieldUpdateOperationsInput
      | $Enums.ApprovalStatus
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CommentCreateManyParentInput = {
    id?: string
    content: string
    userId: string
    listingId: string
    createdAt?: Date | string
  }

  export type CommentUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCommentsNestedInput
    listing?: ListingUpdateOneRequiredWithoutCommentsNestedInput
    replies?: CommentUpdateManyWithoutParentNestedInput
  }

  export type CommentUncheckedUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: CommentUncheckedUpdateManyWithoutParentNestedInput
  }

  export type CommentUncheckedUpdateManyWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    listingId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
