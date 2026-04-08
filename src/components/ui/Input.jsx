const inputBase = `w-full px-3 py-2 rounded-lg text-[13px] font-sans outline-none transition-[border-color,box-shadow]
  bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)]
  placeholder:text-[var(--text-hint)]
  focus:border-[var(--border-active)] focus:shadow-[0_0_0_3px_rgba(0,224,192,0.08)]`;

const labelClass = 'block text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-hint)] mb-1';

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  className = '',
  required = false,
  ...props
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className={labelClass}>
          {label}
          {required && <span className="text-[var(--status-overdue)] ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`${inputBase} ${error ? 'border-[var(--status-overdue)]' : ''}`}
        {...props}
      />
      {error && <p className="text-xs text-[var(--status-overdue)]">{error}</p>}
    </div>
  );
}

export function Select({ label, value, onChange, children, className = '', ...props }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className={labelClass}>{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className={inputBase}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 3, className = '', ...props }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className={labelClass}>{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`${inputBase} resize-none`}
        {...props}
      />
    </div>
  );
}
