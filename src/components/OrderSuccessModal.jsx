'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Check, Leaf, X, Copy } from 'lucide-react';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Link from 'next/link';

export default function OrderSuccessModal({ isOpen, onClose, orderId }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Checking if the user is authenticated
  const isSignedIn = status === 'authenticated';
  
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
    }
  }, [isOpen]);

  const handleCopy = () => {
    const textToCopy = orderId || '#123456789-054';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (onClose) onClose();
    router.push('/');
  };

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    if (onClose) onClose();
    router.push(href);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent 
        showCloseButton={false} 
        className="sm:max-w-md p-0 overflow-hidden border border-border/80 bg-card text-center w-[92vw] max-w-[420px] rounded-2xl shadow-lg"
      >
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes boom {
            0% { transform: scale(0) translate(0, 0); opacity: 1; }
            100% { transform: scale(1) translate(var(--tx), var(--ty)); opacity: 1; }
          }
          @keyframes popIn {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .particle {
            animation: boom 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          }
          .pop-in {
            animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}} />

        <div className="relative p-6 pt-12 pb-7 flex flex-col items-center overflow-hidden">
          
          {/* Party Boom / Confetti Effect SVG */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center top-[-100px] z-0">
               {/* Leaf Particles */}
               <div className="absolute opacity-80 particle" style={{ '--tx': '-110px', '--ty': '-90px' }}><Leaf className="text-primary size-6 rotate-45" strokeWidth={1.5} /></div>
               <div className="absolute opacity-80 particle" style={{ '--tx': '120px', '--ty': '-70px' }}><Leaf className="text-primary size-5 -rotate-12" strokeWidth={1.5} /></div>
               <div className="absolute opacity-80 particle" style={{ '--tx': '-85px', '--ty': '85px' }}><Leaf className="text-primary size-7 rotate-90" strokeWidth={1.5} /></div>
               <div className="absolute opacity-80 particle" style={{ '--tx': '105px', '--ty': '95px' }}><Leaf className="text-primary size-4 -rotate-45" strokeWidth={1.5} /></div>
               {/* Circle Particles */}
               <div className="absolute opacity-80 particle" style={{ '--tx': '-45px', '--ty': '-130px' }}><div className="w-2 h-2 rounded-full bg-primary" /></div>
               <div className="absolute opacity-80 particle" style={{ '--tx': '65px', '--ty': '-110px' }}><div className="w-3 h-3 rounded-full bg-primary/60" /></div>
               <div className="absolute opacity-80 particle" style={{ '--tx': '-130px', '--ty': '25px' }}><div className="w-2.5 h-2.5 rounded-full bg-primary/80" /></div>
               <div className="absolute opacity-80 particle" style={{ '--tx': '120px', '--ty': '35px' }}><div className="w-2 h-2 rounded-full bg-primary" /></div>
            </div>
          )}

          {/* Close button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <X className="size-4.5" />
          </button>

          {/* Clean Success Icon Badge */}
          <div className="relative mb-5 z-10 pop-in">
            <div className="relative bg-emerald-50 text-primary rounded-full p-3.5 border border-emerald-200/60 shadow-xs">
              <Check className="size-7 stroke-[2.5]" />
            </div>
          </div>

          <DialogHeader className="mb-3 space-y-2 relative z-10">
            <DialogTitle className="text-xl font-bold text-foreground">Order Confirmed!</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed flex flex-col items-center">
              Your order has been placed successfully.
              <span className="flex items-center justify-between gap-3 mt-4 font-semibold text-foreground text-sm tracking-wide bg-muted/40 border border-border/70 px-3.5 py-2 rounded-xl w-full max-w-[260px]">
                <span className="font-mono">{orderId || '#123456789-054'}</span>
                <button 
                  onClick={handleCopy} 
                  className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-all bg-card hover:bg-muted p-1.5 rounded-lg border border-border/70 shadow-2xs"
                  aria-label="Copy Order ID"
                >
                  {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                </button>
              </span>
            </DialogDescription>
          </DialogHeader>

          <p className="text-gray-900 font-medium mb-8 text-[15px] relative z-10">
            Thank you for your purchase!
          </p>

          <div className="w-full space-y-2.5 relative z-10">
            {isSignedIn ? (
              <>
                <button 
                  type="button"
                  onClick={(e) => handleLinkClick(e, '/')}
                  className="flex w-full items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  Continue Shopping
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleLinkClick(e, '/orders')}
                  className="flex w-full items-center justify-center py-3.5 rounded-xl text-sm font-semibold border border-border/80 bg-background text-foreground hover:bg-muted/50 transition-all shadow-xs cursor-pointer"
                >
                  View my order
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={(e) => handleLinkClick(e, '/orders')}
                  className="flex w-full items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  Track your order
                </button>
                
                <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2.5 font-normal text-center">Want to view full order history?</p>
                    <button 
                      type="button"
                      onClick={(e) => handleLinkClick(e, '/auth/signin?callbackUrl=/orders')}
                      className="flex w-full items-center justify-center py-3 rounded-xl text-xs font-semibold border border-border/80 bg-background text-foreground hover:bg-muted/50 transition-all shadow-xs cursor-pointer"
                    >
                      Sign in to your account
                    </button>
                </div>
              </>
            )}
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
