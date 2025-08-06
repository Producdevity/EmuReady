# EmuReady Mobile API (tRPC)

*Auto-generated on: 2025-08-06T17:12:07.618Z*

## Summary
- **Total Endpoints**: 78
- **Public Endpoints**: 47
- **Protected Endpoints**: 31
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


#### 11. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/emulators.get`
- **Description**: Get emulators with search and filtering
- **Tags**: emulators


#### 12. **byId**
- **Method**: GET
- **Path**: `/api/mobile/trpc/emulators.byId`
- **Description**: Get emulator by ID
- **Tags**: emulators


#### 13. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.get`
- **Description**: Get games with search and filtering
- **Tags**: games


#### 14. **getPopularGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.getPopularGames`
- **Description**: Get popular games
- **Tags**: games


#### 15. **searchGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.searchGames`
- **Description**: Search games
- **Tags**: games


#### 16. **getGameById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.getGameById`
- **Description**: Get game by ID
- **Tags**: games


#### 17. **findSwitchTitleId**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.findSwitchTitleId`
- **Description**: Find Nintendo Switch title IDs by game name (fuzzy search)
- **Tags**: games


#### 18. **getBestSwitchTitleId**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.getBestSwitchTitleId`
- **Description**: Get the best matching Nintendo Switch title ID for a game name
- **Tags**: games


#### 19. **getSwitchGamesStats**
- **Method**: GET
- **Path**: `/api/mobile/trpc/games.getSwitchGamesStats`
- **Description**: Get Nintendo Switch games cache statistics
- **Tags**: games


#### 20. **stats**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.stats`
- **Description**: Get app statistics
- **Tags**: general


#### 21. **systems**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.systems`
- **Description**: Get all systems
- **Tags**: general


#### 22. **performanceScales**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.performanceScales`
- **Description**: Get performance scales
- **Tags**: general


#### 23. **searchSuggestions**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.searchSuggestions`
- **Description**: Get search suggestions
- **Tags**: general


#### 24. **trustLevels**
- **Method**: GET
- **Path**: `/api/mobile/trpc/general.trustLevels`
- **Description**: Get trust levels (for mobile trust system integration)
- **Tags**: general


#### 25. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/gpus.get`
- **Description**: Get GPUs with search, filtering, and pagination
- **Tags**: gpus


#### 26. **getById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/gpus.getById`
- **Description**: Get GPU by ID
- **Tags**: gpus


#### 27. **checkUserHasReports**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listingReports.checkUserHasReports`
- **Description**: Check if a user has reports (for showing warnings)
- **Tags**: listingReports


#### 28. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.get`
- **Description**: Get listings with pagination and filtering
- **Tags**: listings


#### 29. **featured**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.featured`
- **Description**: Get featured listings
- **Tags**: listings


#### 30. **byGame**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.byGame`
- **Description**: Get listings by game
- **Tags**: listings


#### 31. **byId**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.byId`
- **Description**: Get listing by ID
- **Tags**: listings


#### 32. **comments**
- **Method**: GET
- **Path**: `/api/mobile/trpc/listings.comments`
- **Description**: Get listing comments
- **Tags**: listings


#### 33. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.get`
- **Description**: Get PC listings with pagination and filtering
- **Tags**: pcListings


#### 34. **cpus**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.cpus`
- **Description**: Get CPUs for mobile
- **Tags**: pcListings


#### 35. **gpus**
- **Method**: GET
- **Path**: `/api/mobile/trpc/pcListings.gpus`
- **Description**: Get GPUs for mobile
- **Tags**: pcListings


#### 36. **searchGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/rawg.searchGameImages`
- **Description**: Search for game images in RAWG database
- **Tags**: rawg


#### 37. **searchGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/rawg.searchGames`
- **Description**: Search for games in RAWG database
- **Tags**: rawg


#### 38. **getGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/rawg.getGameImages`
- **Description**: Get game images by ID
- **Tags**: rawg


