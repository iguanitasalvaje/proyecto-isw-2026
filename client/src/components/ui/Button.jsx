const variantes = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-panel text-main border border-line-strong hover:bg-line',
  danger: 'bg-danger text-app hover:brightness-90',
};

export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-alt disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variant] ?? variantes.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
