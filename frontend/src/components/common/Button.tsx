import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import Spinner from './Spinner' // Assuming you have a Spinner component

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  isLoading?: boolean
  children: ReactNode
}

export default function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className, 
  disabled, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  }

  return (
    <button
      className={clsx(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2"><Spinner /></span>
      ) : null}
      {children}
    </button>
  )
}