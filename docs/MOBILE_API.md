# EmuReady Mobile API

*Auto-generated on: 2025-07-11T16:03:58.590Z*

## Summary
- **Total Endpoints**: 90
- **Public Endpoints**: 51
- **Protected Endpoints**: 39
- **OpenAPI Version**: 3.0.0

## Base URL
`/api/mobile/trpc`

## Authentication
Protected endpoints require Bearer token authentication using Clerk JWT.

## Interactive Documentation
- **Swagger UI**: [/docs/api/swagger](/docs/api/swagger)
- **OpenAPI JSON**: [/api-docs/mobile-openapi.json](/api-docs/mobile-openapi.json)

## Endpoints

### Public Endpoints (No Authentication Required)


#### 1. **signIn**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.signIn`
- **Description**: Sign in with email and password
- **Tags**: auth

- **Request Body**: JSON object required

#### 2. **signUp**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.signUp`
- **Description**: Sign up with email and password
- **Tags**: auth

- **Request Body**: JSON object required

#### 3. **oauthSignIn**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.oauthSignIn`
- **Description**: OAuth sign-in (Google, Apple, etc.)
- **Tags**: auth

- **Request Body**: JSON object required

#### 4. **validateToken**
- **Method**: GET
- **Path**: `/api/mobile/trpc/auth.validateToken`
- **Description**: Validate JWT token
- **Tags**: auth
- **Parameters**:
  - `token` (string, required): token parameter


#### 5. **refreshToken**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.refreshToken`
- **Description**: Refresh token
- **Tags**: auth

- **Request Body**: JSON object required

#### 6. **verifyEmail**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.verifyEmail`
- **Description**: Verify email with code
- **Tags**: auth

- **Request Body**: JSON object required

#### 7. **forgotPassword**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.forgotPassword`
- **Description**: Forgot password
- **Tags**: auth

- **Request Body**: JSON object required

#### 8. **resetPassword**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.resetPassword`
- **Description**: Reset password with code
- **Tags**: auth

- **Request Body**: JSON object required

#### 9. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/cpus.get`
- **Description**: Get CPUs with search, filtering, and pagination
- **Tags**: cpus
- **Parameters**:
  - `search` (string): search parameter
  - `brandId` (string): brandId parameter
  - `limit` (number): limit parameter


#### 10. **getById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/cpus.getById`
- **Description**: Get CPU by ID
- **Tags**: cpus



#### 11. **getByEmulator**
- **Method**: GET
- **Path**: `/api/mobile/trpc/customFieldDefinitions.getByEmulator`
- **Description**: Get custom field definitions by emulator (for mobile listing creation)
- **Tags**: customFieldDefinitions



#### 12. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/deviceBrands.get`
- **Description**: Get device brands with search and sorting
- **Tags**: deviceBrands



#### 13. **getById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/deviceBrands.getById`
- **Description**: Get device brand by ID
- **Tags**: deviceBrands



#### 14. **getDevices**
- **Method**: GET
- **Path**: `/api/mobile/trpc/devices.getDevices`
- **Description**: Get devices with search and filtering
- **Tags**: devices
- **Parameters**:
  - `search` (string): search parameter
  - `brandId` (string): brandId parameter
  - `limit` (number): limit parameter


#### 15. **getDeviceBrands**
- **Method**: GET
- **Path**: `/api/mobile/trpc/devices.getDeviceBrands`
- **Description**: Get device brands
- **Tags**: devices



#### 16. **getSocs**
- **Method**: GET
- **Path**: `/api/mobile/trpc/devices.getSocs`
- **Description**: Get SOCs (System on Chips)
- **Tags**: devices



#### 17. **getEmulators**
- **Method**: GET
- **Path**: `/api/mobile/trpc/emulators.getEmulators`
- **Description**: Get emulators with search and filtering
- **Tags**: emulators
- **Parameters**:
  - `systemId` (string): systemId parameter
  - `search` (string): search parameter
  - `limit` (number): limit parameter


#### 18. **getEmulatorById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/emulators.getEmulatorById`
- **Description**: Get emulator by ID
- **Tags**: emulators
- **Parameters**:
  - `id` (string, required): id parameter


#### 19. **getGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.getGames`
- **Description**: Get games with search and filtering
- **Tags**: games
- **Parameters**:
  - `search` (string): search parameter
  - `systemId` (string): systemId parameter
  - `limit` (number): limit parameter


