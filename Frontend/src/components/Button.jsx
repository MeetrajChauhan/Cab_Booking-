import { Link } from "react-router-dom";
import Spinner from "./Spinner";

/**
 * Button Component with multiple size variants
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {string} variant - 'primary' | 'secondary' | 'danger' | 'ghost' (default: 'primary')
 * @param {boolean} fullWidth - Make button full width (default: true)
 */
function Button({ 
  path, 
  title, 
  icon, 
  type, 
  classes, 
  fun, 
  loading, 
  loadingMessage, 
  disabled,
  size = "md",
  variant = "primary",
  fullWidth = true
}) {
  // Define button size classes
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  // Define button variant colors
  const variantClasses = {
    primary: "bg-black hover:bg-gray-800 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-black",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent hover:bg-gray-100 text-black border border-gray-300",
  };

  const baseClasses = `
    flex justify-center items-center gap-2 font-semibold rounded-2xl cursor-pointer 
    transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
  `;

  const widthClasses = fullWidth ? "w-full" : "";
  const finalClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClasses} ${classes}`;

  return (
    <>
      {type == "link" ? (
        <Link
          to={path}
          className={finalClasses}
        >
          {title} {icon}
        </Link>
      ) : (
        <button
          type={type || null}
          className={finalClasses}
          onClick={fun}
          disabled={loading || disabled}
        >
          {loading ? <span className="flex gap-1"><Spinner />{loadingMessage || title}</span> : title}
        </button>
      )}
    </>
  );
}

export default Button;
