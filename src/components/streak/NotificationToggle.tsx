import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff, Loader2 } from 'lucide-react';

export function NotificationToggle() {
  const { isSupported, isSubscribed, isLoading, requestPermission, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant={isSubscribed ? "outline" : "secondary"}
      size="sm"
      onClick={isSubscribed ? unsubscribe : requestPermission}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <BellOff className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      {isSubscribed ? 'Disable Reminders' : 'Enable Reminders'}
    </Button>
  );
}
