
"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { toast } from 'sonner';

interface Notification {
  id: number;
  merchant_id?: number;
  customer_id?: number;
  order_id?: number;
  type: string;
  channel: string;
  recipient: string;
  subject?: string;
  message: string;
  status: string;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  metadata?: any;
  create_time: string;
  modify_time: string;
}

interface UseNotificationsOptions {
  merchantId?: number;
  customerId?: number;
  type?: string;
  channel?: string;
  status?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (searchParams?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    
    try {
      const params: Record<string, string> = {
        limit: '100',
        offset: '0',
        ...searchParams
      };

      if (options.merchantId) {
        params.merchant_id = options.merchantId.toString();
      }

      if (options.customerId) {
        params.customer_id = options.customerId.toString();
      }

      if (options.type) {
        params.type = options.type;
      }

      if (options.channel) {
        params.channel = options.channel;
      }

      if (options.status) {
        params.status = options.status;
      }

      const data = await api.get<Notification[]>('/notifications', params);
      setNotifications(data || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des notifications';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [options.merchantId, options.customerId, options.type, options.channel, options.status]);

  const sendNotification = async (notificationData: {
    type: string;
    channel: string;
    recipient: string;
    message: string;
    subject?: string;
    merchant_id?: number;
    customer_id?: number;
    order_id?: number;
    metadata?: any;
  }) => {
    try {
      const newNotification = await api.post<Notification>('/notifications', {
        ...notificationData,
        merchant_id: options.merchantId || notificationData.merchant_id
      });
      setNotifications(prev => [newNotification, ...prev]);
      toast.success('Notification envoyée avec succès');
      return newNotification;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de l\'envoi de la notification';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateNotificationStatus = async (notificationId: number, status: string) => {
    try {
      const updatedNotification = await api.put<Notification>(`/notifications?id=${notificationId}`, {
        status
      });
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId ? updatedNotification : notification
      ));
      return updatedNotification;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour du statut';
      toast.error(errorMessage);
      throw err;
    }
  };

  const cancelNotification = async (notificationId: number) => {
    try {
      await api.delete(`/notifications?id=${notificationId}`);
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, status: 'cancelled', modify_time: new Date().toISOString() }
          : notification
      ));
      toast.success('Notification annulée');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de l\'annulation';
      toast.error(errorMessage);
      throw err;
    }
  };

  const getNotificationsByStatus = (status: string): Notification[] => {
    return notifications.filter(notification => notification.status === status);
  };

  const getNotificationsByChannel = (channel: string): Notification[] => {
    return notifications.filter(notification => notification.channel === channel);
  };

  const getNotificationsByType = (type: string): Notification[] => {
    return notifications.filter(notification => notification.type === type);
  };

  const getPendingNotifications = (): Notification[] => {
    return notifications.filter(notification => notification.status === 'pending');
  };

  const getFailedNotifications = (): Notification[] => {
    return notifications.filter(notification => notification.status === 'failed');
  };

  // Auto-refresh si activé
  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(() => {
        fetchNotifications();
      }, options.refreshInterval || 30000); // 30 secondes par défaut

      return () => clearInterval(interval);
    }
  }, [fetchNotifications, options.autoRefresh, options.refreshInterval]);

  // Chargement initial
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    sendNotification,
    updateNotificationStatus,
    cancelNotification,
    getNotificationsByStatus,
    getNotificationsByChannel,
    getNotificationsByType,
    getPendingNotifications,
    getFailedNotifications,
    refresh: fetchNotifications
  };
}
