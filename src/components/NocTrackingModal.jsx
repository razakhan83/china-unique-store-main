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
import { Spinner } from '@/components/ui/spinner';
import CopyButton from '@/components/CopyButton';
import { Truck, RefreshCw, CheckCircle2, Clock, MapPin, PackageCheck, AlertCircle } from 'lucide-react';

export default function NocTrackingModal({
  open,
  onOpenChange,
  trackingNumber,
  orderId,
  courierName = 'NOC Express',
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
  const effectiveCourier = courierName || data?.courierName || 'NOC Express';
  const events = data?.events || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header Section */}
        <div className="p-5 sm:p-6 pb-3 border-b border-border bg-background relative">
          <div className="flex items-start justify-between gap-3 pr-8 sm:pr-0">
            <DialogHeader className="p-0 text-left gap-1">
              <div className="flex items-center gap-2">
                <Truck className="size-5 text-primary shrink-0" />
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  Shipment Tracking
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5">
                    Live
                  </Badge>
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Live courier updates and delivery checkpoints
              </DialogDescription>
            </DialogHeader>

            {/* Top Header Refresh / Reload Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-lg border-border text-foreground hover:bg-muted text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
              onClick={fetchTracking}
              disabled={loading}
              title="Refresh tracking status"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reload</span>
            </Button>
          </div>

          {/* Prominent Courier & Tracking Card */}
          <div className="mt-4 p-3.5 rounded-xl border border-border bg-muted/35 flex flex-col gap-2.5 shadow-2xs">
            {/* Courier Name Row */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Courier Partner
                </span>
                <span className="text-sm font-bold text-foreground">
                  {effectiveCourier}
                </span>
              </div>
              <CopyButton 
                textToCopy={effectiveCourier} 
                className="h-7 px-2.5 text-[11px] rounded-md font-medium border-border" 
              />
            </div>

            {/* Tracking / Waybill Number Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Waybill / Tracking #
                </span>
                <span className="font-mono font-extrabold text-base sm:text-lg text-foreground tracking-wide select-all truncate">
                  {effectiveTrackingNo}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {effectiveTrackingNo !== 'N/A' && (
                  <CopyButton 
                    textToCopy={effectiveTrackingNo} 
                    className="h-8 px-2.5 text-xs rounded-md font-medium border-border" 
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 max-h-[50vh] overflow-y-auto flex flex-col gap-4">
          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center text-center gap-2.5">
              <Spinner className="size-6 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Connecting to {effectiveCourier}...</p>
            </div>
          ) : events.length === 0 ? (
            /* Clean Fallback State (No extra dabbas) */
            <div className="py-6 flex flex-col items-center text-center gap-2.5">
              <Clock className="size-8 text-primary/80" />
              <div className="space-y-1 max-w-sm">
                <h4 className="font-bold text-foreground text-sm">Shipment Booked & In Transit</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your parcel is booked under <strong>{effectiveTrackingNo}</strong>. Live hub checkpoints are currently synchronizing with {effectiveCourier}.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={fetchTracking} 
                  disabled={loading}
                  className="rounded-lg text-xs font-semibold gap-1.5 h-8.5 cursor-pointer"
                >
                  <RefreshCw className="size-3" />
                  Try Again
                </Button>
                {effectiveTrackingNo !== 'N/A' && (
                  <a
                    href="https://www.shipnoc.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
                  >
                    Track on NOC Website
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* Timeline Events View */
            <div className="relative pl-5 flex flex-col gap-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {events.map((event, idx) => {
                const isLatest = idx === 0;
                return (
                  <div key={idx} className="relative">
                    {/* Timeline Dot */}
                    <div
                      className={`absolute -left-5 top-1 size-4 rounded-full border-2 flex items-center justify-center ${
                        isLatest
                          ? 'bg-primary border-primary/30 text-primary-foreground'
                          : 'bg-muted border-card text-muted-foreground'
                      }`}
                    >
                      {isLatest ? <CheckCircle2 className="size-2.5" /> : <div className="size-1 rounded-full bg-muted-foreground/60" />}
                    </div>

                    {/* Timeline Info */}
                    <div className={`p-3.5 rounded-xl border ${isLatest ? 'bg-primary/[0.04] border-primary/30' : 'bg-card border-border'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold text-xs sm:text-sm ${isLatest ? 'text-primary font-bold' : 'text-foreground'}`}>
                          {event.status}
                        </span>
                        {event.dateTime && (
                          <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                            {event.dateTime}
                          </span>
                        )}
                      </div>

                      {event.remarks && event.remarks !== '------' && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1">
                          <MapPin className="size-3 text-muted-foreground/70 shrink-0 mt-0.5" />
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

        {/* Footer with Reset Margins (No negative margin leakage) */}
        <div className="px-5 sm:px-6 py-3.5 bg-muted/20 border-t border-border flex items-center justify-between gap-3 w-full">
          <span className="text-xs text-muted-foreground font-medium truncate">
            Courier: <strong className="text-foreground">{effectiveCourier}</strong>
          </span>
          <Button 
            variant="admin-destructive" 
            size="sm" 
            onClick={() => onOpenChange(false)} 
            className="rounded-lg px-5 text-xs font-bold !bg-red-600 !text-white hover:!bg-red-700 shadow-xs shrink-0 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
