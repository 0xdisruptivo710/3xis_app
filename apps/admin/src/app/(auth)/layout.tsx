export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-brand-secondary px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
