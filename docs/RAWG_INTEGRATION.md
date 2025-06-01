# RAWG.io Game Image Integration

This document describes the RAWG.io integration feature that allows users to select game cover images directly from the RAWG.io game database.

## Overview

The RAWG.io integration provides:
- Automatic game image search based on game titles  
- Intuitive UI for selecting from multiple image options
- Both cover art and screenshot options with preview functionality
- Secure server-side API key handling
- Seamless integration with the existing game creation flow

## Setup

### 1. API Key Configuration

Add your RAWG.io API key to your environment variables:

```bash
# .env.local or .env
RAWG_API_KEY="your-rawg-api-key-here"
```

You can get a free API key from [RAWG.io](https://rawg.io/apidocs).

### 2. Environment Security

⚠️ **Important**: The RAWG API key is kept secure on the server side only. It's never exposed to the client.

## Architecture

### Components

1. **RAWG Functions** (`src/server/rawg.ts`)
   - Server-side functions for RAWG.io API interactions
   - Handles game search, image fetching, and error management
   - Implements proper error handling with functional approach

2. **RAWG Utilities** (`src/lib/rawg-utils.ts`)
   - Client-side utility functions for image validation and display names
   - Shared helper functions for both client and server

3. **RawgImageSelector** (`src/components/ui/RawgImageSelector.tsx`)
   - Client-side React component for image selection
   - Modern UI with search, tooltips, and image preview modal
   - Uses Input component for consistent styling

4. **tRPC Router** (`src/server/api/routers/rawg.ts`)
   - Secure API endpoints for RAWG functionality
   - Uses extracted schemas and consistent error handling

5. **Type Definitions** (`src/types/rawg.ts`)
   - Complete TypeScript types for RAWG.io API responses
   - Type-safe integration throughout the codebase

6. **Schemas** (`src/schemas/rawg.ts`)
   - Input validation schemas for all RAWG endpoints
   - Centralized schema definitions following codebase patterns

### Data Flow

```
User types game title
    ↓
RawgImageSelector sends search request
    ↓
tRPC rawg.searchGameImages endpoint
    ↓
Server RAWG functions (searchGameImages, etc.)
    ↓
RAWG.io API calls (games + screenshots)
    ↓
Aggregated image options returned
    ↓
UI displays images with preview functionality
    ↓
User selects an image (with optional preview)
    ↓
Image URL processed through image proxy
    ↓
Image URL stored in database
```

## Usage

### In Game Creation Form

```tsx
import { RawgImageSelector, Input } from '@/components/ui'

function GameForm() {
  const [gameTitle, setGameTitle] = useState('')
  const [selectedImageUrl, setSelectedImageUrl] = useState('')

  return (
    <form>
      <Input
        value={gameTitle}
        onChange={(e) => setGameTitle(e.target.value)}
        placeholder="Game title"
      />
      
      <RawgImageSelector
        gameTitle={gameTitle}
        selectedImageUrl={selectedImageUrl}
        onImageSelect={setSelectedImageUrl}
        onError={(error) => console.error(error)}
      />
    </form>
  )
}
```

### API Usage

```tsx
// Using the tRPC client
const { data, error, isLoading } = api.rawg.searchGameImages.useQuery({
  query: 'Super Mario Bros'
})

// Data structure returned:
// {
//   "1": [
//     {
//       id: "1-background",
//       url: "https://media.rawg.io/media/...",
//       type: "background",
//       source: "rawg",
//       gameId: 1,
//       gameName: "Super Mario Bros",
//       width: 1920,
//       height: 1080
//     }
//   ]
// }
```

## Features

### Image Search
- Searches RAWG.io database for games matching the title
- Fetches both cover art (background images) and screenshots
- Aggregates images from multiple matching games
- All images processed through app's image proxy system

### User Experience
- **Auto-search**: Automatically searches when a game title is provided
- **Manual search**: Users can refine search terms with modern Input component
- **Image tooltips**: Hover over truncated game names to see full titles
- **Preview modal**: Click eye icon to see larger image preview with metadata
- **Visual feedback**: Loading states, animations, and error messages
- **Responsive design**: Works on all screen sizes
- **Accessibility**: Proper labels, keyboard navigation, and screen reader support

### Error Handling
- Consistent error handling using `AppError.internalError()`
- Network timeouts and retries
- API rate limiting respect
- Graceful fallbacks for missing images
- User-friendly error messages

## Testing

The integration includes comprehensive tests:

```bash
# Run RAWG service tests
npm test src/server/rawg.test.ts

# Run all tests
npm test
```

Test coverage includes:
- API key validation
- Game search functionality
- Image aggregation logic
- Error scenarios
- Network failure handling
- Functional approach testing

## Configuration Options

### RawgImageSelector Props

```tsx
interface RawgImageSelectorProps {
  gameTitle?: string          // Pre-fill search with game title
  selectedImageUrl?: string   // Currently selected image URL
  onImageSelect: (url: string) => void  // Callback when image is selected
  onError?: (error: string) => void     // Error handling callback
  className?: string          // Additional CSS classes
}
```

## Performance Considerations

### Caching
- API responses are cached on the client side (5 minute stale time)
- Images are lazy-loaded for better performance
- Debounced search (500ms) to reduce API calls

### Image Processing
- All external images processed through `/api/proxy-image` endpoint
- Handles CORS issues and provides consistent image loading
- Uses OptimizedImage component for Next.js optimization

### Optimization
- Images are optimized for web display
- Progressive loading with placeholders
- Efficient memory usage

## Security

### API Key Protection
- API key is never exposed to the client
- Server-side only access to RAWG.io API
- Environment variable validation

### Input Validation
- All user inputs validated using Zod schemas
- Search queries are sanitized and limited
- XSS protection on image URLs

### Error Information
- Error messages don't expose sensitive information
- Detailed errors are logged server-side only
- User sees sanitized error messages

## Recent Improvements

- ✅ **Functional Architecture**: Converted from class-based to functional approach
- ✅ **Image Preview**: Added modal preview with eye icon and image metadata
- ✅ **Tooltips**: Added hover tooltips for truncated game names
- ✅ **Component Consistency**: Uses app's Input component for consistent styling
- ✅ **Error Handling**: Standardized error handling across all endpoints
- ✅ **Schema Extraction**: Centralized input validation schemas
- ✅ **Image Proxy**: All images routed through app's proxy system

## Contributing

When contributing to the RAWG integration:

1. Ensure all changes maintain type safety
2. Add appropriate tests for new functionality  
3. Update documentation for API changes
4. Follow the functional programming patterns established
5. Test with various game titles and edge cases
6. Use consistent Input components and styling patterns

## License

This integration respects RAWG.io's terms of service and API usage guidelines. 