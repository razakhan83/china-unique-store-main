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
    // Refresh to home page immediately without waiting
    window.location.href = '/';
  };

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    if (onClose) onClose();
    window.location.href = href;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent 
        showCloseButton={false} 
        className="sm:max-w-md p-0 overflow-hidden border-none bg-[#F7F8F7] text-center w-[92vw] max-w-[420px] rounded-[24px] shadow-2xl"
      >
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes boom {
            0% { transform: scale(0) translate(0, 0); opacity: 1; }
            100% { transform: scale(1) translate(var(--tx), var(--ty)); opacity: 1; }
          }
          @keyframes popIn {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .particle {
            animation: boom 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          }
          .pop-in {
            animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}} />

        <div className="relative p-6 pt-14 pb-8 flex flex-col items-center overflow-hidden">
          
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
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-black/5 rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          {/* Icon with glowing effect */}
          <div className="relative mb-6 z-10 pop-in">
            <div className="absolute inset-0 bg-[#D2FAE8] blur-[24px] opacity-60 rounded-full animate-pulse scale-150"></div>
            <div className="relative bg-[#D2FAE8] text-primary rounded-full p-4 shadow-lg ring-4 ring-white">
              <Check className="size-8 stroke-[3]" />
            </div>
          </div>

          <DialogHeader className="mb-4 space-y-3 relative z-10">
            <DialogTitle className="text-[22px] font-bold text-gray-900 mb-2">Order Confirmed!</DialogTitle>
            <DialogDescription className="text-gray-800 text-[15px] max-w-[280px] mx-auto leading-relaxed flex flex-col items-center">
              Your order has been placed successfully.
              <span className="flex items-center justify-between gap-3 mt-5 font-bold text-gray-800 text-[15px] tracking-wide bg-white border border-gray-200 px-4 py-2.5 rounded-xl w-full max-w-[260px] shadow-sm">
                <span className="font-mono">{orderId || '#123456789-054'}</span>
                <button 
                  onClick={handleCopy} 
                  className="flex items-center justify-center text-gray-500 hover:text-primary transition-all bg-gray-50 hover:bg-gray-100 p-2 rounded-lg border border-gray-200"
                  aria-label="Copy Order ID"
                >
                  {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                </button>
              </span>
            </DialogDescription>
          </DialogHeader>

          <p className="text-gray-900 font-medium mb-8 text-[15px] relative z-10">
            Thank you for your purchase!
          </p>

          <div className="w-full space-y-3 relative z-10">
            {isSignedIn ? (
              <>
                <a 
                  href="/"
                  onClick={(e) => handleLinkClick(e, '/')}
                  className="flex w-full items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl text-[15px] font-medium transition-all shadow-sm"
                >
                  Continue Shopping
                </a>
                <a 
                  href="/orders"
                  onClick={(e) => handleLinkClick(e, '/orders')}
                  className="flex w-full items-center justify-center py-4 rounded-xl text-[15px] font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                >
                  View my order
                </a>
              </>
            ) : (
              <>
                <a 
                  href="/orders"
                  onClick={(e) => handleLinkClick(e, '/orders')}
                  className="flex w-full items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl text-[15px] font-medium transition-all shadow-sm"
                >
                  Track your order
                </a>
                
                <div className="pt-3">
                    <p className="text-[13px] text-gray-500 mb-3 font-medium text-center">Want to view full order history?</p>
                    <a 
                      href="/auth/signin?callbackUrl=/orders"
                      onClick={(e) => handleLinkClick(e, '/auth/signin?callbackUrl=/orders')}
                      className="flex w-full items-center justify-center py-3.5 rounded-xl text-[14px] font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                      Sign in to your account
                    </a>
                </div>
              </>
            )}
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
