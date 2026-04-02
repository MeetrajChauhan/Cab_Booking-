function Input({
  label,
  type,
  name,
  placeholder,
  defaultValue,
  register,
  error,
  options,
  disabled,
  variant = "light",
}) {
  const isDark = variant === "dark";

  return (
    <div className="space-y-2">
      <label className={`block text-sm font-bold ${isDark ? "text-slate-200" : "text-gray-900"}`}>
        {label}
      </label>
      {type == "select" ? (
        <select
          {...register(name)}
          defaultValue={defaultValue}
          className={`w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 
            ${disabled 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
              : isDark
                ? "bg-slate-900 border border-white/10 text-white focus:border-emerald-400"
                : "bg-gray-100 border border-gray-200 text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
            }`}
        >
          {options.map((option) => {
            return (
              <option key={option} value={option.toLowerCase()} className="w-full">
                {option}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          {...register(name)}
          type={type || "text"}
          placeholder={placeholder || label}
          className={`w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200
            ${error 
              ? "bg-red-50 border border-red-300 text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
              : disabled 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                : isDark
                  ? "bg-slate-900 border border-white/10 text-white focus:border-emerald-400"
                  : "bg-gray-100 border border-gray-200 text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black"
            }`}
          disabled={disabled}
          defaultValue={defaultValue}
        />
      )}
      {error && (
        <p className="text-xs font-medium text-red-600 mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default Input;