#### 20. **getPopularGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.getPopularGames`
- **Description**: Get popular games
- **Tags**: games



#### 21. **searchGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.searchGames`
- **Description**: Search games
- **Tags**: games
- **Parameters**:
  - `query` (string, required): query parameter


#### 22. **getGameById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.getGameById`
- **Description**: Get game by ID
- **Tags**: games
- **Parameters**:
  - `id` (string, required): id parameter


#### 23. **getAppStats**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.getAppStats`
- **Description**: Get app statistics
- **Tags**: general



#### 24. **getSystems**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.getSystems`
- **Description**: Get all systems
- **Tags**: general



#### 25. **getPerformanceScales**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.getPerformanceScales`
- **Description**: Get performance scales
- **Tags**: general



#### 26. **getSearchSuggestions**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.getSearchSuggestions`
- **Description**: Get search suggestions
- **Tags**: general
- **Parameters**:
  - `query` (string, required): query parameter
  - `limit` (number): limit parameter


#### 27. **getTrustLevels**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.getTrustLevels`
- **Description**: Get trust levels (for mobile trust system integration)
- **Tags**: general



#### 28. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/gpus.get`
- **Description**: Get GPUs with search, filtering, and pagination
- **Tags**: gpus
- **Parameters**:
  - `search` (string): search parameter
  - `brandId` (string): brandId parameter
  - `limit` (number): limit parameter


#### 29. **getById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/gpus.getById`
- **Description**: Get GPU by ID
- **Tags**: gpus



#### 30. **checkUserHasReports**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listingReports.checkUserHasReports`
- **Description**: Check if a user has reports (for showing warnings)
- **Tags**: listingReports



#### 31. **getListings**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getListings`
- **Description**: Get listings with pagination and filtering
- **Tags**: listings
- **Parameters**:
  - `page` (number): page parameter
  - `limit` (number): limit parameter
  - `gameId` (string): gameId parameter
  - `systemId` (string): systemId parameter
  - `deviceId` (string): deviceId parameter
  - `emulatorId` (string): emulatorId parameter
  - `search` (string): search parameter


#### 32. **getFeaturedListings**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getFeaturedListings`
- **Description**: Get featured listings
- **Tags**: listings



#### 33. **getListingsByGame**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getListingsByGame`
- **Description**: Get listings by game
- **Tags**: listings
- **Parameters**:
  - `gameId` (string, required): gameId parameter


#### 34. **getListingById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getListingById`
- **Description**: Get listing by ID
- **Tags**: listings
- **Parameters**:
  - `id` (string, required): id parameter


#### 35. **getListingComments**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getListingComments`
- **Description**: Get listing comments
- **Tags**: listings
- **Parameters**:
  - `listingId` (string, required): listingId parameter


#### 36. **getPcListings**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.getPcListings`
- **Description**: Get PC listings with pagination and filtering
- **Tags**: pcListings
- **Parameters**:
  - `page` (number): page parameter
  - `limit` (number): limit parameter
  - `gameId` (string): gameId parameter
  - `systemId` (string): systemId parameter
  - `cpuId` (string): cpuId parameter
  - `gpuId` (string): gpuId parameter
  - `emulatorId` (string): emulatorId parameter
  - `os` (string): os parameter
  - `search` (string): search parameter


#### 37. **getCpus**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.getCpus`
- **Description**: Get CPUs for mobile
- **Tags**: pcListings
- **Parameters**:
  - `search` (string): search parameter
  - `brandId` (string): brandId parameter
  - `limit` (number): limit parameter


#### 38. **getGpus**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.getGpus`
- **Description**: Get GPUs for mobile
- **Tags**: pcListings
- **Parameters**:
  - `search` (string): search parameter
  - `brandId` (string): brandId parameter
  - `limit` (number): limit parameter


#### 39. **searchGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/rawg.searchGameImages`
- **Description**: Search for game images in RAWG database
- **Tags**: rawg



#### 40. **searchGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/rawg.searchGames`
- **Description**: Search for games in RAWG database
- **Tags**: rawg
- **Parameters**:
  - `query` (string, required): query parameter


#### 41. **getGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/rawg.getGameImages`
- **Description**: Get game images by ID
- **Tags**: rawg



#### 42. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/socs.get`
- **Description**: Get SoCs with search, filtering, and pagination
- **Tags**: socs



#### 43. **getById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/socs.getById`
- **Description**: Get SoC by ID
- **Tags**: socs



