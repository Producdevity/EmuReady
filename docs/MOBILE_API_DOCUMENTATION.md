# EmuReady Mobile API Documentation (Work in Progress)

## Overview

The EmuReady Mobile API provides comprehensive access to all mobile app functionality through TRPC endpoints. This documentation covers all available endpoints, authentication, and usage examples.

## Base URLs

- **TRPC API**: `/api/mobile/trpc/[procedure]`
- **REST API**: `/api/mobile/[endpoint]`
- **OpenAPI Spec**: `/api/docs/mobile/openapi.json`

## Authentication

Most endpoints require authentication using Clerk JWT tokens:

```
Authorization: Bearer <your-jwt-token>
```

## Quick Start

### 1. Authentication Check
```bash
curl -X POST /api/mobile/trpc/getAuthenticatedUser \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>"
```

### 2. Get Listings
```bash
curl -X POST /api/mobile/trpc/getListings \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "limit": 20,
    "search": "mario"
  }'
```

## Available Endpoints

### Public Endpoints (No Authentication Required)

#### 1. **getListings**
- **Description**: Get paginated listings with advanced filtering
- **Method**: POST
- **Parameters**:
  - `page` (number, default: 1): Page number
  - `limit` (number, default: 20, max: 50): Items per page
  - `gameId` (string): Filter by specific game
  - `systemId` (string): Filter by gaming system
  - `deviceId` (string): Filter by device
  - `emulatorId` (string): Filter by emulator
  - `search` (string): Search query
- **Response**: Paginated listings with vote status

#### 2. **getFeaturedListings**
- **Description**: Get the latest 10 featured listings
- **Method**: POST
- **Response**: Array of featured listings

#### 3. **getGames**
- **Description**: Get games with optional filtering
- **Parameters**:
  - `search` (string): Search query
  - `systemId` (string): Filter by system
  - `limit` (number, default: 20, max: 50): Number of results
- **Response**: Array of games with listing counts

#### 4. **getEmulators**
- **Description**: Get emulators with filtering
- **Parameters**:
  - `systemId` (string): Filter by supported system
  - `search` (string): Search query
  - `limit` (number, default: 50, max: 100): Number of results
- **Response**: Array of emulators with supported systems

#### 5. **getDevices**
- **Description**: Get devices with filtering
- **Parameters**:
  - `search` (string): Search query
  - `brandId` (string): Filter by brand
  - `limit` (number, default: 50, max: 100): Number of results
- **Response**: Array of devices with brand and SOC info

#### 6. **getDeviceBrands**
- **Description**: Get all device brands
- **Response**: Array of device brands

#### 7. **getSocs**
- **Description**: Get all SOCs (System on Chip)
- **Response**: Array of SOCs with manufacturer info

#### 8. **getPerformanceScales**
- **Description**: Get performance rating scales
- **Response**: Array of performance scales with rankings

#### 9. **getSystems**
- **Description**: Get all gaming systems
- **Response**: Array of gaming systems

#### 10. **getSearchSuggestions**
- **Description**: Get real-time search suggestions
- **Parameters**:
  - `query` (string): Search query
  - `limit` (number, default: 10): Number of suggestions
- **Response**: Suggestions across games, devices, and emulators

#### 11. **getGame**
- **Description**: Get detailed game information
- **Parameters**:
  - `gameId` (string): Game ID
- **Response**: Detailed game information

#### 12. **getListing**
- **Description**: Get detailed listing information
- **Parameters**:
  - `listingId` (string): Listing ID
- **Response**: Detailed listing with comments and votes

#### 13. **getAppStats**
- **Description**: Get application statistics
- **Response**: Comprehensive app statistics

### Protected Endpoints (Authentication Required)

#### 14. **getAuthenticatedUser**
- **Description**: Get current user information
- **Response**: User profile and preferences

#### 15. **getNotifications**
- **Description**: Get user notifications with pagination
- **Parameters**:
  - `page` (number, default: 1): Page number
  - `limit` (number, default: 20, max: 50): Items per page
  - `unreadOnly` (boolean, default: false): Show only unread notifications
- **Response**: Paginated notifications

#### 16. **getUnreadNotificationCount**
- **Description**: Get count of unread notifications
- **Response**: Number of unread notifications

#### 17. **markNotificationAsRead**
- **Description**: Mark a notification as read
- **Parameters**:
  - `notificationId` (string): Notification ID
- **Response**: Success confirmation

#### 18. **markAllNotificationsAsRead**
- **Description**: Mark all notifications as read
- **Response**: Success confirmation

