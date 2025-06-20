import { notificationBatchingService } from './batchingService'
import { notificationService } from './service'

export function initializeNotificationService(): void {
  notificationService.setupEventListeners()

  // Initialize the batching service by referencing it
  // This ensures the singleton is created and starts processing
  const queueStatus = notificationBatchingService.getQueueStatus()

  console.log('Notification service initialized')
  console.log(
    `Batching service initialized - Queue: ${queueStatus.queueLength} items`,
  )
}
