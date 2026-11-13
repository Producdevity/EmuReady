import { describe, expect, it } from 'vitest'
import { NotificationType } from '@orm'
import { notificationTemplateEngine } from './templates'

describe.each([NotificationType.LISTING_COMMENT, NotificationType.COMMENT_ON_LISTING])(
  '%s report links',
  (type) => {
    it.each([
      { context: { listingId: 'handheld-1' }, path: '/listings/handheld-1' },
      { context: { pcListingId: 'pc-1' }, path: '/pc-listings/pc-1' },
    ])('links to the report and its comment at $path', ({ context, path }) => {
      expect(notificationTemplateEngine.generateTemplate(type, context).actionUrl).toBe(path)
      expect(
        notificationTemplateEngine.generateTemplate(type, { ...context, commentId: 'comment-1' })
          .actionUrl,
      ).toBe(`${path}#comment-comment-1`)
    })
  },
)
