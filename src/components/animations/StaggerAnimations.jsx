'use client';

export function StaggerContainer({ children, className = '', as = 'div', ...props }) {
  const Component = as;
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
}

export function StaggerItem({ children, className = '', as = 'div', ...props }) {
  const Component = as;
  return (
    <Component className={`transition-all duration-300 ease-out ${className}`} {...props}>
      {children}
    </Component>
  );
}
