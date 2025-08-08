/**
 * @fileoverview Notifications store
 * @author School Management System
 * @created 2025-01-08
 */

import { writable } from 'svelte/store';
import { generateId } from '$lib/utils.js';

// Notifications store
export const notifications = writable([]);

/**
 * Add notification
 * @param {Object} notification - Notification object
 * @param {string} notification.type - Notification type (success, error, warning, info)
 * @param {string} notification.message - Notification message
 * @param {number} [notification.duration=5000] - Auto dismiss duration in ms
 */
export const addNotification = (notification) => {
  const id = generateId();
  const newNotification = {
    id,
    type: notification.type || 'info',
    message: notification.message,
    duration: notification.duration || 5000,
    timestamp: Date.now()
  };
  
  notifications.update(items => [...items, newNotification]);
  
  // Auto dismiss
  if (newNotification.duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);
  }
  
  return id;
};

/**
 * Remove notification
 * @param {string} id - Notification ID
 */
export const removeNotification = (id) => {
  notifications.update(items => items.filter(item => item.id !== id));
};

/**
 * Clear all notifications
 */
export const clearNotifications = () => {
  notifications.set([]);
};

/**
 * Show success notification
 * @param {string} message - Success message
 * @param {number} [duration=5000] - Auto dismiss duration
 */
export const showSuccess = (message, duration = 5000) => {
  return addNotification({ type: 'success', message, duration });
};

/**
 * Show error notification
 * @param {string} message - Error message
 * @param {number} [duration=8000] - Auto dismiss duration
 */
export const showError = (message, duration = 8000) => {
  return addNotification({ type: 'error', message, duration });
};

/**
 * Show warning notification
 * @param {string} message - Warning message
 * @param {number} [duration=6000] - Auto dismiss duration
 */
export const showWarning = (message, duration = 6000) => {
  return addNotification({ type: 'warning', message, duration });
};

/**
 * Show info notification
 * @param {string} message - Info message
 * @param {number} [duration=5000] - Auto dismiss duration
 */
export const showInfo = (message, duration = 5000) => {
  return addNotification({ type: 'info', message, duration });
};