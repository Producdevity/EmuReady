import { sanitizeText } from '@/utils/sanitization'
import type { NotificationTemplate } from './types'
import type { NotificationType, NotificationCategory } from '@orm'

export interface TemplateContext {
  listingTitle?: string
  gameTitle?: string
  emulatorName?: string
  deviceName?: string
  socName?: string
  userName?: string
  commentText?: string
  voteValue?: boolean
  listingId?: string
  commentId?: string
  voteId?: string
  parentCommentId?: string
  deviceId?: string
  socId?: string
  gameId?: string
  emulatorId?: string
  message?: string
  actionUrl?: string
  maintenanceDate?: string
  duration?: string
  featureName?: string
  featureDescription?: string
  policyVersion?: string
  effectiveDate?: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  contentId?: string
  contentType?: string
  flagReason?: string
  warningType?: string
  warningReason?: string
  issuedBy?: string
  [key: string]: unknown
}

class NotificationTemplateEngine {
  private templates: Map<
    NotificationType,
    (context: TemplateContext) => NotificationTemplate
  >

  constructor() {
    this.templates = new Map()
    this.initializeTemplates()
  }

  private initializeTemplates(): void {
    // Engagement notifications
    this.templates.set('LISTING_COMMENT', (context) => ({
      title: 'New comment on your listing',
      message: `${context.userName || 'Someone'} commented on your listing${context.listingTitle ? ` "${context.listingTitle}"` : ''}${context.commentText ? `: "${sanitizeText(context.commentText)}"` : ''}`,
      actionUrl:
        context.listingId && context.commentId
          ? `/listings/${context.listingId}#comment-${context.commentId}`
          : context.listingId
            ? `/listings/${context.listingId}`
            : undefined,
      metadata: {
        listingId: context.listingId,
        commentId: context.commentId,
        commentText: context.commentText,
      },
    }))

    this.templates.set('LISTING_VOTE_UP', (context) => ({
      title: 'Your listing received an upvote',
      message: `${context.userName || 'Someone'} upvoted your listing${context.listingTitle ? ` "${context.listingTitle}"` : ''}`,
      actionUrl: context.listingId
        ? `/listings/${context.listingId}`
        : undefined,
      metadata: {
        listingId: context.listingId,
        voteId: context.voteId,
        voteValue: true,
      },
    }))

    this.templates.set('LISTING_VOTE_DOWN', (context) => ({
      title: 'Your listing received a downvote',
      message: `${context.userName || 'Someone'} downvoted your listing${context.listingTitle ? ` "${context.listingTitle}"` : ''}`,
      actionUrl: context.listingId
        ? `/listings/${context.listingId}`
        : undefined,
      metadata: {
        listingId: context.listingId,
        voteId: context.voteId,
        voteValue: false,
      },
    }))

    this.templates.set('COMMENT_REPLY', (context) => ({
      title: 'Someone replied to your comment',
      message: `${context.userName || 'Someone'} replied to your comment${context.commentText ? `: "${sanitizeText(context.commentText)}"` : ''}`,
      actionUrl:
        context.listingId && context.commentId
          ? `/listings/${context.listingId}#comment-${context.commentId}`
          : context.listingId
            ? `/listings/${context.listingId}`
            : undefined,
      metadata: {
        listingId: context.listingId,
        commentId: context.commentId,
        parentCommentId: context.parentCommentId,
        commentText: context.commentText,
      },
    }))

    this.templates.set('USER_MENTION', (context) => ({
      title: 'You were mentioned in a comment',
      message: `${context.userName || 'Someone'} mentioned you in a comment${context.commentText ? `: "${sanitizeText(context.commentText)}"` : ''}`,
      actionUrl:
        context.listingId && context.commentId
          ? `/listings/${context.listingId}#comment-${context.commentId}`
          : context.listingId
            ? `/listings/${context.listingId}`
            : undefined,
      metadata: {
        listingId: context.listingId,
        commentId: context.commentId,
        commentText: context.commentText,
      },
    }))

    // Content notifications
    this.templates.set('NEW_DEVICE_LISTING', (context) => ({
      title: 'New listing for your preferred device',
      message: `A new listing was added${context.deviceName ? ` for ${context.deviceName}` : ''}${context.listingTitle ? `: "${context.listingTitle}"` : ''}`,
      actionUrl: context.listingId
        ? `/listings/${context.listingId}`
        : undefined,
      metadata: {
        listingId: context.listingId,
        deviceId: context.deviceId,
        deviceName: context.deviceName,
      },
    }))

    this.templates.set('NEW_SOC_LISTING', (context) => ({
      title: 'New listing for your preferred SOC',
      message: `A new listing was added${context.socName ? ` for ${context.socName}` : ''}${context.listingTitle ? `: "${context.listingTitle}"` : ''}`,
      actionUrl: context.listingId
        ? `/listings/${context.listingId}`
        : undefined,
      metadata: {
        listingId: context.listingId,
        socId: context.socId,
        socName: context.socName,
      },
    }))

    this.templates.set('GAME_ADDED', (context) => ({
      title: 'New game added to the system',
      message: `${context.gameTitle ? `"${context.gameTitle}"` : 'A new game'} has been added to the game library`,
      actionUrl: context.gameId ? `/games/${context.gameId}` : undefined,
      metadata: {
        gameId: context.gameId,
        gameTitle: context.gameTitle,
      },
    }))

    this.templates.set('EMULATOR_UPDATED', (context) => ({
      title: 'Emulator you follow was updated',
      message: `${context.emulatorName || 'An emulator'} has been updated with new features`,
      actionUrl: context.emulatorId
        ? `/admin/emulators/${context.emulatorId}`
        : undefined,
      metadata: {
        emulatorId: context.emulatorId,
        emulatorName: context.emulatorName,
      },
    }))

    // System notifications
    this.templates.set('MAINTENANCE_NOTICE', (context) => ({
      title: 'Scheduled maintenance notification',
      message:
        context.message ||
        'Scheduled maintenance will occur soon. Please save your work.',
      actionUrl: context.actionUrl,
      metadata: {
        maintenanceDate: context.maintenanceDate,
        duration: context.duration,
      },
    }))

    this.templates.set('FEATURE_ANNOUNCEMENT', (context) => ({
      title: 'New feature available',
      message:
        context.message || 'A new feature is now available on the platform.',
      actionUrl: context.actionUrl,
      metadata: {
        featureName: context.featureName,
        featureDescription: context.featureDescription,
      },
    }))

    this.templates.set('POLICY_UPDATE', (context) => ({
      title: 'Terms of service updated',
      message:
        context.message ||
        'Our terms of service have been updated. Please review the changes.',
      actionUrl: context.actionUrl,
      metadata: {
        policyVersion: context.policyVersion,
        effectiveDate: context.effectiveDate,
      },
    }))

    // Moderation notifications
    this.templates.set('LISTING_APPROVED', (context) => ({
      title: 'Your submitted listing was approved',
      message: `Your listing${context.listingTitle ? ` "${context.listingTitle}"` : ''} has been approved and is now live on the platform.`,
      actionUrl: context.listingId
        ? `/listings/${context.listingId}`
        : undefined,
      metadata: {
        listingId: context.listingId,
        approvedBy: context.approvedBy,
        approvedAt: context.approvedAt,
      },
    }))

    this.templates.set('LISTING_REJECTED', (context) => ({
      title: 'Your submitted listing was rejected',
      message: `Your listing${context.listingTitle ? ` "${context.listingTitle}"` : ''} was not approved${context.rejectionReason ? `. Reason: ${sanitizeText(context.rejectionReason)}` : '.'}`,
      actionUrl: context.listingId
        ? `/listings/${context.listingId}`
        : undefined,
      metadata: {
        listingId: context.listingId,
        rejectedBy: context.rejectedBy,
        rejectedAt: context.rejectedAt,
        rejectionReason: context.rejectionReason,
      },
    }))

    this.templates.set('CONTENT_FLAGGED', (context) => ({
      title: 'Your content was flagged for review',
      message: `Your ${context.contentType || 'content'} has been flagged for review by our moderation team.`,
      actionUrl: context.actionUrl,
      metadata: {
        contentId: context.contentId,
        contentType: context.contentType,
        flagReason: context.flagReason,
      },
    }))

    this.templates.set('ACCOUNT_WARNING', (context) => ({
      title: 'Account warning issued',
      message:
        context.message ||
        'A warning has been issued for your account. Please review our community guidelines.',
      actionUrl: context.actionUrl,
      metadata: {
        warningType: context.warningType,
        warningReason: context.warningReason,
        issuedBy: context.issuedBy,
      },
    }))
  }

