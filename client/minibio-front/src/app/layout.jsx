import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MiniBio App',
  description: 'Tu link-in-bio personalizado',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen bg-gray-100">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}