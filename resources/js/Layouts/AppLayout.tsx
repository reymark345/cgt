import { PropsWithChildren } from 'react';

type AppLayoutProps = PropsWithChildren<{
  title?: string;
}>;

export default function AppLayout({ children, title = 'GRANTS' }: AppLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex h-14 items-center justify-between border-b">
          <a href="/" className="text-sm font-semibold tracking-normal">
            {title}
          </a>
        </header>
        <div className="flex-1 py-8">{children}</div>
      </div>
    </main>
  );
}



