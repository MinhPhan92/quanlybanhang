import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ToastProvider } from "./contexts/ToastContext";
import ToastWrapper from "./components/shared/toast/ToastWrapper";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gia Dụng Plus - Hệ thống Quản Lý Bán Hàng",
  description: "Hệ thống quản lý bán hàng tích hợp AI & phân quyền",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${quicksand.variable} antialiased`}>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              {children}
              <ToastWrapper />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
