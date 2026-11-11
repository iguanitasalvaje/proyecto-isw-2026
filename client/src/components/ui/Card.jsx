export default function Card({ children, className = '', ...props }) {
  return (
    <section
      className={`rounded-xl border border-line bg-panel p-5 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
