export default function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`${onClick ? 'card-interactive' : 'card'} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
