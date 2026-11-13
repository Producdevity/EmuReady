import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DeliveryChannel,
  NotificationCategory,
  NotificationDeliveryStatus,
  NotificationType,
} from '@orm'
import { EmailService } from './emailService'
import { notificationTemplateEngine } from './templates'
import { type NotificationData } from './types'
import type sendGrid from '@sendgrid/mail'

type SendGridMessage = Parameters<typeof sendGrid.send>[0]

const transport = vi.hoisted(() => ({
  setApiKey: vi.fn<(key: string) => void>(),
  send: vi.fn<(message: SendGridMessage) => Promise<void>>(),
}))

vi.mock('@sendgrid/mail', () => ({ default: transport }))
vi.unmock('@orm')
vi.unmock('@orm/client')

const baseUrl = 'https://emuready.example'
const notification = {
  userId: 'recipient-1',
  type: NotificationType.COMMENT_ON_LISTING,
  category: NotificationCategory.ENGAGEMENT,
  title: 'New report comment',
  message: 'A comment was posted.',
  deliveryChannel: DeliveryChannel.EMAIL,
} satisfies NotificationData

function service() {
  return new EmailService({
    provider: 'sendgrid',
    apiKey: 'test-api-key',
    fromEmail: 'notifications@emuready.example',
    fromName: 'EmuReady',
  })
}

function sentEmail() {
  const message = transport.send.mock.lastCall?.[0]
  if (!message || Array.isArray(message) || typeof message.html !== 'string')
    throw new Error('Expected one rendered HTML email')
  return { message, document: new DOMParser().parseFromString(message.html, 'text/html') }
}

beforeEach(() => {
  vi.resetAllMocks()
  transport.send.mockResolvedValue(undefined)
  vi.stubEnv('NEXT_PUBLIC_APP_URL', baseUrl)
})

afterEach(() => vi.unstubAllEnvs())

describe('notification email output encoding', () => {
  it('renders a real comment notification display name as text', async () => {
    const template = notificationTemplateEngine.generateTemplate(
      NotificationType.COMMENT_ON_LISTING,
      {
        userName: '<strong data-injected="name">Reviewer & Co</strong>',
        listingId: 'report-1',
        listingTitle: 'A game',
        commentText: '<b>Great</b> & playable',
      },
    )

    await expect(
      service().sendNotificationEmail('recipient@emuready.example', {
        ...notification,
        ...template,
      }),
    ).resolves.toEqual({
      success: true,
      channel: DeliveryChannel.EMAIL,
      status: NotificationDeliveryStatus.SENT,
    })

    const email = sentEmail()
    expect(email.document.querySelector('[data-injected]')).toBeNull()
    expect(email.document.body.textContent).toContain(template.message)
    expect(email.message.text).toContain(template.message)
    expect(transport.send).toHaveBeenCalledOnce()
  })

  it('encodes title and message markup without changing the subject or plain-text body', async () => {
    const title = '</title><img data-injected="title" src="x"> café & tea'
    const message = '<a data-injected="message" href="https://attacker.example">Click</a> — 日本語'
    await service().sendNotificationEmail('recipient@emuready.example', {
      ...notification,
      title,
      message,
    })

    const email = sentEmail()
    expect(email.document.querySelector('[data-injected]')).toBeNull()
    expect(email.document.title).toBe(`[EmuReady] ${title}`)
    expect(email.document.querySelector('h2')?.textContent?.trim()).toBe(title)
    expect(email.document.body.textContent).toContain(message)
    expect(email.message.subject).toBe(`[EmuReady] ${title}`)
    expect(email.message.text).toContain(title)
    expect(email.message.text).toContain(message)
  })

  it('keeps quoted action URL text inside its attribute', async () => {
    const actionUrl = '/listings/report-1?q=" data-injected="link"&label=café'
    await service().sendNotificationEmail('recipient@emuready.example', {
      ...notification,
      actionUrl,
    })

    const email = sentEmail()
    const action = [...email.document.querySelectorAll('a')].find(
      (link) => link.textContent?.trim() === 'View Details',
    )
    expect(action?.getAttribute('href')).toBe(`${baseUrl}${actionUrl}`)
    expect(email.document.querySelector('[data-injected]')).toBeNull()
    expect(email.message.text).toContain(`${baseUrl}${actionUrl}`)
  })

  it('encodes the configured base URL in every HTML link and image attribute', async () => {
    const configuredBaseUrl = 'https://emuready.example/" data-injected="base"&theme=dark'
    const actionUrl = '/listings/report-1'
    vi.stubEnv('NEXT_PUBLIC_APP_URL', configuredBaseUrl)

    await service().sendNotificationEmail('recipient@emuready.example', {
      ...notification,
      actionUrl,
    })

    const email = sentEmail()
    expect(email.document.querySelector('[data-injected]')).toBeNull()
    expect(email.document.querySelector('img')?.getAttribute('src')).toBe(
      `${configuredBaseUrl}/logo/460x460_rounded.png`,
    )
    expect(
      [...email.document.querySelectorAll('a')].map((link) => link.getAttribute('href')),
    ).toEqual([
      `${configuredBaseUrl}${actionUrl}`,
      `${configuredBaseUrl}/profile?tab=notifications`,
      configuredBaseUrl,
    ])
    expect(email.message.text).toContain(`${configuredBaseUrl}${actionUrl}`)
  })

  it('preserves Unicode, literal entities and legitimate report links', async () => {
    const title = 'Great & playable — 日本語'
    const message = 'François & 李 use <custom> and &copy; literally.'
    const actionUrl = '/pc-listings/report-1?view=comments&label=café#comment-2'
    await service().sendNotificationEmail('recipient@emuready.example', {
      ...notification,
      title,
      message,
      actionUrl,
    })

    const email = sentEmail()
    expect(email.document.querySelector('h2')?.textContent?.trim()).toBe(title)
    expect(email.document.body.textContent).toContain(message)
    const action = [...email.document.querySelectorAll('a')].find(
      (link) => link.textContent?.trim() === 'View Details',
    )
    expect(action?.getAttribute('href')).toBe(`${baseUrl}${actionUrl}`)
    expect(email.document.querySelector('img')?.getAttribute('src')).toBe(
      `${baseUrl}/logo/460x460_rounded.png`,
    )
    expect(email.message.subject).toBe(`[EmuReady] ${title}`)
    expect(email.message.text).toContain(message)
    expect(transport.setApiKey).toHaveBeenCalledExactlyOnceWith('test-api-key')
  })
})
