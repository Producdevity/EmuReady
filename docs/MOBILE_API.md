# EmuReady Mobile API (tRPC)

*Auto-generated on: 2025-11-13T15:34:31.912Z*

## Summary
- **Total Endpoints**: 95
- **Public Endpoints**: 59
- **Protected Endpoints**: 36
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
- **Path**: `/auth.validateToken`
- **Description**: Validate JWT token
- **Tags**: auth


#### 2. **getDeviceCompatibility**
- **Method**: GET
- **Path**: `/catalog.getDeviceCompatibility`
- **Description**: getDeviceCompatibility - catalog
- **Tags**: catalog


#### 3. **get**
- **Method**: GET
- **Path**: `/cpus.get`
- **Description**: Get CPUs with search, filtering, and pagination
- **Tags**: cpus


#### 4. **getById**
- **Method**: GET
- **Path**: `/cpus.getById`
- **Description**: Get CPU by ID
- **Tags**: cpus


#### 5. **getByEmulator**
- **Method**: GET
- **Path**: `/customFieldDefinitions.getByEmulator`
- **Description**: Get custom field definitions by emulator (for mobile listing creation)
- **Tags**: customFieldDefinitions


#### 6. **get**
- **Method**: GET
- **Path**: `/deviceBrands.get`
- **Description**: Get device brands with search and sorting
- **Tags**: deviceBrands


#### 7. **getById**
- **Method**: GET
- **Path**: `/deviceBrands.getById`
- **Description**: Get device brand by ID
- **Tags**: deviceBrands


#### 8. **get**
- **Method**: GET
- **Path**: `/devices.get`
- **Description**: Get devices with optional search, brand filtering, and pagination
- **Tags**: devices


#### 9. **brands**
- **Method**: GET
- **Path**: `/devices.brands`
- **Description**: Get all device brands sorted alphabetically
- **Tags**: devices


#### 10. **socs**
- **Method**: GET
- **Path**: `/devices.socs`
- **Description**: Get SOCs (System on Chips)
- **Tags**: devices


#### 11. **byId**
- **Method**: GET
- **Path**: `/devices.byId`
- **Description**: Get device by ID
- **Tags**: devices


#### 12. **get**
- **Method**: GET
- **Path**: `/emulators.get`
- **Description**: Get emulators with search and filtering
- **Tags**: emulators


#### 13. **byId**
- **Method**: GET
- **Path**: `/emulators.byId`
- **Description**: Get emulator by ID
- **Tags**: emulators


#### 14. **get**
- **Method**: GET
- **Path**: `/games.get`
- **Description**: Get games with search and filtering
- **Tags**: games


#### 15. **getPopularGames**
- **Method**: GET
- **Path**: `/games.getPopularGames`
- **Description**: Get popular games
- **Tags**: games


#### 16. **searchGames**
- **Method**: GET
- **Path**: `/games.searchGames`
- **Description**: Search games
- **Tags**: games


#### 17. **byId**
- **Method**: GET
- **Path**: `/games.byId`
- **Description**: Get game by ID
- **Tags**: games


#### 18. **findSwitchTitleId**
- **Method**: GET
- **Path**: `/games.findSwitchTitleId`
- **Description**: Find Nintendo Switch title IDs by game name (fuzzy search)
- **Tags**: games


#### 19. **getBestSwitchTitleId**
- **Method**: GET
- **Path**: `/games.getBestSwitchTitleId`
- **Description**: Get the best matching Nintendo Switch title ID for a game name
- **Tags**: games


#### 20. **getSwitchGamesStats**
- **Method**: GET
- **Path**: `/games.getSwitchGamesStats`
- **Description**: Get Nintendo Switch games cache statistics
- **Tags**: games


#### 21. **findThreeDsTitleId**
- **Method**: GET
- **Path**: `/games.findThreeDsTitleId`
- **Description**: Find Nintendo 3DS title IDs by game name (fuzzy search)
- **Tags**: games


