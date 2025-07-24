import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from '../components/navbar';
import { AuthProvider } from '@/context/AuthContext';
import { GoogleMapsProvider } from '../contexts/GoogleMapsContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FoodLoft",
  description: "A modern restaurant reservation system with an interactive 3D floorplan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script
          id="google-maps"
          strategy="beforeInteractive"
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        />
        <AuthProvider>
          <GoogleMapsProvider>
            {children}
            <Toaster position="bottom-center" />
          </GoogleMapsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
