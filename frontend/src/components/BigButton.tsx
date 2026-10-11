import React from 'react';

interface BigButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const BigButton: React.FC<BigButtonProps> = ({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseClasses =
    'farmer-touch-target flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg sm:text-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary: 'bg-emerald-700 text-white hover:bg-emerald-800 border-2 border-emerald-900 shadow-emerald-900/10',
    secondary: 'bg-white text-emerald-900 hover:bg-emerald-50 border-2 border-emerald-700 shadow-sm',
    accent: 'bg-amber-600 text-white hover:bg-amber-700 border-2 border-amber-800 shadow-amber-900/10',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-2 border-red-800 shadow-red-900/10',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
