import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  icon,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105 active:scale-100';

  const variantClasses = {
    primary: 'bg-[#1DB954] text-black hover:bg-[#1ed760] focus-visible:ring-[#1DB954]',
    secondary: 'bg-zinc-800 text-gray-200 hover:bg-zinc-700 focus-visible:ring-zinc-600',
    outline: 'bg-transparent border border-zinc-700 text-gray-300 hover:bg-zinc-800 focus-visible:ring-zinc-600',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        icon && <span className="mr-2 -ml-1">{icon}</span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
};