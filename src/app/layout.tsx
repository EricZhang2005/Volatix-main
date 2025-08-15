import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'VolEdge — Realtime AI-Powered Vol & Arb',
  description: 'Realtime IV surfaces, arbitrage detection, and AI forecasts.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="container-max py-6">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">VolEdge</h1>
            <div className="text-sm opacity-80">Realtime IV • Arbitrage • AI Forecasts</div>
          </header>
          {children}
          <footer className="mt-10 text-xs opacity-60">© {new Date().getFullYear()} VolEdge</footer>
        </div>
      </body>
    </html>
  );
}