#### 39. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/socs.get`
- **Description**: Get SoCs with search, filtering, and pagination
- **Tags**: socs


#### 40. **getById**
- **Method**: GET
- **Path**: `/api/mobile/trpc/socs.getById`
- **Description**: Get SoC by ID
- **Tags**: socs


#### 41. **searchGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.searchGameImages`
- **Description**: Search for game images in TGDB database
- **Tags**: tgdb


#### 42. **searchGames**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.searchGames`
- **Description**: Search for games in TGDB database
- **Tags**: tgdb


#### 43. **getGameImageUrls**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.getGameImageUrls`
- **Description**: Get game image URLs for a specific game
- **Tags**: tgdb


#### 44. **getGameImages**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.getGameImages`
- **Description**: Get game images by game IDs
- **Tags**: tgdb


#### 45. **getPlatforms**
- **Method**: GET
- **Path**: `/api/mobile/trpc/tgdb.getPlatforms`
- **Description**: Get available platforms from TGDB
- **Tags**: tgdb


#### 46. **userInfo**
- **Method**: GET
- **Path**: `/api/mobile/trpc/trust.userInfo`
- **Description**: Get trust info for a specific user (public)
- **Tags**: trust


#### 47. **byId**
- **Method**: GET
- **Path**: `/api/mobile/trpc/users.byId`
- **Description**: Get user profile by ID (public user profiles)
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

#### 14. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/notifications.get`
- **Description**: Get notifications with pagination
- **Tags**: notifications

- **Authentication**: Bearer token required

#### 15. **unreadCount**
- **Method**: GET
- **Path**: `/api/mobile/trpc/notifications.unreadCount`
- **Description**: Get unread notification count
- **Tags**: notifications

- **Authentication**: Bearer token required

#### 16. **markAsRead**
- **Method**: POST
- **Path**: `/api/mobile/trpc/notifications.markAsRead`
- **Description**: Mark notification as read
- **Tags**: notifications
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 17. **markAllAsRead**
- **Method**: POST
- **Path**: `/api/mobile/trpc/notifications.markAllAsRead`
- **Description**: Mark all notifications as read
- **Tags**: notifications

- **Authentication**: Bearer token required

#### 18. **create**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.create`
- **Description**: Create a new PC listing
- **Tags**: pcListings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 19. **update**
- **Method**: POST
- **Path**: `/api/mobile/trpc/pcListings.update`
- **Description**: Update a PC listing
- **Tags**: pcListings
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 20. **get**
- **Method**: GET
- **Path**: `/api/mobile/trpc/preferences.get`
- **Description**: PC Presets nested router
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 21. **update**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.update`
- **Description**: PC Presets nested router
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 22. **addDevice**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.addDevice`
- **Description**: Add device preference
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 23. **removeDevice**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.removeDevice`
- **Description**: Remove device preference
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 24. **bulkUpdateDevices**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.bulkUpdateDevices`
- **Description**: Bulk update device preferences
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 25. **bulkUpdateSocs**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.bulkUpdateSocs`
- **Description**: Bulk update SOC preferences
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 26. **currentProfile**
- **Method**: GET
- **Path**: `/api/mobile/trpc/preferences.currentProfile`
- **Description**: Get current user's profile
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 27. **profile**
- **Method**: GET
- **Path**: `/api/mobile/trpc/preferences.profile`
- **Description**: Get user profile by ID
- **Tags**: preferences

- **Authentication**: Bearer token required

#### 28. **updateProfile**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.updateProfile`
- **Description**: Update profile
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 29. **create**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.create`
- **Description**: PC Presets nested router
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 30. **delete**
- **Method**: POST
- **Path**: `/api/mobile/trpc/preferences.delete`
- **Description**: PC Presets nested router
- **Tags**: preferences
- **Request Body**: JSON object required
- **Content-Type**: application/json
- **Authentication**: Bearer token required

#### 31. **myInfo**
- **Method**: GET
- **Path**: `/api/mobile/trpc/trust.myInfo`
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
