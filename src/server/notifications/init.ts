import { notificationService } from './service'

export function initializeNotificationService(): void {
  notificationService.setupEventListeners()

  console.log('Notification service initialized')
}
