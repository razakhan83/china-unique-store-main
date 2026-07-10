'use client';

import { useEffect, useRef, useState } from 'react';
import { Users, Package, Star, Clock } from 'lucide-react';
import SectionDoodleBackground from '@/components/home/SectionDoodleBackground';

const STATS = [
  { target: 5000, label: 'Happy Customers', icon: Users, color: 'bg-orange-500/10', isNumeric: true, prefix: '', suffix: '+' },
  { target: 8500, label: 'Orders Delivered', icon: Package, color: 'bg-green-500/10', isNumeric: true, prefix: '', suffix: '+' },
  { target: 98, label: 'Positive Reviews', icon: Star, color: 'bg-blue-500/10', isNumeric: true, prefix: '', suffix: '%' },
  { target: '24/7', label: 'Customer Support', icon: Clock, color: 'bg-purple-500/10', isNumeric: false, prefix: '', suffix: '' },
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
    const duration = 2000; // 2 seconds for a more normal, snappy count

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Standard smooth easing function (easeOutQuad)
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
      className={`flex flex-col items-center justify-center p-5 sm:p-8 md:p-10 text-center transition-all duration-1000 ease-out ${stat.color} rounded-tl-3xl md:rounded-tl-[3rem] rounded-br-3xl md:rounded-br-[3rem] rounded-tr-lg md:rounded-tr-xl rounded-bl-lg md:rounded-bl-xl ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-16 opacity-0 scale-95'
      }`}
      style={{ transitionDelay: `${index * 200}ms` }}
    >
      <div className="mb-3 sm:mb-4 md:mb-6 flex items-center justify-center transition-transform duration-700 hover:scale-110 hover:-translate-y-2 text-foreground/80">
        <stat.icon strokeWidth={1.5} className="size-8 sm:size-10 md:size-20" />
      </div>
      <div className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2 md:mb-3">
        {displayValue}
      </div>
      <div className="text-[0.65rem] sm:text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider max-w-[100px] md:max-w-[150px] mx-auto leading-tight md:leading-relaxed">
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
            Why Choose China Unique Store?
          </h2>
          <p className="mt-6 text-muted-foreground text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
            We bring the best of imported Chinese innovation directly to your doorstep. Specializing in premium kitchenware, the latest tech gadgets, and a wide variety of lifestyle essentials, we guarantee top-notch quality in everything we sell. Experience unbeatable value, a seamless shopping experience, and dedicated customer support with every order.
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
