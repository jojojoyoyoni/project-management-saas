import { apiClient } from '@/api/client'

export const getNotifications = async () => {
  return apiClient('/notifications/')
}

export const markNotificationsRead = async () => {
  return apiClient('/notifications/mark_all_read/', { method: 'POST' })
}