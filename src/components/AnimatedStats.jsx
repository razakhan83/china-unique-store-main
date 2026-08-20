'use client';

import { useEffect, useRef, useState } from 'react';
import { Users, Package, Star, Clock } from 'lucide-react';
import SectionDoodleBackground from '@/components/home/SectionDoodleBackground';
import { cn } from '@/lib/utils';


const STATS = [
  { target: 5000, label: 'Happy Customers', icon: Users, isNumeric: true, prefix: '', suffix: '+' },
  { target: 8500, label: 'Orders Delivered', icon: Package, isNumeric: true, prefix: '', suffix: '+' },
  { target: 98, label: 'Positive Reviews', icon: Star, isNumeric: true, prefix: '', suffix: '%' },
  { target: '24/7', label: 'Customer Support', icon: Clock, isNumeric: false, prefix: '', suffix: '' },
];

function StatItem({ stat, index }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !stat.isNumeric) return;

    let startTime;
    const duration = 2000;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      
      setCount(Math.floor(easeProgress * stat.target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, stat.isNumeric, stat.target]);

  const displayValue = stat.isNumeric 
    ? `${stat.prefix}${count.toLocaleString()}${stat.suffix}`
    : stat.target;

  return (
    <div
      ref={itemRef}
      className={cn(
        'flex flex-col items-center justify-center p-5 sm:p-7 md:p-8 text-center',
        'bg-card border border-border/70 rounded-xl shadow-xs',
        'transition-[opacity,transform] duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="mb-3 flex items-center justify-center text-primary transition-transform duration-300 hover:scale-105">
        <stat.icon strokeWidth={1.75} className="size-6 sm:size-7 md:size-8" />
      </div>
      <div className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1 md:mb-1.5 tabular-nums">
        {displayValue}
      </div>
      <div className="text-[0.7rem] sm:text-xs md:text-xs font-semibold text-muted-foreground uppercase tracking-wider max-w-[120px] md:max-w-[140px] mx-auto leading-tight">
        {stat.label}
      </div>
    </div>
  );
}

export default function AnimatedStats() {
  return (
    <section className="relative w-full bg-background py-16 md:py-24 border-t border-border/40">
      <SectionDoodleBackground />
      <div className="relative z-10 container mx-auto max-w-7xl px-4">
        <div className="mb-14 md:mb-20 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Why Choose <br className="block md:hidden" />
            <span className="text-primary">China Unique Store?</span>
          </h2>
          <p className="mt-6 text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-balance">
            Your trusted source for <span className="font-semibold text-primary">premium kitchenware</span> and <span className="font-semibold text-primary">innovative gadgets</span>. We deliver top-notch imported quality with unbeatable value and a seamless shopping experience.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 md:gap-8">
          {STATS.map((stat, index) => (
            <StatItem key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
