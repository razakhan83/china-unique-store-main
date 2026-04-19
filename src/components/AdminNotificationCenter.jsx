'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, ShoppingCart, MessageSquare, UserPlus, Circle, CheckCircle2, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  order: ShoppingCart,
  review: MessageSquare,
  user: UserPlus,
};

const COLOR_MAP = {
  order: 'border border-border bg-muted text-foreground',
  review: 'border border-border bg-muted text-foreground',
  user: 'border border-border bg-muted text-foreground',
};

export default function AdminNotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    fetchNotifications();
    return undefined;
  }, [fetchNotifications, open]);

  async function handleRefresh() {
    await fetchNotifications();
    toast.success('Notifications refreshed');
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function markAsRead(id) {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  }

  async function markAllRead() {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success('All notifications marked as read');
      }
    } catch (error) {
       console.error('Failed to mark all as read', error);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group rounded-full border border-border/70 bg-background hover:bg-muted/50">
          <Bell className={cn("size-5 transition-transform group-hover:rotate-12", unreadCount > 0 ? "text-foreground" : "text-muted-foreground")} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background shadow-sm ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] p-0 sm:w-[380px]" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-muted text-foreground">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh notifications"
            >
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
              <span className="sr-only">Refresh notifications</span>
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-semibold text-foreground hover:bg-muted"
                onClick={markAllRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-[350px] sm:h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notification) => {
                const Icon = ICON_MAP[notification.type] || Bell;
                const colorClass = COLOR_MAP[notification.type] || 'text-muted-foreground bg-muted';

                return (
                  <div
                    key={notification._id}
                    className={cn(
                      "group relative flex items-start gap-3 border-b border-border/40 p-3 transition-colors hover:bg-muted/50 sm:p-4",
                      !notification.isRead && "bg-muted/35"
                    )}
                  >
                    {!notification.isRead && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2">
                        <Circle className="size-1.5 fill-foreground text-foreground" />
                      </div>
                    )}
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", colorClass)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1 pr-4">
                      <Link 
                        href={notification.link} 
                        className="text-sm font-semibold leading-tight text-foreground hover:underline"
                        onClick={() => {
                          markAsRead(notification._id);
                          setOpen(false);
                        }}
                      >
                        {notification.message}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!notification.isRead && (
                       <button 
                        onClick={() => markAsRead(notification._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        title="Mark as read"
                       >
                         <CheckCircle2 className="size-4" />
                       </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center px-8 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted/40">
                <Bell className="size-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
        <Separator />
        <Link 
          href="/admin" 
          className="flex h-10 items-center justify-center text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground sm:h-11 sm:text-xs"
          onClick={() => setOpen(false)}
        >
          View Dashboard
          <ChevronRight className="ml-1 size-3" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
