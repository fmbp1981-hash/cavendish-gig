'use client';

import dynamic from 'next/dynamic';

// Desabilita SSR para evitar erro "document is not defined" do BrowserRouter
const App = dynamic(() => import('@/App'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
});

export default function SpaPage() {
  return <App />;
}
