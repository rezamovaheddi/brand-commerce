import type { Metadata } from "next";
import type { ReactNode } from "react";
import Footer from "../components/Footer";
import CartProvider from "../components/cart/CartProvider";
import StorefrontShell from "../components/StorefrontShell";
import "../styles/tokens.css";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "DERMAVIA — مراقبت طبیعی، اعتماد پایدار",
  description:
    "فروشگاه محصولات مراقبت از پوست DERMAVIA؛ فرمول‌های ملایم و علمی با شفافیت کامل در ترکیبات.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-vazir">
        <a href="#main" className="skip-link">پرش به محتوای اصلی</a>
        <CartProvider>
          <StorefrontShell>
            {children}
          </StorefrontShell>
        </CartProvider>
        <Footer />
      </body>
    </html>
  );
}
