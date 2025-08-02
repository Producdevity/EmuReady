# EmuReady Mobile API (tRPC)

*Auto-generated on: 2025-08-02T21:01:31.871Z*

## Summary
- **Total Endpoints**: 120
- **Public Endpoints**: 70
- **Protected Endpoints**: 50
- **OpenAPI Version**: 3.0.0

## Base URL
`/api/mobile/trpc`

## Authentication
Protected endpoints require Bearer token authentication using Clerk JWT.

## Interactive Documentation
- **Swagger UI**: [/docs/api/swagger](https://emuready.com/docs/api/swagger)
- **OpenAPI JSON**: [/api-docs/mobile-openapi.json](https://emuready.com/api-docs/mobile-openapi.json)

## Endpoints

### Public Endpoints (No Authentication Required)


#### 1. **validateToken**
- **Method**: GET
- **Path**: `/api/mobile/trpc/auth.validateToken`
- **Description**: Validate JWT token
- **Tags**: auth


#### 2. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/cpus.get`
- **Description**: Get CPUs with search, filtering, and pagination
- **Tags**: cpus


#### 3. **getById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/cpus.getById`
- **Description**: Get CPU by ID
- **Tags**: cpus


#### 4. **getByEmulator**
- **Method**: GET
- **Path**: `/api/mobile/trpc/customFieldDefinitions.getByEmulator`
- **Description**: Get custom field definitions by emulator (for mobile listing creation)
- **Tags**: customFieldDefinitions


#### 5. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/deviceBrands.get`
- **Description**: Get device brands with search and sorting
- **Tags**: deviceBrands


#### 6. **getById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/deviceBrands.getById`
- **Description**: Get device brand by ID
- **Tags**: deviceBrands


#### 7. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/devices.get`
- **Description**: Get devices with search and filtering
- **Tags**: devices


#### 8. **brands**
- **Method**: GET
- **Path**: `/api/mobile/trpc/devices.brands`
- **Description**: Get device brands
- **Tags**: devices


#### 9. **socs**
- **Method**: GET
- **Path**: `/api/mobile/trpc/devices.socs`
- **Description**: Get SOCs (System on Chips)
- **Tags**: devices


#### 10. **byId**
- **Method**: GET
- **Path**: `/api/mobile/trpc/devices.byId`
- **Description**: Get device by ID
- **Tags**: devices


#### 11. **getDevices**
- **Method**: GET
- **Path**: `/api/mobile/trpc/devices.getDevices`
- **Description**: @deprecated Use 'get' instead
- **Tags**: devices


#### 12. **getDeviceBrands**
- **Method**: GET
- **Path**: `/api/mobile/trpc/devices.getDeviceBrands`
- **Description**: @deprecated Use 'brands' instead
- **Tags**: devices


#### 13. **getSocs**
- **Method**: GET
- **Path**: `/api/mobile/trpc/devices.getSocs`
- **Description**: @deprecated Use 'socs' instead
- **Tags**: devices


#### 14. **getById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/devices.getById`
- **Description**: @deprecated Use 'byId' instead
- **Tags**: devices


#### 15. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/emulators.get`
- **Description**: Get emulators with search and filtering
- **Tags**: emulators


#### 16. **byId**
- **Method**: GET
- **Path**: `/api/mobile/trpc/emulators.byId`
- **Description**: Get emulator by ID
- **Tags**: emulators


#### 17. **getEmulators**
- **Method**: GET
- **Path**: `/api/mobile/trpc/emulators.getEmulators`
- **Description**: @deprecated Use 'get' instead
- **Tags**: emulators


#### 18. **getEmulatorById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/emulators.getEmulatorById`
- **Description**: @deprecated Use 'byId' instead
- **Tags**: emulators


#### 19. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.get`
- **Description**: Get games with search and filtering
- **Tags**: games


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


#### 22. **getGameById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.getGameById`
- **Description**: Get game by ID
- **Tags**: games


#### 23. **findSwitchTitleId**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.findSwitchTitleId`
- **Description**: Find Nintendo Switch title IDs by game name (fuzzy search)
- **Tags**: games


#### 24. **getBestSwitchTitleId**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.getBestSwitchTitleId`
- **Description**: Get the best matching Nintendo Switch title ID for a game name
- **Tags**: games


#### 25. **getSwitchGamesStats**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.getSwitchGamesStats`
- **Description**: Get Nintendo Switch games cache statistics
- **Tags**: games


#### 26. **getGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.getGames`
- **Description**: @deprecated Use 'get' instead. This endpoint is kept for backward compatibility.
- **Tags**: games


#### 27. **stats**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.stats`
- **Description**: Get app statistics
- **Tags**: general


#### 28. **systems**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.systems`
- **Description**: Get all systems
- **Tags**: general


#### 29. **performanceScales**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.performanceScales`
- **Description**: Get performance scales
- **Tags**: general


#### 30. **searchSuggestions**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.searchSuggestions`
- **Description**: Get search suggestions
- **Tags**: general


#### 31. **trustLevels**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.trustLevels`
- **Description**: Get trust levels (for mobile trust system integration)
- **Tags**: general


#### 32. **getAppStats**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.getAppStats`
- **Description**: @deprecated Use 'stats' instead
- **Tags**: general


#### 33. **getSystems**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.getSystems`
- **Description**: @deprecated Use 'systems' instead
- **Tags**: general


#### 34. **getPerformanceScales**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.getPerformanceScales`
- **Description**: @deprecated Use 'performanceScales' instead
- **Tags**: general


#### 35. **getSearchSuggestions**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.getSearchSuggestions`
- **Description**: @deprecated Use 'searchSuggestions' instead
- **Tags**: general


#### 36. **getTrustLevels**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.getTrustLevels`
- **Description**: @deprecated Use 'trustLevels' instead
- **Tags**: general


#### 37. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/gpus.get`
- **Description**: Get GPUs with search, filtering, and pagination
- **Tags**: gpus


#### 38. **getById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/gpus.getById`
- **Description**: Get GPU by ID
- **Tags**: gpus


#### 39. **checkUserHasReports**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listingReports.checkUserHasReports`
- **Description**: Check if a user has reports (for showing warnings)
- **Tags**: listingReports


#### 40. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.get`
- **Description**: Get listings with pagination and filtering
- **Tags**: listings


#### 41. **featured**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.featured`
- **Description**: Get featured listings
- **Tags**: listings


#### 42. **byGame**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.byGame`
- **Description**: Get listings by game
- **Tags**: listings


#### 43. **byId**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.byId`
- **Description**: Get listing by ID
- **Tags**: listings


#### 44. **comments**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.comments`
- **Description**: Get listing comments
- **Tags**: listings


#### 45. **getListings**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getListings`
- **Description**: @deprecated Use 'get' instead
- **Tags**: listings


#### 46. **getFeaturedListings**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getFeaturedListings`
- **Description**: @deprecated Use 'featured' instead
- **Tags**: listings


#### 47. **getListingsByGame**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getListingsByGame`
- **Description**: @deprecated Use 'byGame' instead
- **Tags**: listings


#### 48. **getListingById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getListingById`
- **Description**: @deprecated Use 'byId' instead
- **Tags**: listings


#### 49. **getListingComments**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getListingComments`
- **Description**: @deprecated Use 'comments' instead
- **Tags**: listings


#### 50. **cpus**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.cpus`
- **Description**: Get CPUs for mobile
- **Tags**: pcListings


#### 51. **gpus**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.gpus`
- **Description**: Get GPUs for mobile
- **Tags**: pcListings


#### 52. **getPcListings**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.getPcListings`
- **Description**: @deprecated Use 'get' instead
- **Tags**: pcListings


#### 53. **getCpus**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.getCpus`
- **Description**: @deprecated Use 'cpus' instead
- **Tags**: pcListings


#### 54. **getGpus**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.getGpus`
- **Description**: @deprecated Use 'gpus' instead
- **Tags**: pcListings


#### 55. **searchGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/rawg.searchGameImages`
- **Description**: Search for game images in RAWG database
- **Tags**: rawg


#### 56. **searchGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/rawg.searchGames`
- **Description**: Search for games in RAWG database
- **Tags**: rawg


#### 57. **getGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/rawg.getGameImages`
- **Description**: Get game images by ID
- **Tags**: rawg


#### 58. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/socs.get`
- **Description**: Get SoCs with search, filtering, and pagination
- **Tags**: socs


#### 59. **getById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/socs.getById`
- **Description**: Get SoC by ID
- **Tags**: socs


#### 60. **searchGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.searchGameImages`
- **Description**: Search for game images in TGDB database
- **Tags**: tgdb


#### 61. **searchGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.searchGames`
- **Description**: Search for games in TGDB database
- **Tags**: tgdb


#### 62. **getGameImageUrls**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.getGameImageUrls`
- **Description**: Get game image URLs for a specific game
- **Tags**: tgdb


#### 63. **getGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.getGameImages`
- **Description**: Get game images by game IDs
- **Tags**: tgdb


#### 64. **getPlatforms**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.getPlatforms`
- **Description**: Get available platforms from TGDB
- **Tags**: tgdb


#### 65. **userInfo**
- **Method**: GET
- **Path**: `/api/mobile/trpc/trust.userInfo`
- **Description**: Get trust info for a specific user (public)
- **Tags**: trust


#### 66. **levels**
- **Method**: GET
- **Path**: `/api/mobile/trpc/trust.levels`
- **Description**: Get trust levels configuration
- **Tags**: trust


#### 67. **getUserTrustInfo**
- **Method**: GET
- **Path**: `/api/mobile/trpc/trust.getUserTrustInfo`
- **Description**: @deprecated Use 'userInfo' instead
- **Tags**: trust


#### 68. **getTrustLevels**
- **Method**: GET
- **Path**: `/api/mobile/trpc/trust.getTrustLevels`
- **Description**: @deprecated Use 'levels' instead
- **Tags**: trust


#### 69. **byId**
- **Method**: GET
- **Path**: `/api/mobile/trpc/users.byId`
- **Description**: Get user profile by ID (public user profiles)
- **Tags**: users


#### 70. **getUserById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/users.getUserById`
- **Description**: @deprecated Use 'byId' instead
- **Tags**: users



### Protected Endpoints (Authentication Required)


#### 1. **updateProfile**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.updateProfile`
- **Description**: Update mobile profile
- **Tags**: auth
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 2. **deleteAccount**
- **Method**: POST
- **Path**: `/api/mobile/trpc/auth.deleteAccount`
- **Description**: Delete account
- **Tags**: auth
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 3. **isVerifiedDeveloper**
- **Method**: GET
- **Path**: `/api/mobile/trpc/developers.isVerifiedDeveloper`
- **Description**: Check if a user is a verified developer for an emulator
- **Tags**: developers

- **Authentication**: Bearer token required

#### 4. **create**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listingReports.create`
- **Description**: Create a new listing report (user-facing)
- **Tags**: listingReports

- **Authentication**: Bearer token required

#### 5. **byUser**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.byUser`
- **Description**: Get user listings
- **Tags**: listings

- **Authentication**: Bearer token required

#### 6. **create**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.create`
- **Description**: Create a new listing
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 7. **update**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.update`
- **Description**: Update a listing
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 8. **delete**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.delete`
- **Description**: Delete a listing
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 9. **vote**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.vote`
- **Description**: Vote on a listing
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 10. **userVote**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.userVote`
- **Description**: Get user's vote on a listing
- **Tags**: listings

- **Authentication**: Bearer token required

#### 11. **createComment**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.createComment`
- **Description**: Create a comment
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 12. **updateComment**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.updateComment`
- **Description**: Update a comment
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 13. **deleteComment**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.deleteComment`
- **Description**: Delete a comment
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 14. **getUserListings**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getUserListings`
- **Description**: @deprecated Use 'byUser' instead
- **Tags**: listings

- **Authentication**: Bearer token required

#### 15. **createListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.createListing`
- **Description**: @deprecated Use 'create' instead
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 16. **updateListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.updateListing`
- **Description**: @deprecated Use 'update' instead
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 17. **deleteListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.deleteListing`
- **Description**: @deprecated Use 'delete' instead
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 18. **voteListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/listings.voteListing`
- **Description**: @deprecated Use 'vote' instead
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 19. **getUserVote**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.getUserVote`
- **Description**: @deprecated Use 'userVote' instead
- **Tags**: listings

- **Authentication**: Bearer token required

#### 20. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/notifications.get`
- **Description**: Get notifications with pagination
- **Tags**: notifications

- **Authentication**: Bearer token required

#### 21. **unreadCount**
- **Method**: GET
- **Path**: `/api/mobile/trpc/notifications.unreadCount`
- **Description**: Get unread notification count
- **Tags**: notifications

- **Authentication**: Bearer token required

#### 22. **markAsRead**
- **Method**: POST
- **Path**: `/api/mobile/trpc/notifications.markAsRead`
- **Description**: Mark notification as read
- **Tags**: notifications
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 23. **markAllAsRead**
- **Method**: POST
- **Path**: `/api/mobile/trpc/notifications.markAllAsRead`
- **Description**: Mark all notifications as read
- **Tags**: notifications

- **Authentication**: Bearer token required

#### 24. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.get`
- **Description**: @deprecated Use mobile.preferences.pcPresets.get instead
- **Tags**: pcListings

- **Authentication**: Bearer token required

#### 25. **create**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.create`
- **Description**: @deprecated Use mobile.preferences.pcPresets.create instead
- **Tags**: pcListings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 26. **update**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.update`
- **Description**: @deprecated Use mobile.preferences.pcPresets.update instead
- **Tags**: pcListings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 27. **delete**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.delete`
- **Description**: @deprecated Use mobile.preferences.pcPresets.delete instead
- **Tags**: pcListings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 28. **createPcListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.createPcListing`
- **Description**: @deprecated Use 'create' instead
- **Tags**: pcListings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 29. **updatePcListing**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.updatePcListing`
- **Description**: @deprecated Use 'update' instead
- **Tags**: pcListings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 30. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/preferences.get`
- **Description**: PC Presets nested router
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 31. **update**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.update`
- **Description**: PC Presets nested router
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 32. **addDevice**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.addDevice`
- **Description**: Add device preference
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 33. **removeDevice**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.removeDevice`
- **Description**: Remove device preference
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 34. **bulkUpdateDevices**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.bulkUpdateDevices`
- **Description**: Bulk update device preferences
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 35. **bulkUpdateSocs**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.bulkUpdateSocs`
- **Description**: Bulk update SOC preferences
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 36. **currentProfile**
- **Method**: GET
- **Path**: `/api/mobile/trpc/preferences.currentProfile`
- **Description**: Get current user's profile
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 37. **profile**
- **Method**: GET
- **Path**: `/api/mobile/trpc/preferences.profile`
- **Description**: Get user profile by ID
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 38. **updateProfile**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.updateProfile`
- **Description**: Update profile
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 39. **create**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.create`
- **Description**: PC Presets nested router
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 40. **delete**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.delete`
- **Description**: PC Presets nested router
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 41. **getUserPreferences**
- **Method**: GET
- **Path**: `/api/mobile/trpc/preferences.getUserPreferences`
- **Description**: @deprecated Use 'get' instead
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 42. **updateUserPreferences**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.updateUserPreferences`
- **Description**: @deprecated Use 'update' instead
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 43. **addDevicePreference**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.addDevicePreference`
- **Description**: @deprecated Use 'addDevice' instead
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 44. **removeDevicePreference**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.removeDevicePreference`
- **Description**: @deprecated Use 'removeDevice' instead
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 45. **bulkUpdateDevicePreferences**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.bulkUpdateDevicePreferences`
- **Description**: @deprecated Use 'bulkUpdateDevices' instead
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 46. **bulkUpdateSocPreferences**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.bulkUpdateSocPreferences`
- **Description**: @deprecated Use 'bulkUpdateSocs' instead
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 47. **getCurrentUserProfile**
- **Method**: GET
- **Path**: `/api/mobile/trpc/preferences.getCurrentUserProfile`
- **Description**: @deprecated Use 'currentProfile' instead
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 48. **getUserProfile**
- **Method**: GET
- **Path**: `/api/mobile/trpc/preferences.getUserProfile`
- **Description**: @deprecated Use 'profile' instead
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 49. **myInfo**
- **Method**: GET
- **Path**: `/api/mobile/trpc/trust.myInfo`
- **Description**: Get current user's trust score and level
- **Tags**: trust

- **Authentication**: Bearer token required

#### 50. **getMyTrustInfo**
- **Method**: GET
- **Path**: `/api/mobile/trpc/trust.getMyTrustInfo`
- **Description**: @deprecated Use 'myInfo' instead
- **Tags**: trust

- **Authentication**: Bearer token required


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
