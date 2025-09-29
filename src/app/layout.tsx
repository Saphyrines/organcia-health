import type { Metadata } from "next";
/*import { Geist, Geist_Mono } from "next/font/google";*/
import "./globals.css";
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Toaster position="top-right" reverseOrder={false} />
        {children}
      </body>
    </html>
  );
}

/*const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});*/

/*const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});*/

export const metadata: Metadata = {
  title: "Organcia Evènements",
  description: "Une application pour simplifier la gestion vos évènements et les vivre pleinement",
};
