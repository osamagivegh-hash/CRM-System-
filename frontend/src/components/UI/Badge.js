import React from 'react';

const Badge = ({ children, variant = 'gray', size = 'sm', className = '' }) => {
  const baseClasses = 'badge';
  
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    gray: 'badge-gray',
    primary: 'bg-primary-100 text-primary-800',
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1 text-base',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(' ');

  return <span className={classes}>{children}</span>;
};

export default Badge;












