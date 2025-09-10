import { sanitizeText } from '@/utils/sanitization'
import { NotificationType, NotificationCategory } from '@orm'
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
  private templates: Map<NotificationType, (context: TemplateContext) => NotificationTemplate>
  private aliases: Set<NotificationType>

  constructor() {
    this.templates = new Map()
    this.aliases = new Set()
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
      actionUrl: context.listingId ? `/listings/${context.listingId}` : undefined,
      metadata: {
        listingId: context.listingId,
        voteId: context.voteId,
        voteValue: true,
      },
    }))

    this.templates.set(NotificationType.LISTING_VOTE_DOWN, (context) => ({
      title: 'Your listing received a downvote',
      message: `${context.userName || 'Someone'} downvoted your listing${context.listingTitle ? ` "${context.listingTitle}"` : ''}`,
      actionUrl: context.listingId ? `/listings/${context.listingId}` : undefined,
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
      actionUrl: context.listingId ? `/listings/${context.listingId}` : undefined,
      metadata: {
        listingId: context.listingId,
        deviceId: context.deviceId,
        deviceName: context.deviceName,
      },
    }))

    this.templates.set(NotificationType.NEW_SOC_LISTING, (context) => ({
      title: 'New listing for your preferred SOC',
      message: `A new listing was added${context.socName ? ` for ${context.socName}` : ''}${context.listingTitle ? `: "${context.listingTitle}"` : ''}`,
      actionUrl: context.listingId ? `/listings/${context.listingId}` : undefined,
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
      actionUrl: context.emulatorId ? `/admin/emulators/${context.emulatorId}` : undefined,
      metadata: {
        emulatorId: context.emulatorId,
        emulatorName: context.emulatorName,
      },
    }))

    // System notifications
    this.templates.set(NotificationType.MAINTENANCE_NOTICE, (context) => ({
      title: 'Scheduled maintenance notification',
      message: context.message || 'Scheduled maintenance will occur soon. Please save your work.',
      actionUrl: context.actionUrl,
      metadata: {
        maintenanceDate: context.maintenanceDate,
        duration: context.duration,
      },
    }))

    this.templates.set(NotificationType.FEATURE_ANNOUNCEMENT, (context) => ({
      title: 'New feature available',
      message: context.message || 'A new feature is now available on the platform.',
      actionUrl: context.actionUrl,
      metadata: {
        featureName: context.featureName,
        featureDescription: context.featureDescription,
      },
    }))

    this.templates.set(NotificationType.POLICY_UPDATE, (context) => ({
      title: 'Policy update notification',
      message: context.message || 'Our policies have been updated. Please review the changes.',
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
      actionUrl: context.listingId ? `/listings/${context.listingId}` : undefined,
      metadata: {
        listingId: context.listingId,
        approvedBy: context.approvedBy,
        approvedAt: context.approvedAt,
      },
    }))

    this.templates.set(NotificationType.LISTING_REJECTED, (context) => ({
      title: 'Your listing has been rejected',
      message: `Your listing${context.listingTitle ? ` "${context.listingTitle}"` : ''} has been rejected${context.rejectedBy ? ` by ${context.rejectedBy}` : ''}${context.rejectionReason ? `. Reason: ${context.rejectionReason}` : ''}`,
      actionUrl: context.listingId ? `/listings/${context.listingId}` : undefined,
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

    // Aliases for existing events
    this.alias(NotificationType.COMMENT_ON_LISTING, NotificationType.LISTING_COMMENT)
    this.alias(NotificationType.REPLY_TO_COMMENT, NotificationType.COMMENT_REPLY)
    this.alias(NotificationType.LISTING_UPVOTED, NotificationType.LISTING_VOTE_UP)
    this.alias(NotificationType.LISTING_DOWNVOTED, NotificationType.LISTING_VOTE_DOWN)

    // Comment vote templates
    this.templates.set(NotificationType.COMMENT_UPVOTED, (context) => ({
      title: 'Your comment received an upvote',
      message: `${context.userName || 'Someone'} upvoted your comment${context.commentText ? `: "${sanitizeText(context.commentText)}"` : ''}`,
      actionUrl:
        context.listingId && context.commentId
          ? `/listings/${context.listingId}#comment-${context.commentId}`
          : context.listingId
            ? `/listings/${context.listingId}`
            : undefined,
      metadata: {
        listingId: context.listingId,
        commentId: context.commentId,
        voteId: context.voteId,
        voteValue: true,
      },
    }))

    this.templates.set(NotificationType.COMMENT_DOWNVOTED, (context) => ({
      title: 'Your comment received a downvote',
      message: `${context.userName || 'Someone'} downvoted your comment${context.commentText ? `: "${sanitizeText(context.commentText)}"` : ''}`,
      actionUrl:
        context.listingId && context.commentId
          ? `/listings/${context.listingId}#comment-${context.commentId}`
          : context.listingId
            ? `/listings/${context.listingId}`
            : undefined,
      metadata: {
        listingId: context.listingId,
        commentId: context.commentId,
        voteId: context.voteId,
        voteValue: false,
      },
    }))

    // User moderation templates
    this.templates.set(NotificationType.USER_BANNED, (context) => ({
      title: 'Your account has been banned',
      message: `Your account has been banned${context.warningReason ? `: ${context.warningReason}` : ''}${context.duration ? ` (Duration: ${context.duration})` : ''}`,
      actionUrl: '/guidelines',
      metadata: {
        reason: context.warningReason,
        duration: context.duration,
        issuedBy: context.issuedBy,
      },
    }))

    this.templates.set(NotificationType.USER_UNBANNED, (context) => ({
      title: 'Your account ban has been lifted',
      message: 'Your account access has been restored.',
      actionUrl: '/profile',
      metadata: {
        changedAt: context.changedAt,
      },
    }))

    // Report templates
    this.templates.set(NotificationType.REPORT_CREATED, (context) => ({
      title: 'New report submitted',
      message: `A new report has been created${context.contentType ? ` for ${context.contentType}` : ''}.`,
      actionUrl: context.actionUrl || '/admin/reports',
      metadata: {
        contentId: context.contentId,
        contentType: context.contentType,
        reportId: context.reportId,
      },
    }))

    this.templates.set(NotificationType.REPORT_STATUS_CHANGED, (context) => ({
      title: 'Your report status changed',
      message: `The status of your report has changed${context.status ? ` to ${context.status}` : ''}.`,
      actionUrl: context.actionUrl || '/reports',
      metadata: {
        reportId: context.reportId,
        status: context.status,
      },
    }))

    // Developer verification
    this.templates.set(NotificationType.VERIFIED_DEVELOPER, (context) => ({
      title: 'You were verified as a developer',
      message: `You are now a verified developer${context.emulatorName ? ` for ${context.emulatorName}` : ''}.`,
      actionUrl: '/profile',
      metadata: {
        emulatorId: context.emulatorId,
        emulatorName: context.emulatorName,
      },
    }))

    // Digests and activity bonuses
    this.templates.set(NotificationType.WEEKLY_DIGEST, (context) => ({
      title: 'Your weekly digest is ready',
      message: context.message || "Here's your weekly summary.",
      actionUrl: '/notifications',
    }))

    this.templates.set(NotificationType.MONTHLY_ACTIVE_BONUS, (context) => ({
      title: 'Monthly activity bonus awarded',
      message: context.message || 'Thanks for staying active! You received a bonus.',
      actionUrl: '/profile',
    }))
  }

  private alias(aliasType: NotificationType, baseType: NotificationType): void {
    const base = this.templates.get(baseType)
    if (base) {
      this.templates.set(aliasType, base)
      this.aliases.add(aliasType)
    }
  }

  generateTemplate(type: NotificationType, context: TemplateContext): NotificationTemplate {
    const templateFn = this.templates.get(type)
    if (!templateFn) {
      throw new Error(`No template found for notification type: ${type}`)
    }

    return templateFn(context)
  }

  getCategory(type: NotificationType): NotificationCategory {
    const categoryMap: Record<string, NotificationCategory> = {
      [NotificationType.LISTING_COMMENT]: NotificationCategory.ENGAGEMENT,
      [NotificationType.LISTING_VOTE_UP]: NotificationCategory.ENGAGEMENT,
      [NotificationType.LISTING_VOTE_DOWN]: NotificationCategory.ENGAGEMENT,
      [NotificationType.COMMENT_REPLY]: NotificationCategory.ENGAGEMENT,
      [NotificationType.USER_MENTION]: NotificationCategory.ENGAGEMENT,
      [NotificationType.COMMENT_ON_LISTING]: NotificationCategory.ENGAGEMENT,
      [NotificationType.REPLY_TO_COMMENT]: NotificationCategory.ENGAGEMENT,
      [NotificationType.LISTING_UPVOTED]: NotificationCategory.ENGAGEMENT,
      [NotificationType.LISTING_DOWNVOTED]: NotificationCategory.ENGAGEMENT,
      [NotificationType.COMMENT_UPVOTED]: NotificationCategory.ENGAGEMENT,
      [NotificationType.COMMENT_DOWNVOTED]: NotificationCategory.ENGAGEMENT,

      [NotificationType.NEW_DEVICE_LISTING]: NotificationCategory.CONTENT,
      [NotificationType.NEW_SOC_LISTING]: NotificationCategory.CONTENT,
      [NotificationType.GAME_ADDED]: NotificationCategory.CONTENT,
      [NotificationType.EMULATOR_UPDATED]: NotificationCategory.CONTENT,

      [NotificationType.MAINTENANCE_NOTICE]: NotificationCategory.SYSTEM,
      [NotificationType.FEATURE_ANNOUNCEMENT]: NotificationCategory.SYSTEM,
      [NotificationType.POLICY_UPDATE]: NotificationCategory.SYSTEM,
      [NotificationType.WEEKLY_DIGEST]: NotificationCategory.SYSTEM,
      [NotificationType.MONTHLY_ACTIVE_BONUS]: NotificationCategory.SYSTEM,

      [NotificationType.LISTING_APPROVED]: NotificationCategory.MODERATION,
      [NotificationType.LISTING_REJECTED]: NotificationCategory.MODERATION,
      [NotificationType.CONTENT_FLAGGED]: NotificationCategory.MODERATION,
      [NotificationType.ACCOUNT_WARNING]: NotificationCategory.MODERATION,
      [NotificationType.ROLE_CHANGED]: NotificationCategory.MODERATION,
      [NotificationType.USER_BANNED]: NotificationCategory.MODERATION,
      [NotificationType.USER_UNBANNED]: NotificationCategory.MODERATION,
      [NotificationType.REPORT_CREATED]: NotificationCategory.MODERATION,
      [NotificationType.REPORT_STATUS_CHANGED]: NotificationCategory.MODERATION,
      [NotificationType.VERIFIED_DEVELOPER]: NotificationCategory.MODERATION,
    }

    return categoryMap[type] || NotificationCategory.SYSTEM
  }

  getAvailableTypes(): NotificationType[] {
    // Return only canonical types (exclude aliases)
    return Array.from(this.templates.keys()).filter((t) => !this.aliases.has(t))
  }
}

export const notificationTemplateEngine = new NotificationTemplateEngine()