#### 19. **getUserVote**
- **Description**: Get user's vote on a specific listing
- **Parameters**:
  - `listingId` (string): Listing ID
- **Response**: User's vote (true/false/null)

#### 20. **voteListing**
- **Description**: Vote on a listing
- **Parameters**:
  - `listingId` (string): Listing ID
  - `value` (boolean): Vote value (true for upvote, false for downvote)
- **Response**: Vote confirmation

#### 21. **createListing**
- **Description**: Create a new listing
- **Parameters**:
  - `gameId` (string): Game ID
  - `deviceId` (string): Device ID
  - `emulatorId` (string): Emulator ID
  - `performanceId` (number): Performance scale ID
  - `notes` (string): Optional notes
  - `customFieldValues` (array): Custom field values
- **Response**: Created listing

#### 22. **updateListing**
- **Description**: Update an existing listing
- **Parameters**: Same as createListing plus:
  - `listingId` (string): Listing ID to update
- **Response**: Updated listing

#### 23. **deleteListing**
- **Description**: Delete a listing
- **Parameters**:
  - `listingId` (string): Listing ID
- **Response**: Success confirmation

#### 24. **createComment**
- **Description**: Add a comment to a listing
- **Parameters**:
  - `listingId` (string): Listing ID
  - `content` (string): Comment content
- **Response**: Created comment

#### 25. **updateComment**
- **Description**: Update a comment
- **Parameters**:
  - `commentId` (string): Comment ID
  - `content` (string): Updated content
- **Response**: Updated comment

#### 26. **deleteComment**
- **Description**: Delete a comment
- **Parameters**:
  - `commentId` (string): Comment ID
- **Response**: Success confirmation

#### 27. **getUserListings**
- **Description**: Get current user's listings
- **Parameters**:
  - `page` (number, default: 1): Page number
  - `limit` (number, default: 20): Items per page
- **Response**: Paginated user listings

#### 28. **getUserProfile**
- **Description**: Get user profile by ID
- **Parameters**:
  - `userId` (string): User ID
- **Response**: User profile information

#### 29. **getUserPreferences**
- **Description**: Get user device and SOC preferences
- **Response**: User preferences

#### 30. **updateUserPreferences**
- **Description**: Update user preferences
- **Parameters**:
  - `deviceIds` (array): Preferred device IDs
  - `socIds` (array): Preferred SOC IDs
- **Response**: Updated preferences

## Response Formats

### Listing Object
```typescript
{
  id: string
  notes: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  game: {
    id: string
    title: string
    imageUrl: string | null
    system: { id: string, name: string }
  }
  device: {
    id: string
    modelName: string
    brand: { id: string, name: string }
    soc: { id: string, name: string, manufacturer: string }
  }
  emulator: {
    id: string
    name: string
    logo: string | null
  }
  performance: {
    id: string
    label: string
    rank: number
  }
  author: {
    id: string
    name: string | null
  }
  _count: {
    votes: number
    comments: number
  }
  successRate: number
  userVote?: boolean | null
}
```

### Pagination Object
```typescript
{
  total: number
  pages: number
  currentPage: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
```

## Error Handling

All endpoints return consistent error responses:

```typescript
{
  error: string
  code: string
  message: string
}
```

Common error codes:
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: User lacks permission
- `NOT_FOUND`: Resource not found
- `BAD_REQUEST`: Invalid input parameters
- `INTERNAL_SERVER_ERROR`: Server error

## Rate Limiting

- Public endpoints: 100 requests per minute
- Authenticated endpoints: 200 requests per minute
- Search endpoints: 50 requests per minute

## SDKs and Tools

### Using with React Query (Recommended)
```typescript
import { useQuery } from '@tanstack/react-query'

const useListings = (params: GetListingsParams) => {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => api.mobile.getListings(params),
  })
}
```

### Direct Fetch Example
```typescript
const getListings = async (params: GetListingsParams) => {
  const response = await fetch('/api/mobile/trpc/getListings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })
  
  return response.json()
}
```

## Interactive Documentation

For interactive API testing, visit: `/docs/mobile-api/swagger`

## OpenAPI Specification

Download the complete OpenAPI 3.0 specification: `/api/docs/mobile/openapi.json`

## Support

For API support and questions:
- GitHub Issues: [Create an issue](https://github.com/your-org/emuready/issues)
- Documentation: [Contributing Guidelines](../CONTRIBUTING.md)

## Changelog

- **v1.0.0**: Initial mobile API release with 30 endpoints
- Comprehensive CRUD operations for listings and comments
- Advanced filtering and search capabilities
- Real-time notifications system
- User preference management
- Performance analytics integration 
