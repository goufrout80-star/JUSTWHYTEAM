export default function Avatar({ username, color, size = 'md', className = '' }) {
  const dims = { sm: 28, md: 32, lg: 40 };
  const px = dims[size] || 32;
  const fs = size === 'sm' ? 10 : size === 'lg' ? 14 : 11;

  const initials = username
    ? username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full shrink-0 font-mono ${className}`}
      style={{
        width: px,
        height: px,
        fontSize: fs,
        fontWeight: 500,
        background: 'rgba(0, 224, 192, 0.1)',
        color: 'var(--text-accent)',
        border: '1px solid var(--border-default)',
      }}
      title={username}
    >
      {initials}
    </div>
  );
}
