import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { format } from 'date-fns';

// Initialize notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Show a toast message
export const showToast = (message: string) => {
  // This is a placeholder - in a real app you would use a toast library
  // For now we'll just console.log the message
  console.log(message);
  
  // In a real implementation, you would use a library like react-native-toast-message
  // or react-native-flash-message to show a toast
};

// Schedule a medication reminder notification
export const scheduleMedicationReminder = async (
  medicationId: string,
  medicationName: string,
  dosage: string,
  time: Date,
  repeats = false
): Promise<string> => {
  try {
    // Get notification permissions if needed
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Notification permissions are required to set reminders');
        return '';
      }
    }
    
    // Format the time for display
    const timeString = format(time, 'h:mm a');
    
    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medication Reminder',
        body: `Time to take ${medicationName} - ${dosage} at ${timeString}`,
        data: { medicationId },
      },
      trigger: repeats
        ? {
            hour: time.getHours(),
            minute: time.getMinutes(),
            repeats: true,
          }
        : time,
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return '';
  }
};

// Cancel a specific notification
export const cancelNotification = async (notificationId: string): Promise<boolean> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.error('Error canceling notification:', error);
    return false;
  }
};

// Cancel all notifications
export const cancelAllNotifications = async (): Promise<boolean> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    return false;
  }
};

// Set up notification listeners
export const setupNotificationListeners = (
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener(onNotificationReceived);
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
  
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};