#### 22. **getBestThreeDsTitleId**
- **Method**: GET
- **Path**: `/games.getBestThreeDsTitleId`
- **Description**: Get the best matching Nintendo 3DS title ID for a game name
- **Tags**: games


#### 23. **getThreeDsGamesStats**
- **Method**: GET
- **Path**: `/games.getThreeDsGamesStats`
- **Description**: Get Nintendo 3DS games cache statistics
- **Tags**: games


#### 24. **findSteamAppId**
- **Method**: GET
- **Path**: `/games.findSteamAppId`
- **Description**: Find Steam App IDs by game name (fuzzy search)
- **Tags**: games


#### 25. **getBestSteamAppId**
- **Method**: GET
- **Path**: `/games.getBestSteamAppId`
- **Description**: Get the best matching Steam App ID for a game name
- **Tags**: games


#### 26. **getSteamGamesStats**
- **Method**: GET
- **Path**: `/games.getSteamGamesStats`
- **Description**: Get Steam games cache statistics
- **Tags**: games


#### 27. **batchBySteamAppIds**
- **Method**: GET
- **Path**: `/games.batchBySteamAppIds`
- **Description**: Get Steam games cache statistics
- **Tags**: games


#### 28. **stats**
- **Method**: GET
- **Path**: `/general.stats`
- **Description**: Get app statistics
- **Tags**: general


#### 29. **systems**
- **Method**: GET
- **Path**: `/general.systems`
- **Description**: Get all systems
- **Tags**: general


#### 30. **performanceScales**
- **Method**: GET
- **Path**: `/general.performanceScales`
- **Description**: Get performance scales
- **Tags**: general


#### 31. **searchSuggestions**
- **Method**: GET
- **Path**: `/general.searchSuggestions`
- **Description**: Get search suggestions
- **Tags**: general


#### 32. **trustLevels**
- **Method**: GET
- **Path**: `/general.trustLevels`
- **Description**: Get trust levels (for mobile trust system integration)
- **Tags**: general


#### 33. **get**
- **Method**: GET
- **Path**: `/gpus.get`
- **Description**: Get GPUs with search, filtering, and pagination
- **Tags**: gpus


#### 34. **getById**
- **Method**: GET
- **Path**: `/gpus.getById`
- **Description**: Get GPU by ID
- **Tags**: gpus


#### 35. **checkUserHasReports**
- **Method**: GET
- **Path**: `/listingReports.checkUserHasReports`
- **Description**: Check if a user has reports (for showing warnings)
- **Tags**: listingReports


#### 36. **driverVersions**
- **Method**: GET
- **Path**: `/listings.driverVersions`
- **Description**: Get available driver versions (mirrors web listings.driverVersions)
- **Tags**: listings


#### 37. **get**
- **Method**: GET
- **Path**: `/listings.get`
- **Description**: Get listings with pagination and filtering
- **Tags**: listings


#### 38. **getListings**
- **Method**: GET
- **Path**: `/listings.getListings`
- **Description**: @deprecated Use 'get' instead - kept for backwards compatibility with Eden
- **Tags**: listings


#### 39. **featured**
- **Method**: GET
- **Path**: `/listings.featured`
- **Description**: Get featured listings
- **Tags**: listings


#### 40. **byGame**
- **Method**: GET
- **Path**: `/listings.byGame`
- **Description**: Get listings by game
- **Tags**: listings


#### 41. **byId**
- **Method**: GET
- **Path**: `/listings.byId`
- **Description**: Get listing by ID
- **Tags**: listings


#### 42. **comments**
- **Method**: GET
- **Path**: `/listings.comments`
- **Description**: Get listing comments
- **Tags**: listings


#### 43. **getEmulatorConfig**
- **Method**: GET
- **Path**: `/listings.getEmulatorConfig`
- **Description**: Delete a comment
- **Tags**: listings


#### 44. **byId**
- **Method**: GET
- **Path**: `/pcListings.byId`
- **Description**: byId - pcListings
- **Tags**: pcListings


#### 45. **get**
- **Method**: GET
- **Path**: `/pcListings.get`
- **Description**: Get PC listings with pagination and filtering
- **Tags**: pcListings


