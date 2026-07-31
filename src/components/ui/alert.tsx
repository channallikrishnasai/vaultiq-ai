export function Alert({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border p-4 ${className ?? ''}`}>
      {children}
    </div>
  );
}

export function AlertTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 font-medium tracking-tight text-lg">{children}</h3>;
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
