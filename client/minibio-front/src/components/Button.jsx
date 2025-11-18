export default function Button({ children, onClick, type = 'button', fullWidth = false, className = '' }) {
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      className={`py-3 px-5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
}