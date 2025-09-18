# EmuReady Mobile API (tRPC)

*Auto-generated on: 2025-09-18T17:31:45.220Z*

## Summary
- **Total Endpoints**: 89
- **Public Endpoints**: 53
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


#### 2. **get**
- **Method**: GET
- **Path**: `/cpus.get`
- **Description**: Get CPUs with search, filtering, and pagination
- **Tags**: cpus


#### 3. **getById**
- **Method**: GET
- **Path**: `/cpus.getById`
- **Description**: Get CPU by ID
- **Tags**: cpus


#### 4. **getByEmulator**
- **Method**: GET
- **Path**: `/customFieldDefinitions.getByEmulator`
- **Description**: Get custom field definitions by emulator (for mobile listing creation)
- **Tags**: customFieldDefinitions


#### 5. **get**
- **Method**: GET
- **Path**: `/deviceBrands.get`
- **Description**: Get device brands with search and sorting
- **Tags**: deviceBrands


#### 6. **getById**
- **Method**: GET
- **Path**: `/deviceBrands.getById`
- **Description**: Get device brand by ID
- **Tags**: deviceBrands


#### 7. **get**
- **Method**: GET
- **Path**: `/devices.get`
- **Description**: Get devices with optional search, brand filtering, and pagination
- **Tags**: devices


#### 8. **brands**
- **Method**: GET
- **Path**: `/devices.brands`
- **Description**: Get all device brands sorted alphabetically
- **Tags**: devices


#### 9. **socs**
- **Method**: GET
- **Path**: `/devices.socs`
- **Description**: Get SOCs (System on Chips)
- **Tags**: devices


#### 10. **byId**
- **Method**: GET
- **Path**: `/devices.byId`
- **Description**: Get device by ID
- **Tags**: devices


#### 11. **get**
- **Method**: GET
- **Path**: `/emulators.get`
- **Description**: Get emulators with search and filtering
- **Tags**: emulators


#### 12. **byId**
- **Method**: GET
- **Path**: `/emulators.byId`
- **Description**: Get emulator by ID
- **Tags**: emulators


#### 13. **get**
- **Method**: GET
- **Path**: `/games.get`
- **Description**: Get games with search and filtering
- **Tags**: games


#### 14. **getPopularGames**
- **Method**: GET
- **Path**: `/games.getPopularGames`
- **Description**: Get popular games
- **Tags**: games


#### 15. **searchGames**
- **Method**: GET
- **Path**: `/games.searchGames`
- **Description**: Search games
- **Tags**: games


#### 16. **byId**
- **Method**: GET
- **Path**: `/games.byId`
- **Description**: Get game by ID
- **Tags**: games


#### 17. **findSwitchTitleId**
- **Method**: GET
- **Path**: `/games.findSwitchTitleId`
- **Description**: Find Nintendo Switch title IDs by game name (fuzzy search)
- **Tags**: games


#### 18. **getBestSwitchTitleId**
- **Method**: GET
- **Path**: `/games.getBestSwitchTitleId`
- **Description**: Get the best matching Nintendo Switch title ID for a game name
- **Tags**: games


#### 19. **getSwitchGamesStats**
- **Method**: GET
- **Path**: `/games.getSwitchGamesStats`
- **Description**: Get Nintendo Switch games cache statistics
- **Tags**: games


#### 20. **findThreeDsTitleId**
- **Method**: GET
- **Path**: `/games.findThreeDsTitleId`
- **Description**: Find Nintendo 3DS title IDs by game name (fuzzy search)
- **Tags**: games


#### 21. **getBestThreeDsTitleId**
- **Method**: GET
- **Path**: `/games.getBestThreeDsTitleId`
- **Description**: Get the best matching Nintendo 3DS title ID for a game name
- **Tags**: games


#### 22. **getThreeDsGamesStats**
- **Method**: GET
- **Path**: `/games.getThreeDsGamesStats`
- **Description**: Get Nintendo 3DS games cache statistics
- **Tags**: games


#### 23. **stats**
- **Method**: GET
- **Path**: `/general.stats`
- **Description**: Get app statistics
- **Tags**: general


#### 24. **systems**
- **Method**: GET
- **Path**: `/general.systems`
- **Description**: Get all systems
- **Tags**: general


#### 25. **performanceScales**
- **Method**: GET
- **Path**: `/general.performanceScales`
- **Description**: Get performance scales
- **Tags**: general


#### 26. **searchSuggestions**
- **Method**: GET
- **Path**: `/general.searchSuggestions`
- **Description**: Get search suggestions
- **Tags**: general


