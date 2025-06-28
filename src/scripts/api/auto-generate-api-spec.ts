import { mobileRouter } from '@/server/api/routers/mobile'
// Note: mobileSchemas available for future schema generation enhancements
// import { mobileSchemas } from '@/schemas/mobile'

// Define proper types instead of using any
interface ProcedureDefinition {
  type: 'query' | 'mutation'
  input?: unknown
  output?: unknown
  meta?: {
    openapi?: {
      method: string
      path: string
      tags?: string[]
      summary?: string
      description?: string
    }
  }
}

interface RouterDefinition {
  procedures: Record<string, ProcedureDefinition>
}

// Metadata for each procedure - used to enhance auto-generated spec
const procedureMetadata: Record<
  string,
  {
    summary: string
    description: string
    tags: string[]
    isPublic?: boolean
  }
> = {
  getListings: {
    summary: 'Get paginated listings with filters',
    description:
      'Retrieve listings with advanced filtering and pagination support',
    tags: ['Listings'],
    isPublic: true,
  },
  getFeaturedListings: {
    summary: 'Get featured listings',
    description: 'Retrieve the latest 10 featured listings',
    tags: ['Listings'],
    isPublic: true,
  },
  getGames: {
    summary: 'Get games with filtering',
    description: 'Retrieve games with optional search and system filtering',
    tags: ['Games'],
    isPublic: true,
  },
  getPopularGames: {
    summary: 'Get popular games',
    description: 'Retrieve the most popular games based on listing count',
    tags: ['Games'],
    isPublic: true,
  },
  getAppStats: {
    summary: 'Get application statistics',
    description: 'Get comprehensive application statistics',
    tags: ['Statistics'],
    isPublic: true,
  },
  getEmulators: {
    summary: 'Get emulators',
    description: 'Retrieve emulators with optional filtering',
    tags: ['Emulators'],
    isPublic: true,
  },
  getDevices: {
    summary: 'Get devices',
    description: 'Retrieve devices with optional filtering',
    tags: ['Devices'],
    isPublic: true,
  },
  getDeviceBrands: {
    summary: 'Get device brands',
    description: 'Retrieve all device brands',
    tags: ['Devices'],
    isPublic: true,
  },
  getSocs: {
    summary: 'Get SOCs',
    description: 'Retrieve all SOCs (System on Chip)',
    tags: ['Devices'],
    isPublic: true,
  },
  getPerformanceScales: {
    summary: 'Get performance scales',
    description: 'Retrieve performance rating scales',
    tags: ['Performance'],
    isPublic: true,
  },
  getSystems: {
    summary: 'Get gaming systems',
    description: 'Retrieve all gaming systems',
    tags: ['Systems'],
    isPublic: true,
  },
  getSearchSuggestions: {
    summary: 'Get search suggestions',
    description:
      'Get real-time search suggestions across games, devices, and emulators',
    tags: ['Search'],
    isPublic: true,
  },
  getNotifications: {
    summary: 'Get user notifications',
    description: 'Get user notifications with pagination',
    tags: ['Notifications'],
  },
  getUnreadNotificationCount: {
    summary: 'Get unread notification count',
    description: 'Get count of unread notifications for current user',
    tags: ['Notifications'],
  },
  markNotificationAsRead: {
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read',
    tags: ['Notifications'],
  },
  markAllNotificationsAsRead: {
    summary: 'Mark all notifications as read',
    description: 'Mark all notifications as read for current user',
    tags: ['Notifications'],
  },
  getUserVote: {
    summary: 'Get user vote',
    description: "Get user's vote on a specific listing",
    tags: ['Voting'],
  },
  getUserPreferences: {
    summary: 'Get user preferences',
    description: 'Get user device and SOC preferences',
    tags: ['User'],
  },
  getListingsByGame: {
    summary: 'Get listings by game',
    description: 'Get all listings for a specific game',
    tags: ['Listings'],
    isPublic: true,
  },
  searchGames: {
    summary: 'Search games',
    description: 'Search games by title with text matching',
    tags: ['Games', 'Search'],
    isPublic: true,
  },
  getGameById: {
    summary: 'Get game by ID',
    description: 'Get detailed game information by ID',
    tags: ['Games'],
    isPublic: true,
  },
  getListingComments: {
    summary: 'Get listing comments',
    description: 'Get all comments for a specific listing',
    tags: ['Comments'],
    isPublic: true,
  },
  createComment: {
    summary: 'Create comment',
    description: 'Add a comment to a listing',
    tags: ['Comments'],
  },
  voteListing: {
    summary: 'Vote on listing',
    description: 'Cast or update a vote on a listing',
    tags: ['Voting'],
  },
  getUserProfile: {
    summary: 'Get user profile',
    description: 'Get user profile information by ID',
    tags: ['User'],
  },
  getUserListings: {
    summary: 'Get user listings',
    description: 'Get listings created by the current user',
    tags: ['Listings', 'User'],
  },
  getListingById: {
    summary: 'Get listing by ID',
    description:
      'Get detailed listing information by ID with custom fields and stats',
    tags: ['Listings'],
    isPublic: true,
  },
  createListing: {
    summary: 'Create listing',
    description: 'Create a new emulation listing',
    tags: ['Listings'],
  },
  updateListing: {
    summary: 'Update listing',
    description: 'Update an existing listing',
    tags: ['Listings'],
  },
  deleteListing: {
    summary: 'Delete listing',
    description: 'Delete a listing',
    tags: ['Listings'],
  },
  updateComment: {
    summary: 'Update comment',
    description: 'Update an existing comment',
    tags: ['Comments'],
  },
  deleteComment: {
    summary: 'Delete comment',
    description: 'Delete a comment',
    tags: ['Comments'],
  },
  updateProfile: {
    summary: 'Update user profile',
    description: 'Update current user profile information',
    tags: ['User'],
  },

  updateUserPreferences: {
    summary: 'Update user preferences',
    description: 'Update user device and SOC preferences',
    tags: ['User'],
  },
  'auth.login': {
    summary: 'User Login',
    description: 'Authenticate user with email and password',
    tags: ['Authentication'],
    isPublic: true,
  },
  'auth.register': {
    summary: 'User Registration',
    description: 'Register a new user account',
    tags: ['Authentication'],
    isPublic: true,
  },
  'auth.logout': {
    summary: 'User Logout',
    description: 'Logout current user and invalidate session',
    tags: ['Authentication'],
  },
  'auth.refreshToken': {
    summary: 'Refresh Token',
    description: 'Refresh authentication token',
    tags: ['Authentication'],
    isPublic: true,
  },
  'auth.getProfile': {
    summary: 'Get User Profile',
    description: 'Get current user profile information',
    tags: ['Authentication'],
  },
  'listings.getAll': {
    summary: 'Get All Listings',
    description: 'Retrieve paginated list of game listings with filters',
    tags: ['Listings'],
    isPublic: true,
  },
  'listings.getById': {
    summary: 'Get Listing by ID',
    description: 'Retrieve detailed information about a specific listing',
    tags: ['Listings'],
    isPublic: true,
  },
  'listings.create': {
    summary: 'Create Listing',
    description: 'Create a new game listing',
    tags: ['Listings'],
  },
  'listings.update': {
    summary: 'Update Listing',
    description: 'Update an existing listing',
    tags: ['Listings'],
  },
  'listings.delete': {
    summary: 'Delete Listing',
    description: 'Delete a listing',
    tags: ['Listings'],
  },
  'listings.getByUserId': {
    summary: 'Get User Listings',
    description: 'Get all listings created by a specific user',
    tags: ['Listings'],
    isPublic: true,
  },
  'games.getAll': {
    summary: 'Get All Games',
    description: 'Retrieve paginated list of games with filters',
    tags: ['Games'],
    isPublic: true,
  },
  'games.getById': {
    summary: 'Get Game by ID',
    description: 'Retrieve detailed information about a specific game',
    tags: ['Games'],
    isPublic: true,
  },
  'games.search': {
    summary: 'Search Games',
    description: 'Search for games by title or other criteria',
    tags: ['Games'],
    isPublic: true,
  },
  'devices.getAll': {
    summary: 'Get All Devices',
    description: 'Retrieve list of all supported devices',
    tags: ['Devices'],
    isPublic: true,
  },
  'devices.getById': {
    summary: 'Get Device by ID',
    description: 'Retrieve detailed information about a specific device',
    tags: ['Devices'],
    isPublic: true,
  },
  'emulators.getAll': {
    summary: 'Get All Emulators',
    description: 'Retrieve list of all emulators',
    tags: ['Emulators'],
    isPublic: true,
  },
  'emulators.getById': {
    summary: 'Get Emulator by ID',
    description: 'Retrieve detailed information about a specific emulator',
    tags: ['Emulators'],
    isPublic: true,
  },
  'systems.getAll': {
    summary: 'Get All Systems',
    description: 'Retrieve list of all gaming systems',
    tags: ['Systems'],
    isPublic: true,
  },
  'systems.getById': {
    summary: 'Get System by ID',
    description: 'Retrieve detailed information about a specific system',
    tags: ['Systems'],
    isPublic: true,
  },
  'performance.getBenchmarks': {
    summary: 'Get Performance Benchmarks',
    description: 'Retrieve performance benchmark data',
    tags: ['Performance'],
    isPublic: true,
  },
  'notifications.getAll': {
    summary: 'Get User Notifications',
    description: 'Retrieve all notifications for the current user',
    tags: ['Notifications'],
  },
  'notifications.markAsRead': {
    summary: 'Mark Notification as Read',
    description: 'Mark a specific notification as read',
    tags: ['Notifications'],
  },
  'notifications.markAllAsRead': {
    summary: 'Mark All Notifications as Read',
    description: 'Mark all notifications as read for the current user',
    tags: ['Notifications'],
  },
  'votes.create': {
    summary: 'Create Vote',
    description: 'Vote on a listing (upvote/downvote)',
    tags: ['Voting'],
  },
  'votes.update': {
    summary: 'Update Vote',
    description: 'Update an existing vote',
    tags: ['Voting'],
  },
  'votes.delete': {
    summary: 'Delete Vote',
    description: 'Remove a vote from a listing',
    tags: ['Voting'],
  },
  'comments.getByListingId': {
    summary: 'Get Listing Comments',
    description: 'Retrieve all comments for a specific listing',
    tags: ['Comments'],
    isPublic: true,
  },
  'comments.create': {
    summary: 'Create Comment',
    description: 'Add a comment to a listing',
    tags: ['Comments'],
  },
  'comments.update': {
    summary: 'Update Comment',
    description: 'Update an existing comment',
    tags: ['Comments'],
  },
  'comments.delete': {
    summary: 'Delete Comment',
    description: 'Delete a comment',
    tags: ['Comments'],
  },
  'user.getProfile': {
    summary: 'Get User Profile',
    description: 'Get detailed user profile information',
    tags: ['User'],
  },
  'user.updateProfile': {
    summary: 'Update User Profile',
    description: 'Update user profile information',
    tags: ['User'],
  },
  'user.getPreferences': {
    summary: 'Get User Preferences',
    description: 'Get user preferences and settings',
    tags: ['User'],
  },
  'user.updatePreferences': {
    summary: 'Update User Preferences',
    description: 'Update user preferences and settings',
    tags: ['User'],
  },
  'search.global': {
    summary: 'Global Search',
    description: 'Search across all content types',
    tags: ['Search'],
    isPublic: true,
  },
  'stats.getGlobal': {
    summary: 'Get Global Statistics',
    description: 'Retrieve platform-wide statistics',
    tags: ['Statistics'],
    isPublic: true,
  },
}

