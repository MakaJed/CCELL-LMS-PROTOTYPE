import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#090F2E] via-[#1A237E] to-[#0D1642]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#FFB300] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-sm font-medium">Loading CCELL-LNU...</p>
        </div>
      </div>
    }>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;