#### 44. **searchGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.searchGameImages`
- **Description**: Search for game images in TGDB database
- **Tags**: tgdb



#### 45. **searchGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.searchGames`
- **Description**: Search for games in TGDB database
- **Tags**: tgdb
- **Parameters**:
  - `query` (string, required): query parameter


#### 46. **getGameImageUrls**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.getGameImageUrls`
- **Description**: Get game image URLs for a specific game
- **Tags**: tgdb



#### 47. **getGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.getGameImages`
- **Description**: Get game images by game IDs
- **Tags**: tgdb



#### 48. **getPlatforms**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.getPlatforms`
- **Description**: Get available platforms from TGDB
- **Tags**: tgdb



#### 49. **getUserTrustInfo**
- **Method**: GET
- **Path**: `/api/mobile/trpc/trust.getUserTrustInfo`
- **Description**: Get trust info for a specific user (public)
- **Tags**: trust



#### 50. **getTrustLevels**
- **Method**: GET
- **Path**: `/api/mobile/trpc/trust.getTrustLevels`
- **Description**: Get trust levels configuration
- **Tags**: trust



#### 51. **getUserById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/users.getUserById`
- **Description**: Get user profile by ID (public user profiles)
- **Tags**: users




### Protected Endpoints (Authentication Required)


#### 1. **signOut**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.signOut`
- **Description**: Sign out (invalidate session)
- **Tags**: auth



#### 2. **updateProfile**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.updateProfile`
- **Description**: Update mobile profile
- **Tags**: auth

- **Request Body**: JSON object required

#### 3. **changePassword**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.changePassword`
- **Description**: Change password
- **Tags**: auth

- **Request Body**: JSON object required

#### 4. **deleteAccount**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.deleteAccount`
- **Description**: Delete account
- **Tags**: auth

- **Request Body**: JSON object required

#### 5. **getMyVerifiedEmulators**
- **Method**: GET
- **Path**: `/api/mobile/trpc/developers.getMyVerifiedEmulators`
- **Description**: Get current user's verified emulators
- **Tags**: developers



#### 6. **isVerifiedDeveloper**
- **Method**: GET
- **Path**: `/api/mobile/trpc/developers.isVerifiedDeveloper`
- **Description**: Check if a user is a verified developer for an emulator
- **Tags**: developers
- **Parameters**:
  - `userId` (string, required): userId parameter
  - `emulatorId` (string, required): emulatorId parameter


#### 7. **verifyListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/developers.verifyListing`
- **Description**: Verify a listing as a developer
- **Tags**: developers

- **Request Body**: JSON object required

#### 8. **removeVerification**
- **Method**: POST
- **Path**: `/api/mobile/trpc/developers.removeVerification`
- **Description**: Remove a verification
- **Tags**: developers

- **Request Body**: JSON object required

#### 9. **getListingVerifications**
- **Method**: GET
- **Path**: `/api/mobile/trpc/developers.getListingVerifications`
- **Description**: Get verifications for a listing
- **Tags**: developers
- **Parameters**:
  - `listingId` (string, required): listingId parameter


#### 10. **getMyVerifications**
- **Method**: GET
- **Path**: `/api/mobile/trpc/developers.getMyVerifications`
- **Description**: Get current user's verifications
- **Tags**: developers
- **Parameters**:
  - `limit` (number): limit parameter
  - `page` (number): page parameter


#### 11. **create**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listingReports.create`
- **Description**: Create a new listing report (user-facing)
- **Tags**: listingReports



#### 12. **getUserListings**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getUserListings`
- **Description**: Get user listings
- **Tags**: listings
- **Parameters**:
  - `userId` (string, required): userId parameter


#### 13. **createListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.createListing`
- **Description**: Create a new listing
- **Tags**: listings

- **Request Body**: JSON object required

#### 14. **updateListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.updateListing`
- **Description**: Update a listing
- **Tags**: listings

- **Request Body**: JSON object required

#### 15. **deleteListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.deleteListing`
- **Description**: Delete a listing
- **Tags**: listings

- **Request Body**: JSON object required

#### 16. **voteListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.voteListing`
- **Description**: Vote on a listing
- **Tags**: listings

- **Request Body**: JSON object required

#### 17. **getUserVote**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getUserVote`
- **Description**: Get user's vote on a listing
- **Tags**: listings
- **Parameters**:
  - `listingId` (string, required): listingId parameter


#### 18. **createComment**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.createComment`
- **Description**: Create a comment
- **Tags**: listings

- **Request Body**: JSON object required

#### 19. **updateComment**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.updateComment`
- **Description**: Update a comment
- **Tags**: listings

- **Request Body**: JSON object required

#### 20. **deleteComment**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.deleteComment`
- **Description**: Delete a comment
- **Tags**: listings

- **Request Body**: JSON object required

#### 21. **getNotifications**
- **Method**: GET
- **Path**: `/api/mobile/trpc/notifications.getNotifications`
- **Description**: Get notifications with pagination
- **Tags**: notifications
- **Parameters**:
  - `page` (number): page parameter
  - `limit` (number): limit parameter
  - `unreadOnly` (boolean): unreadOnly parameter


#### 22. **getUnreadNotificationCount**
- **Method**: GET
- **Path**: `/api/mobile/trpc/notifications.getUnreadNotificationCount`
- **Description**: Get unread notification count
- **Tags**: notifications



#### 23. **markNotificationAsRead**
- **Method**: POST
- **Path**: `/api/mobile/trpc/notifications.markNotificationAsRead`
- **Description**: Mark notification as read
- **Tags**: notifications

- **Request Body**: JSON object required

#### 24. **markAllNotificationsAsRead**
- **Method**: POST
- **Path**: `/api/mobile/trpc/notifications.markAllNotificationsAsRead`
- **Description**: Mark all notifications as read
- **Tags**: notifications



#### 25. **createPcListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.createPcListing`
- **Description**: Create a new PC listing
- **Tags**: pcListings

- **Request Body**: JSON object required

#### 26. **updatePcListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.updatePcListing`
- **Description**: Update a PC listing
- **Tags**: pcListings

- **Request Body**: JSON object required

#### 27. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.get`
- **Description**: PC Presets nested router
- **Tags**: pcListings
- **Parameters**:
  - `limit` (number): limit parameter


#### 28. **create**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.create`
- **Description**: PC Presets nested router
- **Tags**: pcListings

- **Request Body**: JSON object required

#### 29. **update**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.update`
- **Description**: PC Presets nested router
- **Tags**: pcListings

- **Request Body**: JSON object required

#### 30. **delete**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.delete`
- **Description**: PC Presets nested router
- **Tags**: pcListings

- **Request Body**: JSON object required

#### 31. **getUserPreferences**
- **Method**: GET
- **Path**: `/api/mobile/trpc/preferences.getUserPreferences`
- **Description**: Get user preferences
- **Tags**: preferences



#### 32. **updateUserPreferences**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.updateUserPreferences`
- **Description**: Update user preferences
- **Tags**: preferences

- **Request Body**: JSON object required

#### 33. **addDevicePreference**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.addDevicePreference`
- **Description**: Add device preference
- **Tags**: preferences

- **Request Body**: JSON object required

#### 34. **removeDevicePreference**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.removeDevicePreference`
- **Description**: Remove device preference
- **Tags**: preferences

- **Request Body**: JSON object required

#### 35. **bulkUpdateDevicePreferences**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.bulkUpdateDevicePreferences`
- **Description**: Bulk update device preferences
- **Tags**: preferences

- **Request Body**: JSON object required

#### 36. **bulkUpdateSocPreferences**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.bulkUpdateSocPreferences`
- **Description**: Bulk update SOC preferences
- **Tags**: preferences

- **Request Body**: JSON object required

#### 37. **getUserProfile**
- **Method**: GET
- **Path**: `/api/mobile/trpc/preferences.getUserProfile`
- **Description**: Get user profile
- **Tags**: preferences
- **Parameters**:
  - `userId` (string, required): userId parameter


#### 38. **updateProfile**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.updateProfile`
- **Description**: Update profile
- **Tags**: preferences

- **Request Body**: JSON object required

#### 39. **getMyTrustInfo**
- **Method**: GET
- **Path**: `/api/mobile/trpc/trust.getMyTrustInfo`
- **Description**: Get current user's trust score and level
- **Tags**: trust




## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "data": {
      "code": "TRPC_ERROR_CODE",
      "httpStatus": 400
    }
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: User lacks permission
- `NOT_FOUND`: Resource not found
- `BAD_REQUEST`: Invalid input parameters
- `INTERNAL_SERVER_ERROR`: Server error

---
*This documentation is automatically generated from tRPC procedures and OpenAPI specifications.*
