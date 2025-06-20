import { sanitizeText } from '@/utils/sanitization'
import { NotificationType, type NotificationCategory } from '@orm'
import type { NotificationTemplate } from './types'

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
  oldRole?: string
  newRole?: string
  changedBy?: string
  changedAt?: string
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
    this.templates.set(NotificationType.LISTING_COMMENT, (context) => ({
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

    this.templates.set(NotificationType.LISTING_VOTE_UP, (context) => ({
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

    this.templates.set(NotificationType.LISTING_VOTE_DOWN, (context) => ({
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

    this.templates.set(NotificationType.COMMENT_REPLY, (context) => ({
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

    this.templates.set(NotificationType.USER_MENTION, (context) => ({
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
    this.templates.set(NotificationType.NEW_DEVICE_LISTING, (context) => ({
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

    this.templates.set(NotificationType.NEW_SOC_LISTING, (context) => ({
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

    this.templates.set(NotificationType.GAME_ADDED, (context) => ({
      title: 'New game added to the system',
      message: `${context.gameTitle ? `"${context.gameTitle}"` : 'A new game'} has been added to the game library`,
      actionUrl: context.gameId ? `/games/${context.gameId}` : undefined,
      metadata: {
        gameId: context.gameId,
        gameTitle: context.gameTitle,
      },
    }))

    this.templates.set(NotificationType.EMULATOR_UPDATED, (context) => ({
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
    this.templates.set(NotificationType.MAINTENANCE_NOTICE, (context) => ({
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

    this.templates.set(NotificationType.FEATURE_ANNOUNCEMENT, (context) => ({
      title: 'New feature available',
      message:
        context.message || 'A new feature is now available on the platform.',
      actionUrl: context.actionUrl,
      metadata: {
        featureName: context.featureName,
        featureDescription: context.featureDescription,
      },
    }))

    this.templates.set(NotificationType.POLICY_UPDATE, (context) => ({
      title: 'Policy update notification',
      message:
        context.message ||
        'Our policies have been updated. Please review the changes.',
      actionUrl: context.actionUrl || '/terms',
      metadata: {
        policyVersion: context.policyVersion,
        effectiveDate: context.effectiveDate,
      },
    }))

    // Moderation notifications
    this.templates.set(NotificationType.LISTING_APPROVED, (context) => ({
      title: 'Your listing has been approved',
      message: `Your listing${context.listingTitle ? ` "${context.listingTitle}"` : ''} has been approved${context.approvedBy ? ` by ${context.approvedBy}` : ''}`,
      actionUrl: context.listingId
        ? `/listings/${context.listingId}`
        : undefined,
      metadata: {
        listingId: context.listingId,
        approvedBy: context.approvedBy,
        approvedAt: context.approvedAt,
      },
    }))

    this.templates.set(NotificationType.LISTING_REJECTED, (context) => ({
      title: 'Your listing has been rejected',
      message: `Your listing${context.listingTitle ? ` "${context.listingTitle}"` : ''} has been rejected${context.rejectedBy ? ` by ${context.rejectedBy}` : ''}${context.rejectionReason ? `. Reason: ${context.rejectionReason}` : ''}`,
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

    this.templates.set(NotificationType.CONTENT_FLAGGED, (context) => ({
      title: 'Content flagged for review',
      message: `Your ${context.contentType || 'content'} has been flagged for review${context.flagReason ? `. Reason: ${context.flagReason}` : ''}`,
      actionUrl: context.actionUrl,
      metadata: {
        contentId: context.contentId,
        contentType: context.contentType,
        flagReason: context.flagReason,
      },
    }))

    this.templates.set(NotificationType.ACCOUNT_WARNING, (context) => ({
      title: 'Account warning issued',
      message: `A warning has been issued to your account${context.warningReason ? `: ${context.warningReason}` : ''}`,
      actionUrl: context.actionUrl || '/profile',
      metadata: {
        warningType: context.warningType,
        warningReason: context.warningReason,
        issuedBy: context.issuedBy,
      },
    }))

    this.templates.set(NotificationType.ROLE_CHANGED, (context) => ({
      title: 'Your role has been updated',
      message: `Your account role has been changed from ${context.oldRole} to ${context.newRole}${context.changedBy ? ` by ${context.changedBy}` : ''}`,
      actionUrl: '/profile',
      metadata: {
        oldRole: context.oldRole,
        newRole: context.newRole,
        changedBy: context.changedBy,
        changedAt: context.changedAt,
      },
    }))
  }

  generateTemplate(
    type: NotificationType,
    context: TemplateContext,
  ): NotificationTemplate {
    const templateFn = this.templates.get(type)
    if (!templateFn) {
      throw new Error(`No template found for notification type: ${type}`)
    }

    return templateFn(context)
  }

  getCategory(type: NotificationType): NotificationCategory {
    const categoryMap: Record<string, NotificationCategory> = {
      [NotificationType.LISTING_COMMENT]: 'ENGAGEMENT',
      [NotificationType.LISTING_VOTE_UP]: 'ENGAGEMENT',
      [NotificationType.LISTING_VOTE_DOWN]: 'ENGAGEMENT',
      [NotificationType.COMMENT_REPLY]: 'ENGAGEMENT',
      [NotificationType.USER_MENTION]: 'ENGAGEMENT',

      [NotificationType.NEW_DEVICE_LISTING]: 'CONTENT',
      [NotificationType.NEW_SOC_LISTING]: 'CONTENT',
      [NotificationType.GAME_ADDED]: 'CONTENT',
      [NotificationType.EMULATOR_UPDATED]: 'CONTENT',

      [NotificationType.MAINTENANCE_NOTICE]: 'SYSTEM',
      [NotificationType.FEATURE_ANNOUNCEMENT]: 'SYSTEM',
      [NotificationType.POLICY_UPDATE]: 'SYSTEM',

      [NotificationType.LISTING_APPROVED]: 'MODERATION',
      [NotificationType.LISTING_REJECTED]: 'MODERATION',
      [NotificationType.CONTENT_FLAGGED]: 'MODERATION',
      [NotificationType.ACCOUNT_WARNING]: 'MODERATION',
      [NotificationType.ROLE_CHANGED]: 'MODERATION',
    }

    return categoryMap[type] || 'SYSTEM'
  }

  getAvailableTypes(): NotificationType[] {
    return Array.from(this.templates.keys())
  }
}

export const notificationTemplateEngine = new NotificationTemplateEngine()
