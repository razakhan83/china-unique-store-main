'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import CopyButton from '@/components/CopyButton';
import { Truck, RefreshCw, CheckCircle2, Clock, MapPin, PackageCheck } from 'lucide-react';

export default function NocTrackingModal({
  open,
  onOpenChange,
  trackingNumber,
  orderId,
  courierName = 'Courier',
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchTracking = useCallback(async () => {
    if (!trackingNumber && !orderId) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (trackingNumber) params.set('trackingNumber', trackingNumber);
      if (orderId) params.set('orderId', orderId);

      const res = await fetch(`/api/courier/track?${params.toString()}`);
      const result = await res.json();

      if (result.success) {
        setData(result);
        if (result.fetchError) {
          setError(result.fetchError);
        }
      } else {
        setError(result.error || 'Failed to fetch tracking data');
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setError('Connection error while fetching tracking info.');
    } finally {
      setLoading(false);
    }
  }, [trackingNumber, orderId]);

  useEffect(() => {
    if (open) {
      fetchTracking();
    }
  }, [open, fetchTracking]);

  const effectiveTrackingNo = trackingNumber || data?.trackingNumber || 'N/A';
  const events = data?.events || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl p-0 gap-0 overflow-hidden rounded-2xl border border-border shadow-2xl">
        {/* Header Section */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 pr-14 relative">
          <DialogHeader className="p-0 text-left gap-1">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <Truck className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  Shipment Tracking
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px] px-2 py-0.5 font-medium">
                    Live Status
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300">
                  Real-time parcel delivery updates
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Tracking Number Bar */}
          <div className="mt-4 p-3 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between gap-2">
            <div className="min-w-0 flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Waybill / Tracking #</span>
              <span className="font-mono font-bold text-sm text-sky-300 truncate">
                {effectiveTrackingNo}
              </span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {effectiveTrackingNo !== 'N/A' && (
                <CopyButton textToCopy={effectiveTrackingNo} className="h-8 text-xs bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:text-white hover:bg-slate-700 size-8 rounded-lg"
                onClick={fetchTracking}
                disabled={loading}
                title="Refresh tracking data"
              >
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto flex flex-col gap-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <Spinner className="size-8 text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Fetching live parcel status...</p>
            </div>
          ) : error && events.length === 0 ? (
            <Alert className="bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-300 rounded-xl p-4">
              <PackageCheck className="size-5 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="font-semibold text-amber-900 dark:text-amber-200">Preparing Shipment</AlertTitle>
              <AlertDescription className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed mt-1">
                Your parcel is registered and being prepared. Live transit checkpoints will activate as soon as scanned at the distribution hub.
              </AlertDescription>
            </Alert>
          ) : events.length === 0 ? (
            <div className="py-8 flex flex-col items-center text-center gap-2">
              <div className="size-12 rounded-full bg-sky-50 dark:bg-slate-800 flex items-center justify-center text-sky-600">
                <Clock className="size-6" />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Shipment Booked & In Process</h4>
              <p className="text-xs text-muted-foreground max-w-xs">
                Your parcel is registered. Detailed transit events will appear here once picked up by courier.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 flex flex-col gap-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {events.map((event, idx) => {
                const isLatest = idx === 0;
                return (
                  <div key={idx} className="relative group">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-6 top-0.5 size-5 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                        isLatest
                          ? 'bg-emerald-500 border-emerald-200 text-white shadow-sm ring-4 ring-emerald-500/10'
                          : 'bg-slate-200 dark:bg-slate-700 border-white dark:border-slate-900 text-slate-500'
                      }`}
                    >
                      {isLatest ? <CheckCircle2 className="size-3" /> : <div className="size-1.5 rounded-full bg-slate-400" />}
                    </div>

                    {/* Timeline Card */}
                    <div className={`p-3.5 rounded-xl border transition-colors ${isLatest ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50' : 'bg-card border-border'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold text-sm ${isLatest ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>
                          {event.status}
                        </span>
                        {event.dateTime && (
                          <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                            {event.dateTime}
                          </span>
                        )}
                      </div>

                      {event.remarks && event.remarks !== '------' && (
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                          <MapPin className="size-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>{event.remarks}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-muted/40 border-t border-border sm:justify-between flex-row items-center gap-2">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Real-time delivery status updates
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl px-5">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