#### 27. **trustLevels**
- **Method**: GET
- **Path**: `/general.trustLevels`
- **Description**: Get trust levels (for mobile trust system integration)
- **Tags**: general


#### 28. **get**
- **Method**: GET
- **Path**: `/gpus.get`
- **Description**: Get GPUs with search, filtering, and pagination
- **Tags**: gpus


#### 29. **getById**
- **Method**: GET
- **Path**: `/gpus.getById`
- **Description**: Get GPU by ID
- **Tags**: gpus


#### 30. **checkUserHasReports**
- **Method**: GET
- **Path**: `/listingReports.checkUserHasReports`
- **Description**: Check if a user has reports (for showing warnings)
- **Tags**: listingReports


#### 31. **get**
- **Method**: GET
- **Path**: `/listings.get`
- **Description**: Get listings with pagination and filtering
- **Tags**: listings


#### 32. **getListings**
- **Method**: GET
- **Path**: `/listings.getListings`
- **Description**: @deprecated Use 'get' instead - kept for backwards compatibility with Eden
- **Tags**: listings


#### 33. **featured**
- **Method**: GET
- **Path**: `/listings.featured`
- **Description**: Get featured listings
- **Tags**: listings


#### 34. **byGame**
- **Method**: GET
- **Path**: `/listings.byGame`
- **Description**: Get listings by game
- **Tags**: listings


#### 35. **byId**
- **Method**: GET
- **Path**: `/listings.byId`
- **Description**: Get listing by ID
- **Tags**: listings


#### 36. **comments**
- **Method**: GET
- **Path**: `/listings.comments`
- **Description**: Get listing comments
- **Tags**: listings


#### 37. **getEmulatorConfig**
- **Method**: GET
- **Path**: `/listings.getEmulatorConfig`
- **Description**: Delete a comment
- **Tags**: listings


#### 38. **byId**
- **Method**: GET
- **Path**: `/pcListings.byId`
- **Description**: byId - pcListings
- **Tags**: pcListings


#### 39. **get**
- **Method**: GET
- **Path**: `/pcListings.get`
- **Description**: Get PC listings with pagination and filtering
- **Tags**: pcListings


#### 40. **cpus**
- **Method**: GET
- **Path**: `/pcListings.cpus`
- **Description**: Get CPUs for mobile
- **Tags**: pcListings


#### 41. **gpus**
- **Method**: GET
- **Path**: `/pcListings.gpus`
- **Description**: Get GPUs for mobile
- **Tags**: pcListings


#### 42. **searchGameImages**
- **Method**: GET
- **Path**: `/rawg.searchGameImages`
- **Description**: Search for game images in RAWG database
- **Tags**: rawg


#### 43. **searchGames**
- **Method**: GET
- **Path**: `/rawg.searchGames`
- **Description**: Search for games in RAWG database
- **Tags**: rawg


#### 44. **getGameImages**
- **Method**: GET
- **Path**: `/rawg.getGameImages`
- **Description**: Get game images by ID
- **Tags**: rawg


#### 45. **get**
- **Method**: GET
- **Path**: `/socs.get`
- **Description**: Get SoCs with search, filtering, and pagination
- **Tags**: socs


#### 46. **getById**
- **Method**: GET
- **Path**: `/socs.getById`
- **Description**: Get SoC by ID
- **Tags**: socs


#### 47. **searchGameImages**
- **Method**: GET
- **Path**: `/tgdb.searchGameImages`
- **Description**: Search for game images in TGDB database
- **Tags**: tgdb


#### 48. **searchGames**
- **Method**: GET
- **Path**: `/tgdb.searchGames`
- **Description**: Search for games in TGDB database
- **Tags**: tgdb


#### 49. **getGameImageUrls**
- **Method**: GET
- **Path**: `/tgdb.getGameImageUrls`
- **Description**: Get game image URLs for a specific game
- **Tags**: tgdb


#### 50. **getGameImages**
- **Method**: GET
- **Path**: `/tgdb.getGameImages`
- **Description**: Get game images by game IDs
- **Tags**: tgdb


#### 51. **getPlatforms**
- **Method**: GET
- **Path**: `/tgdb.getPlatforms`
- **Description**: Get available platforms from TGDB
- **Tags**: tgdb


#### 52. **userInfo**
- **Method**: GET
- **Path**: `/trust.userInfo`
- **Description**: Get trust info for a specific user (public)
- **Tags**: trust


#### 53. **byId**
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
