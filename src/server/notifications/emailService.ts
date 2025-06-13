import { type NotificationData, type NotificationDeliveryResult } from './types'

export type EmailProvider = 'sendgrid' | 'mailersend'

interface EmailConfig {
  provider: EmailProvider
  apiKey: string
  fromEmail: string
  fromName: string
}

interface EmailTemplate {
  subject: string
  htmlContent: string
  textContent: string
}

class EmailService {
  private config: EmailConfig

  constructor(config: EmailConfig) {
    this.config = config
  }

  async sendNotificationEmail(
    to: string,
    notification: NotificationData,
  ): Promise<NotificationDeliveryResult> {
    try {
      const template = this.generateEmailTemplate(notification)

      switch (this.config.provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(to, template)
        case 'mailersend':
          return await this.sendWithMailerSend(to, template)
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`)
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return {
        success: false,
        channel: 'EMAIL',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private generateEmailTemplate(notification: NotificationData): EmailTemplate {
    const subject = `[EmuReady] ${notification.title}`

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const actionUrl = notification.actionUrl
      ? `${baseUrl}${notification.actionUrl}`
      : null

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>${subject}</title>
          <!--[if mso]>
          <style type="text/css">
            table { border-collapse: collapse; }
            .gradient-text { color: #3b82f6 !important; }
          </style>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6;">
          <!-- Outer wrapper -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; min-height: 100vh;">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <!-- Main container -->
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #a855f7 100%); padding: 32px 40px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <!-- Logo -->
                            <img src="${baseUrl}/logo/460x460_rounded.png" alt="EmuReady Logo" width="64" height="64" style="display: block; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                            
                            <!-- Brand Name -->
                            <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #ffffff; text-align: center; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                              EmuReady
                            </h1>
                            
                            <!-- Tagline -->
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">
                              Know before you load
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <!-- Notification Badge -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 24px;">
                              ${notification.category}
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Main Message -->
                      <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937; line-height: 1.3;">
                        ${notification.title}
                      </h2>
                      
                      <p style="margin: 0 0 32px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                        ${notification.message}
                      </p>
                      
                      ${
                        notification.actionUrl
                          ? `
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 0 0 32px 0;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="25%" fillcolor="#3b82f6">
                              <w:anchorlock/>
                              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">View Details</center>
                            </v:roundrect>
                            <![endif]-->
                            <!--[if !mso]><!-->
                            <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #a855f7 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.2s ease;">
                              View Details
                            </a>
                            <!--<![endif]-->
                          </td>
                        </tr>
                      </table>
                      `
                          : ''
                      }
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <!-- Community Message -->
                            <div style="text-align: center; margin-bottom: 20px;">
                              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e7eb;">
                                <div style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%;"></div>
                                <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Built with ❤️ for the emulation community</span>
                              </div>
                            </div>
                            
                            <!-- Manage Preferences -->
                            <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; text-align: center;">
                              You're receiving this email because you have notifications enabled for ${notification.category.toLowerCase()} updates.
                            </p>
                            
                            <p style="margin: 0 0 16px 0; font-size: 14px; text-align: center;">
                              <a href="${baseUrl}/profile?tab=notifications" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Manage your notification preferences</a>
                            </p>
                            
                            <!-- Copyright -->
                            <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                              © ${new Date().getFullYear()} EmuReady. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <!-- Email client compatibility note -->
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                  <tr>
                    <td style="padding: 20px; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                        If you're having trouble viewing this email, <a href="${baseUrl}" style="color: #3b82f6; text-decoration: none;">view it in your browser</a>.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    const textContent = `
🎮 EmuReady - Know before you load
${'-'.repeat(50)}

${notification.category.toUpperCase()} NOTIFICATION

${notification.title}

${notification.message}

${notification.actionUrl ? `👀 View Details: ${actionUrl}` : ''}

${'-'.repeat(50)}
NOTIFICATION SETTINGS
You're receiving this email because you have notifications enabled for ${notification.category.toLowerCase()} updates.

Manage your preferences: ${baseUrl}/profile?tab=notifications

${'-'.repeat(50)}
Built with ❤️ for the emulation community
© ${new Date().getFullYear()} EmuReady. All rights reserved.

Having trouble? View this email in your browser: ${baseUrl}
    `.trim()

    return { subject, htmlContent, textContent }
  }

  private async sendWithSendGrid(
    to: string,
    template: EmailTemplate,
  ): Promise<NotificationDeliveryResult> {
    // SendGrid implementation
    const sgMail = await import('@sendgrid/mail')
    sgMail.default.setApiKey(this.config.apiKey)

    await sgMail.default.send({
      to,
      from: `${this.config.fromName} <${this.config.fromEmail}>`,
      subject: template.subject,
      text: template.textContent,
      html: template.htmlContent,
    })

    return {
      success: true,
      channel: 'EMAIL',
      status: 'SENT',
    }
  }

  private async sendWithMailerSend(
    to: string,
    template: EmailTemplate,
  ): Promise<NotificationDeliveryResult> {
    // MailerSend implementation
    const { MailerSend, EmailParams, Sender, Recipient } = await import(
      'mailersend'
    )

    const mailerSend = new MailerSend({
      apiKey: this.config.apiKey,
    })

    const sentFrom = new Sender(this.config.fromEmail, this.config.fromName)
    const recipients = [new Recipient(to)]

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(template.subject)
      .setHtml(template.htmlContent)
      .setText(template.textContent)

    await mailerSend.email.send(emailParams)

    return {
      success: true,
      channel: 'EMAIL',
      status: 'SENT',
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Send a test email to verify configuration
      const testNotification: NotificationData = {
        userId: 'test',
        type: 'MAINTENANCE_NOTICE',
        category: 'SYSTEM',
        title: 'Email Service Test',
        message: 'This is a test email to verify your email configuration.',
        deliveryChannel: 'EMAIL',
      }

      const result = await this.sendNotificationEmail(
        this.config.fromEmail,
        testNotification,
      )

      return result.success
    } catch (error) {
      console.error('Email service test failed:', error)
      return false
    }
  }
}

// Email service factory
export function createEmailService(): EmailService | null {
  const provider = process.env.EMAIL_PROVIDER as EmailConfig['provider']
  const apiKey = process.env.EMAIL_API_KEY
  const fromEmail = process.env.EMAIL_FROM_ADDRESS
  const fromName = process.env.EMAIL_FROM_NAME || 'EmuReady'

  if (!provider || !apiKey || !fromEmail) {
    console.warn(
      'Email service not configured. Email notifications will be disabled.',
    )
    return null
  }

  return new EmailService({
    provider,
    apiKey,
    fromEmail,
    fromName,
  })
}

export { EmailService }
export type { EmailConfig, EmailTemplate }
