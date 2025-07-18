import { type SortDirection } from '@/types/api'
import { type RouterInput } from '@/types/trpc'
import { type Role } from '@orm'
import {
  ADMIN_ACTIONS,
  ANALYTICS_CATEGORIES,
  CONTENT_DISCOVERY_ACTIONS,
  CONTENT_QUALITY_ACTIONS,
  CONVERSION_ACTIONS,
  ENGAGEMENT_ACTIONS,
  ERROR_ACTIONS,
  FILTER_ACTIONS,
  LISTING_ACTIONS,
  NAVIGATION_ACTIONS,
  PERFORMANCE_ACTIONS,
  SESSION_ACTIONS,
  TRUST_ACTIONS_ANALYTICS,
  USER_ACTIONS,
  USER_JOURNEY_ACTIONS,
} from './actions'
import { type EngagementAction } from './analytics.types'
import { sendAnalyticsEvent, filterUndefinedValues } from './utils'

// Main analytics object with typesafe methods
const analytics = {
  error: {
    imageLoadError: (params: {
      imageUrl: string
      error?: Error
      id?: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ERROR,
        action: ERROR_ACTIONS.IMAGE_LOAD_ERROR,
        value: params.imageUrl,
        metadata: {
          error: params.error?.message ?? 'unknown',
          id: params.id ?? 'unknown',
        },
      })
    },
  },

  // Filter events
  filter: {
    sort: (sortField: string | RouterInput['listings']['get']['sortField']) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.SORT,
        value: sortField || 'none',
        metadata: { field: sortField || 'none' },
      })
    },

    page: ({ prevPage, nextPage }: { prevPage: number; nextPage: number }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.PAGE,
        value: nextPage,
        metadata: { prevPage, nextPage },
      })
    },

    myListings: (isMyListings: boolean) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.MY_LISTINGS,
        value: isMyListings.toString(),
        metadata: { isMyListings },
      })
    },

    system: (systemIds: string[], systemNames?: string[]) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.SYSTEM,
        value: systemIds.length.toString(),
        metadata: {
          count: systemIds.length,
          systems: systemNames?.join(',') || systemIds.join(','),
        },
      })
    },

    device: (deviceIds: string[], deviceNames?: string[]) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.DEVICE,
        value: deviceIds.length.toString(),
        metadata: {
          count: deviceIds.length,
          devices: deviceNames?.join(',') || deviceIds.join(','),
        },
      })
    },

    soc: (socIds: string[], socNames?: string[]) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.SOC,
        value: socIds.length.toString(),
        metadata: {
          count: socIds.length,
          socs: socNames?.join(',') || socIds.join(','),
        },
      })
    },

    emulator: (emulatorIds: string[], emulatorNames?: string[]) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.EMULATOR,
        value: emulatorIds.length.toString(),
        metadata: {
          count: emulatorIds.length,
          emulators: emulatorNames?.join(',') || emulatorIds.join(','),
        },
      })
    },

    performance: (performanceIds: number[], performanceLabels?: string[]) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.PERFORMANCE,
        value: performanceIds.length.toString(),
        metadata: {
          count: performanceIds.length,
          levels: performanceLabels?.join(',') || performanceIds.join(','),
        },
      })
    },

    search: (searchTerm: string) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.SEARCH,
        value: searchTerm.length.toString(),
        metadata: {
          hasSearchTerm: searchTerm.length > 0,
          searchLength: searchTerm.length,
        },
      })
    },

    listingsCombined: (params: {
      systemIds?: string[] | null
      search?: string | null
      page?: number | null
      deviceIds?: string[] | null
      socIds?: string[] | null
      emulatorIds?: string[] | null
      performanceIds?: number[] | null
      sortField?: RouterInput['listings']['get']['sortField'] | null
      sortDirection?: SortDirection | null
      myListings?: boolean | null
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.LISTINGS_COMBINED,
        metadata: filterUndefinedValues({
          sortField: params.sortField || 'none',
          page: params.page?.toString() || '1',
          myListings: params.myListings?.toString() || 'false',
          systemIds: params.systemIds?.join(',') || 'none',
          systemCount: params.systemIds?.length.toString() || '0',
          deviceIds: params.deviceIds?.join(',') || 'none',
          deviceCount: params.deviceIds?.length.toString() || '0',
          socIds: params.socIds?.join(',') || 'none',
          socCount: params.socIds?.length.toString() || '0',
          emulatorIds: params.emulatorIds?.join(',') || 'none',
          emulatorCount: params.emulatorIds?.length.toString() || '0',
          performanceIds: params.performanceIds?.join(',') || 'none',
          performanceCount: params.performanceIds?.length.toString() || '0',
          search: params.search || 'none',
        }),
      })
    },

    pcListingsCombined: (params: {
      page: number
      search: string
      cpuIds: string[]
      gpuIds: string[]
      systemIds: string[]
      performanceIds: number[]
      emulatorIds: string[]
      minMemory: number | null
      maxMemory: number | null
      sortField: RouterInput['pcListings']['get']['sortField']
      sortDirection: SortDirection | null
      myListings: boolean
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.PC_LISTINGS_COMBINED,
        metadata: filterUndefinedValues({
          sortField: params.sortField || 'none',
          page: params.page?.toString() || '1',
          myListings: params.myListings?.toString() || 'false',
          systemIds: params.systemIds?.join(',') || 'none',
          systemCount: params.systemIds?.length.toString() || '0',
          emulatorIds: params.emulatorIds?.join(',') || 'none',
          emulatorCount: params.emulatorIds?.length.toString() || '0',
          performanceIds: params.performanceIds?.join(',') || 'none',
          performanceCount: params.performanceIds?.length.toString() || '0',
          cpuIds: params.cpuIds?.join(',') || 'none',
          cpuCount: params.cpuIds?.length.toString() || '0',
          gpuIds: params.gpuIds?.join(',') || 'none',
          gpuCount: params.gpuIds?.length.toString() || '0',
          minMemory: params.minMemory?.toString() || 'none',
          maxMemory: params.maxMemory?.toString() || 'none',
          search: params.search || 'none',
        }),
      })
    },

    clearAll: () => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.CLEAR_ALL,
      })
    },

    clearDeviceFilter: () => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.CLEAR_DEVICE_FILTER,
      })
    },

    clearSocFilter: () => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.CLEAR_SOC_FILTER,
      })
    },

    clearSystemFilter: () => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.CLEAR_SYSTEM_FILTER,
      })
    },

    clearEmulatorFilter: () => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.FILTER,
        action: FILTER_ACTIONS.CLEAR_EMULATOR_FILTER,
      })
    },
  },

  // Engagement events
  engagement: {
    vote: (params: {
      listingId: string
      voteValue: boolean | null // true = up, false = down, null = removed
      previousVote?: boolean | null
      gameId?: string
      systemId?: string
      emulatorId?: string
      deviceId?: string
    }) => {
      const { listingId, voteValue, previousVote, ...metadata } = params

      let action: EngagementAction
      if (voteValue === null) {
        action = ENGAGEMENT_ACTIONS.VOTE_REMOVED
      } else if (voteValue) {
        action = ENGAGEMENT_ACTIONS.VOTE_UP
      } else {
        action = ENGAGEMENT_ACTIONS.VOTE_DOWN
      }

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action,
        entityType: 'listing',
        entityId: listingId,
        metadata: {
          ...metadata,
          previousVote: previousVote?.toString() || 'none',
          voteChanged: previousVote !== voteValue,
        },
      })
    },

    commentVote: (params: {
      commentId: string
      voteValue: boolean | null
      previousVote?: boolean | null
      listingId?: string
    }) => {
      const { commentId, voteValue, previousVote, ...metadata } = params

      let action: EngagementAction
      if (voteValue === null) {
        action = ENGAGEMENT_ACTIONS.VOTE_REMOVED
      } else if (voteValue) {
        action = ENGAGEMENT_ACTIONS.COMMENT_VOTE_UP
      } else {
        action = ENGAGEMENT_ACTIONS.COMMENT_VOTE_DOWN
      }

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action,
        entityType: 'comment',
        entityId: commentId,
        metadata: {
          ...metadata,
          previousVote: previousVote?.toString() || 'none',
          voteChanged: previousVote !== voteValue,
        },
      })
    },

    comment: (params: {
      action: 'created' | 'edited' | 'deleted' | 'reply'
      commentId: string
      listingId: string
      isReply?: boolean
      contentLength?: number
      gameId?: string
      systemId?: string
    }) => {
      const { action, commentId, listingId, ...metadata } = params

      let analyticsAction: EngagementAction
      switch (action) {
        case 'created':
          analyticsAction = ENGAGEMENT_ACTIONS.COMMENT_CREATED
          break
        case 'reply':
          analyticsAction = ENGAGEMENT_ACTIONS.COMMENT_REPLY
          break
        case 'edited':
          analyticsAction = ENGAGEMENT_ACTIONS.COMMENT_EDITED
          break
        case 'deleted':
          analyticsAction = ENGAGEMENT_ACTIONS.COMMENT_DELETED
          break
      }

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action: analyticsAction,
        entityType: 'comment',
        entityId: commentId,
        metadata: {
          listingId,
          ...metadata,
        },
      })
    },

    view: (params: {
      entityType: 'listing' | 'game' | 'user'
      entityId: string
      referrer?: string
      systemId?: string
      emulatorId?: string
      deviceId?: string
    }) => {
      const { entityType, entityId, ...metadata } = params

      let action: EngagementAction
      switch (entityType) {
        case 'listing':
          action = ENGAGEMENT_ACTIONS.LISTING_VIEW
          break
        case 'game':
          action = ENGAGEMENT_ACTIONS.GAME_VIEW
          break
        case 'user':
          action = ENGAGEMENT_ACTIONS.USER_PROFILE_VIEW
          break
      }

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action,
        entityType,
        entityId,
        metadata,
      })
    },

    voteReminderShown: (params: { listingId: string; timeOnPage: number }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action: ENGAGEMENT_ACTIONS.VOTE_REMINDER_SHOWN,
        entityType: 'listing',
        entityId: params.listingId,
        metadata: {
          timeOnPage: params.timeOnPage,
        },
      })
    },

    voteReminderClicked: (params: {
      listingId: string
      timeOnPage: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action: ENGAGEMENT_ACTIONS.VOTE_REMINDER_CLICKED,
        entityType: 'listing',
        entityId: params.listingId,
        metadata: {
          timeOnPage: params.timeOnPage,
        },
      })
    },

    stopKillingGamesDismissed: (params: { timeOnPage: number }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action: ENGAGEMENT_ACTIONS.STOP_KILLING_GAMES_DISMISSED,
        entityType: 'popup',
        metadata: {
          timeOnPage: params.timeOnPage,
        },
      })
    },

    stopKillingGamesCTA: (params: { timeOnPage: number }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action: ENGAGEMENT_ACTIONS.STOP_KILLING_GAMES_CTA,
        entityType: 'popup',
        metadata: {
          timeOnPage: params.timeOnPage,
        },
      })
    },

    voteReminderDismissed: (params: {
      listingId: string
      timeOnPage: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ENGAGEMENT,
        action: ENGAGEMENT_ACTIONS.VOTE_REMINDER_DISMISSED,
        entityType: 'popup',
        entityId: params.listingId,
        metadata: {
          timeOnPage: params.timeOnPage,
        },
      })
    },
  },

  // Listing events
  listing: {
    created: (params: {
      listingId?: string
      gameId?: string
      systemId?: string
      emulatorId?: string
      deviceId?: string
      performanceId?: number
      hasCustomFields?: boolean
      customFieldCount?: number
    }) => {
      const { listingId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.LISTING,
        action: LISTING_ACTIONS.CREATED,
        listingId,
        metadata,
      })
    },

    edited: (params: {
      listingId: string
      fieldsChanged: string[]
      gameId?: string
      systemId?: string
    }) => {
      const { listingId, fieldsChanged, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.LISTING,
        action: LISTING_ACTIONS.EDITED,
        listingId,
        metadata: {
          ...metadata,
          fieldsChanged: fieldsChanged.join(','),
          fieldCount: fieldsChanged.length,
        },
      })
    },

    deleted: (params: {
      listingId: string
      gameId?: string
      systemId?: string
      reason?: string
    }) => {
      const { listingId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.LISTING,
        action: LISTING_ACTIONS.DELETED,
        listingId,
        metadata,
      })
    },

    approved: (params: {
      listingId: string
      gameId?: string
      systemId?: string
      approvedBy?: string
    }) => {
      const { listingId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.LISTING,
        action: LISTING_ACTIONS.APPROVED,
        listingId,
        metadata,
      })
    },

    rejected: (params: {
      listingId: string
      gameId?: string
      systemId?: string
      rejectedBy?: string
      reason?: string
    }) => {
      const { listingId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.LISTING,
        action: LISTING_ACTIONS.REJECTED,
        listingId,
        metadata,
      })
    },
  },

  // User events
  user: {
    signedUp: (params: {
      userId: string
      method?: 'clerk' | 'google' | 'email'
      referrer?: string
    }) => {
      const { userId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER,
        action: USER_ACTIONS.SIGNED_UP,
        userId,
        metadata,
      })
    },

    // TODO
    signedIn: (params: {
      userId: string
      method?: 'clerk' | 'google' | 'email' | 'discord' | 'github'
    }) => {
      const { userId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER,
        action: USER_ACTIONS.SIGNED_IN,
        userId,
        metadata,
      })
    },

    preferencesUpdated: (params: {
      userId: string
      preferenceType: 'device' | 'soc' | 'notification' | 'general'
      action: 'added' | 'removed' | 'updated'
      entityId?: string
    }) => {
      const { userId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER,
        action: USER_ACTIONS.PREFERENCES_UPDATED,
        userId,
        metadata,
      })
    },

    notInDatabase: (params: { userId: string; userRole: Role }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER,
        action: USER_ACTIONS.NOT_IN_DATABASE,
        userId: params.userId,
        metadata: {
          errorType: 'user_not_in_database',
          userRole: params.userRole,
        },
      })
    },
  },

  // Navigation events
  navigation: {
    pageNotFound: (params: { page: string }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.NAVIGATION,
        action: NAVIGATION_ACTIONS.PAGE_NOT_FOUND,
        page: params.page,
        metadata: { errorType: 'page_not_found' },
      })
    },

    pageView: (params: {
      page: string
      section?: string
      referrer?: string
      loadTime?: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.NAVIGATION,
        action: NAVIGATION_ACTIONS.PAGE_VIEW,
        page: params.page,
        metadata: filterUndefinedValues({
          section: params.section,
          referrer: params.referrer,
          loadTime: params.loadTime,
        }),
      })
    },

    menuItemClicked: (params: {
      menuItem: string
      section: string
      page: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.NAVIGATION,
        action: NAVIGATION_ACTIONS.MENU_ITEM_CLICKED,
        metadata: params,
      })
    },
  },

  // Performance events
  performance: {
    slowQuery: (params: {
      queryName: string
      duration: number
      threshold: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.PERFORMANCE,
        action: PERFORMANCE_ACTIONS.SLOW_QUERY,
        duration: params.duration,
        metadata: {
          queryName: params.queryName,
          threshold: params.threshold,
          exceededBy: params.duration - params.threshold,
        },
      })
    },

    errorOccurred: (params: {
      errorType: string
      errorMessage?: string
      page?: string
      userId?: string
      reason?: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.PERFORMANCE,
        action: PERFORMANCE_ACTIONS.ERROR_OCCURRED,
        errorType: params.errorType,
        metadata: filterUndefinedValues({
          errorMessage: params.errorMessage,
          reason: params.reason ?? 'unknown',
          page: params.page,
          userId: params.userId,
        }),
      })
    },
  },

  // Admin events
  admin: {
    listingApproved: (params: {
      listingId: string
      adminId: string
      gameId?: string
      systemId?: string
    }) => {
      const { listingId, adminId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ADMIN,
        action: ADMIN_ACTIONS.LISTING_APPROVED,
        listingId,
        adminId,
        metadata: filterUndefinedValues(metadata),
      })
    },

    listingRejected: (params: {
      listingId: string
      adminId: string
      reason?: string
      gameId?: string
      systemId?: string
    }) => {
      const { listingId, adminId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ADMIN,
        action: ADMIN_ACTIONS.LISTING_REJECTED,
        listingId,
        adminId,
        metadata: filterUndefinedValues(metadata),
      })
    },

    bulkOperation: (params: {
      operation: 'approve' | 'reject' | 'delete'
      entityType: 'listing' | 'game' | 'user'
      count: number
      adminId: string
    }) => {
      const { adminId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ADMIN,
        action: ADMIN_ACTIONS.BULK_OPERATION,
        adminId,
        metadata,
      })
    },

    entityCreated: (params: {
      entityType: 'system' | 'emulator' | 'device' | 'soc' | 'brand' | 'game'
      entityId: string
      adminId: string
    }) => {
      const { adminId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ADMIN,
        action: ADMIN_ACTIONS.ENTITY_CREATED,
        adminId,
        metadata,
      })
    },

    userRoleChanged: (params: {
      userId: string
      adminId: string
      oldRole: string
      newRole: string
    }) => {
      const { adminId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.ADMIN,
        action: ADMIN_ACTIONS.USER_ROLE_CHANGED,
        adminId,
        metadata,
      })
    },
  },

  // User Journey events
  userJourney: {
    registrationStarted: (params: { userId: string }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER_JOURNEY,
        action: USER_JOURNEY_ACTIONS.REGISTRATION_STARTED,
        userId: params.userId,
      })
    },

    registrationCompleted: (params: { userId: string }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER_JOURNEY,
        action: USER_JOURNEY_ACTIONS.REGISTRATION_COMPLETED,
        userId: params.userId,
      })
    },

    firstTimeAction: (params: {
      userId: string
      action: 'first_listing' | 'first_vote' | 'first_comment'
    }) => {
      const { userId, action, ...metadata } = params

      let analyticsAction: string
      switch (action) {
        case 'first_listing':
          analyticsAction = USER_JOURNEY_ACTIONS.FIRST_LISTING_CREATED
          break
        case 'first_vote':
          analyticsAction = USER_JOURNEY_ACTIONS.FIRST_VOTE_CAST
          break
        case 'first_comment':
          analyticsAction = USER_JOURNEY_ACTIONS.FIRST_COMMENT_POSTED
          break
        default:
          return
      }

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.USER_JOURNEY,
        action: analyticsAction,
        userId,
        metadata: filterUndefinedValues(metadata),
      })
    },
  },

  // Content Discovery events
  contentDiscovery: {
    searchPerformed: (params: {
      query: string
      resultCount: number
      category?: string
      page?: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONTENT_DISCOVERY,
        action: CONTENT_DISCOVERY_ACTIONS.SEARCH_PERFORMED,
        searchQuery: params.query,
        metadata: filterUndefinedValues({
          resultCount: params.resultCount,
          hasResults: params.resultCount > 0,
          queryLength: params.query.length,
          category: params.category,
          page: params.page,
        }),
      })
    },

    // TODO
    externalLinkClicked: (params: {
      url: string
      context: string
      entityId?: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONTENT_DISCOVERY,
        action: CONTENT_DISCOVERY_ACTIONS.EXTERNAL_LINK_CLICKED,
        url: params.url,
        metadata: filterUndefinedValues({
          context: params.context,
          entityId: params.entityId,
        }),
      })
    },
  },

  // Trust System events
  trust: {
    trustScoreChanged: (params: {
      userId: string
      oldScore: number
      newScore: number
      action: string
      weight: number
    }) => {
      const { userId, ...metadata } = params
      const action =
        params.newScore > params.oldScore
          ? TRUST_ACTIONS_ANALYTICS.TRUST_SCORE_INCREASED
          : TRUST_ACTIONS_ANALYTICS.TRUST_SCORE_DECREASED

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.TRUST,
        action,
        userId,
        metadata,
      })
    },

    trustLevelChanged: (params: {
      userId: string
      oldLevel: string
      newLevel: string
      score: number
    }) => {
      const { userId, ...metadata } = params

      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.TRUST,
        action: TRUST_ACTIONS_ANALYTICS.TRUST_LEVEL_UP,
        userId,
        metadata,
      })
    },
  },

  // Session tracking
  session: {
    sessionStarted: (params: {
      userId?: string
      sessionId: string
      referrer?: string
      userAgent?: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.SESSION,
        action: SESSION_ACTIONS.SESSION_STARTED,
        sessionId: params.sessionId,
        metadata: filterUndefinedValues({
          userId: params.userId,
          referrer: params.referrer,
          userAgent: params.userAgent,
        }),
      })
    },

    sessionEnded: (params: {
      userId?: string
      sessionId: string
      duration: number
      pageViews: number
      interactions: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.SESSION,
        action: SESSION_ACTIONS.SESSION_ENDED,
        sessionId: params.sessionId,
        duration: params.duration,
        metadata: filterUndefinedValues({
          userId: params.userId,
          pageViews: params.pageViews,
          interactions: params.interactions,
          engagementRate: params.interactions / Math.max(params.pageViews, 1),
        }),
      })
    },

    featureDiscovered: (params: {
      userId?: string
      feature: string
      context: string
      sessionTime?: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.SESSION,
        action: SESSION_ACTIONS.FEATURE_DISCOVERED,
        feature: params.feature,
        metadata: filterUndefinedValues({
          userId: params.userId,
          context: params.context,
          sessionTime: params.sessionTime,
        }),
      })
    },

    pageView: (params: {
      pathname: string
      loadTime: number
      userId?: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.SESSION,
        action: SESSION_ACTIONS.PAGE_VIEW,
        page: params.pathname,
        metadata: filterUndefinedValues({
          pageLocation: params.pathname,
          pageLoadTime: params.loadTime,
          userId: params.userId,
        }),
      })
    },
  },

  // Content Quality events
  contentQuality: {
    // TODO
    contentFlagged: (params: {
      entityType: 'listing' | 'comment' | 'game'
      entityId: string
      flaggedBy: string
      reason: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONTENT_QUALITY,
        action: CONTENT_QUALITY_ACTIONS.CONTENT_FLAGGED,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: {
          flaggedBy: params.flaggedBy,
          reason: params.reason,
        },
      })
    },

    // TODO
    spamDetected: (params: {
      entityType: string
      entityId: string
      confidence: number
      method: string
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONTENT_QUALITY,
        action: CONTENT_QUALITY_ACTIONS.SPAM_DETECTED,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: {
          confidence: params.confidence,
          method: params.method,
        },
      })
    },
  },

  // Conversion tracking
  conversion: {
    goalCompleted: (params: {
      userId?: string
      goalType:
        | 'listing_created'
        | 'first_vote'
        | 'first_comment'
        | 'profile_completed'
      goalValue?: number
      conversionPath?: string[]
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONVERSION,
        action: CONVERSION_ACTIONS.CONVERSION_GOAL_REACHED,
        userId: params.userId,
        metadata: filterUndefinedValues({
          goalType: params.goalType,
          goalValue: params.goalValue,
          conversionPathLength: params.conversionPath?.length,
        }),
      })
    },

    funnelStepCompleted: (params: {
      userId?: string
      funnelName: string
      stepName: string
      stepIndex: number
      timeToComplete?: number
    }) => {
      sendAnalyticsEvent({
        category: ANALYTICS_CATEGORIES.CONVERSION,
        action: CONVERSION_ACTIONS.FUNNEL_STEP_COMPLETED,
        userId: params.userId,
        metadata: filterUndefinedValues({
          funnelName: params.funnelName,
          stepName: params.stepName,
          stepIndex: params.stepIndex,
          timeToComplete: params.timeToComplete,
        }),
      })
    },
  },
}

export default analytics
