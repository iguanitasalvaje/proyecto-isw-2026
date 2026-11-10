import { useId } from 'react';

export default function Input({ label, id, error, className = '', ...props }) {
  const idAutomatico = useId();
  const inputId = id ?? idAutomatico;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-sm text-muted">{label}</label>}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-lg border border-line-strong bg-field px-3 py-2 text-sm text-main placeholder:text-dim outline-none transition-colors focus:border-primary-alt focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
      {error && <p id={errorId} className="text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}