#### 46. **cpus**
- **Method**: GET
- **Path**: `/pcListings.cpus`
- **Description**: Get CPUs for mobile
- **Tags**: pcListings


#### 47. **gpus**
- **Method**: GET
- **Path**: `/pcListings.gpus`
- **Description**: Get GPUs for mobile
- **Tags**: pcListings


#### 48. **searchGameImages**
- **Method**: GET
- **Path**: `/rawg.searchGameImages`
- **Description**: Search for game images in RAWG database
- **Tags**: rawg


#### 49. **searchGames**
- **Method**: GET
- **Path**: `/rawg.searchGames`
- **Description**: Search for games in RAWG database
- **Tags**: rawg


#### 50. **getGameImages**
- **Method**: GET
- **Path**: `/rawg.getGameImages`
- **Description**: Get game images by ID
- **Tags**: rawg


#### 51. **get**
- **Method**: GET
- **Path**: `/socs.get`
- **Description**: Get SoCs with search, filtering, and pagination
- **Tags**: socs


#### 52. **getById**
- **Method**: GET
- **Path**: `/socs.getById`
- **Description**: Get SoC by ID
- **Tags**: socs


#### 53. **searchGameImages**
- **Method**: GET
- **Path**: `/tgdb.searchGameImages`
- **Description**: Search for game images in TGDB database
- **Tags**: tgdb


#### 54. **searchGames**
- **Method**: GET
- **Path**: `/tgdb.searchGames`
- **Description**: Search for games in TGDB database
- **Tags**: tgdb


#### 55. **getGameImageUrls**
- **Method**: GET
- **Path**: `/tgdb.getGameImageUrls`
- **Description**: Get game image URLs for a specific game
- **Tags**: tgdb


#### 56. **getGameImages**
- **Method**: GET
- **Path**: `/tgdb.getGameImages`
- **Description**: Get game images by game IDs
- **Tags**: tgdb


#### 57. **getPlatforms**
- **Method**: GET
- **Path**: `/tgdb.getPlatforms`
- **Description**: Get available platforms from TGDB
- **Tags**: tgdb


#### 58. **userInfo**
- **Method**: GET
- **Path**: `/trust.userInfo`
- **Description**: Get trust info for a specific user (public)
- **Tags**: trust


#### 59. **byId**
- **Method**: GET
- **Path**: `/users.byId`
- **Description**: Get user profile by ID (public user profiles)
- **Tags**: users



### Protected Endpoints (Authentication Required)


#### 1. **updateProfile**
- **Method**: POST
- **Path**: `/auth.updateProfile`
- **Description**: Update mobile profile
- **Tags**: auth
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 2. **deleteAccount**
- **Method**: POST
- **Path**: `/auth.deleteAccount`
- **Description**: Delete account
- **Tags**: auth
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 3. **isVerifiedDeveloper**
- **Method**: GET
- **Path**: `/developers.isVerifiedDeveloper`
- **Description**: Check if a user is a verified developer for an emulator
- **Tags**: developers

- **Authentication**: Bearer token required

#### 4. **create**
- **Method**: POST
- **Path**: `/listingReports.create`
- **Description**: Create a new listing report (user-facing)
- **Tags**: listingReports

- **Authentication**: Bearer token required

#### 5. **byUser**
- **Method**: GET
- **Path**: `/listings.byUser`
- **Description**: Get user listings
- **Tags**: listings

- **Authentication**: Bearer token required

#### 6. **create**
- **Method**: POST
- **Path**: `/listings.create`
- **Description**: Create a new listing
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 7. **update**
- **Method**: POST
- **Path**: `/listings.update`
- **Description**: Update a listing
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 8. **delete**
- **Method**: POST
- **Path**: `/listings.delete`
- **Description**: Delete a listing
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 9. **vote**
- **Method**: POST
- **Path**: `/listings.vote`
- **Description**: Vote on a listing
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 10. **userVote**
- **Method**: GET
- **Path**: `/listings.userVote`
- **Description**: Get user's vote on a listing
- **Tags**: listings

