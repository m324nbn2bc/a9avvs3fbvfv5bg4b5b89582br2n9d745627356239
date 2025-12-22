/**
 * ErrorAlert Component
 * Reusable error message display with consistent styling
 * 
 * @param {string} error - The error message to display
 * @param {React.ReactNode} children - Optional additional content (e.g., help text)
 * @param {string} variant - Style variant: 'simple' (default) or 'bordered'
 */
export default function ErrorAlert({ error, children, variant = 'simple' }) {
  if (!error) return null;

  if (variant === 'bordered') {
    return (
      <div 
        className="text-sm p-3 rounded-lg border text-red-800 bg-red-50 border-red-200"
        role="alert"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-lg" role="alert">
      <div>{error}</div>
      {children}
    </div>
  );
}
