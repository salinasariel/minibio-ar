export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', // primary, secondary, destructive, ghost
  size = 'medium', // small, medium, large
  fullWidth = false, 
  disabled = false,
  loading = false,
  icon = null,
  className = '' 
}) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-full
    transition-all duration-150
    active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-4
    ${fullWidth ? 'w-full' : 'w-fit'}
  `;

  const variants = {
    primary: `
      bg-[#007AFF] text-white
      hover:bg-[#0051D5]
      focus:ring-blue-200
      shadow-lg shadow-blue-500/30
      hover:shadow-xl hover:shadow-blue-500/40
    `,
    secondary: `
      bg-gray-100 text-gray-900
      hover:bg-gray-200
      focus:ring-gray-200
      shadow-md
    `,
    destructive: `
      bg-[#FF3B30] text-white
      hover:bg-[#FF1E12]
      focus:ring-red-200
      shadow-lg shadow-red-500/30
    `,
    ghost: `
      bg-transparent text-[#007AFF]
      hover:bg-blue-50
      focus:ring-blue-100
    `,
    glass: `
      bg-white/70 backdrop-blur-md text-gray-900
      border border-white/30
      hover:bg-white/80
      shadow-lg shadow-black/10
      focus:ring-white/50
    `,
  };

  const sizes = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              fill="none"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}