export function generateOpenAPISpec() {
  // Get router definition with proper typing
  const routerDef = (mobileRouter as unknown as { _def: RouterDefinition })._def
  const procedures = routerDef.procedures

  const paths: Record<string, Record<string, unknown>> = {}

  // Add REST endpoints first
  // Health endpoint
  paths['/api/health'] = {
    get: {
      tags: ['Health'],
      summary: 'Server health check',
      description:
        'Returns the current health status of the server and its dependencies',
      responses: {
        '200': {
          description: 'Server is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['healthy', 'unhealthy'],
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                  uptime: {
                    type: 'number',
                    description: 'Server uptime in seconds',
                  },
                  version: {
                    type: 'string',
                    description: 'Application version',
                  },
                  environment: {
                    type: 'string',
                    description: 'Current environment',
                  },
                  services: {
                    type: 'object',
                    properties: {
                      database: {
                        type: 'object',
                        properties: {
                          status: {
                            type: 'string',
                            enum: ['connected', 'disconnected'],
                          },
                          latency: {
                            type: 'number',
                            description: 'Database response time in ms',
                          },
                        },
                      },
                      auth: {
                        type: 'object',
                        properties: {
                          status: {
                            type: 'string',
                            enum: ['available', 'unavailable'],
                          },
                        },
                      },
                    },
                  },
                  system: {
                    type: 'object',
                    properties: {
                      memory: {
                        type: 'object',
                        properties: {
                          used: {
                            type: 'number',
                          },
                          total: {
                            type: 'number',
                          },
                          percentage: {
                            type: 'number',
                          },
                        },
                      },
                      nodeVersion: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '503': {
          description: 'Server is unhealthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['unhealthy'],
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                  error: {
                    type: 'string',
                    description: 'Error message',
                  },
                },
              },
            },
          },
        },
      },
      security: [], // Public endpoint
    },
  }

  // Generate paths for each TRPC procedure
  Object.entries(procedures).forEach(([procedureName, _procedureDef]) => {
    const metadata = procedureMetadata[procedureName]
    if (!metadata) return

    // Note: _procedureDef.type could be used for future query/mutation differentiation
    const path = `/api/mobile/trpc/${procedureName}`

    if (!paths[path]) {
      paths[path] = {}
    }

    paths[path]['post'] = {
      tags: metadata.tags,
      summary: metadata.summary,
      description: metadata.description,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                input: {
                  type: 'object',
                  description: 'Input parameters for the procedure',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  result: {
                    type: 'object',
                    description: 'Procedure result data',
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad Request',
        },
        '401': {
          description: 'Unauthorized',
        },
        '500': {
          description: 'Internal Server Error',
        },
      },
      security: metadata.isPublic ? [] : [{ BearerAuth: [] }],
    }
  })

  return {
    openapi: '3.0.0',
    info: {
      title: 'EmuReady Mobile API',
      description:
        'Mobile API for the EmuReady platform - A comprehensive emulation configuration sharing platform',
      version: '1.0.0',
      contact: {
        name: 'EmuReady Support',
        url: 'https://emuready.com',
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://emuready.com'
            : 'http://localhost:3000',
        description:
          process.env.NODE_ENV === 'production'
            ? 'Production server'
            : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from Clerk authentication',
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Server health monitoring and status checks',
      },
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      { name: 'Listings', description: 'Game configuration listings' },
      { name: 'Games', description: 'Game information and metadata' },
      { name: 'Devices', description: 'Supported gaming devices' },
      {
        name: 'Emulators',
        description: 'Emulator information and configuration',
      },
      { name: 'Systems', description: 'Gaming system information' },
      {
        name: 'Performance',
        description: 'Performance benchmarks and metrics',
      },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Voting', description: 'Listing voting system' },
      { name: 'Comments', description: 'Listing comments and discussions' },
      { name: 'User', description: 'User profile and preferences' },
      { name: 'Search', description: 'Search functionality' },
      { name: 'Statistics', description: 'Platform statistics' },
    ],
    paths,
  }
}
