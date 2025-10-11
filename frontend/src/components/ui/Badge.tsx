import { ComponentPropsWithoutRef, forwardRef } from 'react'

interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-gray-100 text-gray-800 border-gray-300',
      success: 'bg-green-100 text-green-800 border-green-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      error: 'bg-red-100 text-red-800 border-red-300',
      info: 'bg-blue-100 text-blue-800 border-blue-300',
    }

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge

