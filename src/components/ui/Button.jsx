const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const sizeStyle = size === 'sm' ? 'text-xs px-3 py-1' : size === 'lg' ? 'text-sm px-6 py-3' : '';
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${variantClasses[variant] || variantClasses.primary} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