  generateTemplate(
    type: NotificationType,
    context: TemplateContext,
  ): NotificationTemplate {
    const template = this.templates.get(type)
    if (!template) {
      throw new Error(`No template found for notification type: ${type}`)
    }

    return template(context)
  }

  getCategory(type: NotificationType): NotificationCategory {
    const engagementTypes: NotificationType[] = [
      'LISTING_COMMENT',
      'LISTING_VOTE_UP',
      'LISTING_VOTE_DOWN',
      'COMMENT_REPLY',
      'USER_MENTION',
    ]

    const contentTypes: NotificationType[] = [
      'NEW_DEVICE_LISTING',
      'NEW_SOC_LISTING',
      'GAME_ADDED',
      'EMULATOR_UPDATED',
    ]

    const systemTypes: NotificationType[] = [
      'MAINTENANCE_NOTICE',
      'FEATURE_ANNOUNCEMENT',
      'POLICY_UPDATE',
    ]

    const moderationTypes: NotificationType[] = [
      'LISTING_APPROVED',
      'LISTING_REJECTED',
      'CONTENT_FLAGGED',
      'ACCOUNT_WARNING',
    ]

    if (engagementTypes.includes(type)) return 'ENGAGEMENT'
    if (contentTypes.includes(type)) return 'CONTENT'
    if (systemTypes.includes(type)) return 'SYSTEM'
    if (moderationTypes.includes(type)) return 'MODERATION'

    throw new Error(`Unknown notification type: ${type}`)
  }
}

export const notificationTemplateEngine = new NotificationTemplateEngine()