- **Authentication**: Bearer token required

#### 11. **createComment**
- **Method**: POST
- **Path**: `/listings.createComment`
- **Description**: Create a comment
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 12. **updateComment**
- **Method**: POST
- **Path**: `/listings.updateComment`
- **Description**: Update a comment
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 13. **deleteComment**
- **Method**: POST
- **Path**: `/listings.deleteComment`
- **Description**: Delete a comment
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 14. **voteComment**
- **Method**: POST
- **Path**: `/listings.voteComment`
- **Description**: Vote on a comment
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 15. **getUserCommentVotes**
- **Method**: GET
- **Path**: `/listings.getUserCommentVotes`
- **Description**: Get user votes for multiple comments
- **Tags**: listings

- **Authentication**: Bearer token required

#### 16. **reportComment**
- **Method**: POST
- **Path**: `/listings.reportComment`
- **Description**: Report a comment
- **Tags**: listings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 17. **get**
- **Method**: GET
- **Path**: `/notifications.get`
- **Description**: Get notifications with pagination
- **Tags**: notifications

- **Authentication**: Bearer token required

#### 18. **unreadCount**
- **Method**: GET
- **Path**: `/notifications.unreadCount`
- **Description**: Get unread notification count
- **Tags**: notifications

- **Authentication**: Bearer token required

#### 19. **markAsRead**
- **Method**: POST
- **Path**: `/notifications.markAsRead`
- **Description**: Mark notification as read
- **Tags**: notifications
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 20. **markAllAsRead**
- **Method**: POST
- **Path**: `/notifications.markAllAsRead`
- **Description**: Mark all notifications as read
- **Tags**: notifications

- **Authentication**: Bearer token required

#### 21. **create**
- **Method**: POST
- **Path**: `/pcListings.create`
- **Description**: Create a new PC listing
- **Tags**: pcListings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 22. **update**
- **Method**: POST
- **Path**: `/pcListings.update`
- **Description**: Update a PC listing
- **Tags**: pcListings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 23. **get**
- **Method**: GET
- **Path**: `/pcPresets.get`
- **Description**: Get current user's PC presets
- **Tags**: pcPresets

- **Authentication**: Bearer token required

#### 24. **create**
- **Method**: POST
- **Path**: `/pcPresets.create`
- **Description**: Create a new PC preset
- **Tags**: pcPresets
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 25. **update**
- **Method**: POST
- **Path**: `/pcPresets.update`
- **Description**: Update an existing PC preset
- **Tags**: pcPresets
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 26. **delete**
- **Method**: POST
- **Path**: `/pcPresets.delete`
- **Description**: Delete a PC preset
- **Tags**: pcPresets
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 27. **get**
- **Method**: GET
- **Path**: `/preferences.get`
- **Description**: Get user preferences
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 28. **update**
- **Method**: POST
- **Path**: `/preferences.update`
- **Description**: Update user preferences
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 29. **addDevice**
- **Method**: POST
- **Path**: `/preferences.addDevice`
- **Description**: Add device preference
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 30. **removeDevice**
- **Method**: POST
- **Path**: `/preferences.removeDevice`
- **Description**: Remove device preference
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 31. **bulkUpdateDevices**
- **Method**: POST
- **Path**: `/preferences.bulkUpdateDevices`
- **Description**: Bulk update device preferences
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 32. **bulkUpdateSocs**
- **Method**: POST
- **Path**: `/preferences.bulkUpdateSocs`
- **Description**: Bulk update SOC preferences
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 33. **currentProfile**
- **Method**: GET
- **Path**: `/preferences.currentProfile`
- **Description**: Get current user's profile
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 34. **profile**
- **Method**: GET
- **Path**: `/preferences.profile`
- **Description**: Get user profile by ID
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 35. **updateProfile**
- **Method**: POST
- **Path**: `/preferences.updateProfile`
- **Description**: Update profile
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 36. **myInfo**
- **Method**: GET
- **Path**: `/trust.myInfo`
- **Description**: Get current user's trust score and level
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
