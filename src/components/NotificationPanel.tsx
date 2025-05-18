import React, { useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Notification, NotificationType } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from './ui/button';

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markAsRead, markAllAsRead, setNotifications, unreadCount } = useNotificationStore();
  
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const { data: notificationsData, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', data.session.user.id)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) {
          console.error('Error fetching notifications:', error);
          return;
        }
        
        if (notificationsData) {
          const formattedNotifications: Notification[] = notificationsData.map(n => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            message: n.message,
            type: n.type as NotificationType,
            isRead: n.is_read,
            relatedEntityId: n.related_entity_id,
            relatedEntityType: n.related_entity_type,
            createdAt: n.created_at
          }));
          
          setNotifications(formattedNotifications);
        }
      }
    };
    
    fetchNotifications();
    
    // Subscribe to realtime notifications
    const notificationSubscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        // Add new notification if it's for the current user
        console.log('New notification:', payload);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(notificationSubscription);
    };
  }, []);
  
  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) throw error;
      markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', data.session.user.id)
          .eq('is_read', false);
          
        if (error) throw error;
        markAllAsRead();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TASK:
        return (
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-300">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
          </div>
        );
      case NotificationType.PROJECT:
        return (
          <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-300">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        );
      case NotificationType.ANNOUNCEMENT:
        return (
          <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 dark:text-yellow-300">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
            <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="fixed top-0 right-0 h-full w-full sm:w-96 bg-card shadow-xl z-50 overflow-hidden flex flex-col"
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          <h2 className="font-semibold text-lg">Notifications</h2>
          {unreadCount > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
              {unreadCount} new
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="p-2 border-b border-border">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-sm justify-center"
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You're all caught up! Notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-muted/50 transition-colors ${
                  !notification.isRead ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.createdAt, 'PPp')}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}