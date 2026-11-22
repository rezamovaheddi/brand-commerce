import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Vazirmatn } from "next/font/google";
import Footer from "../components/Footer";
import CartProvider from "../components/cart/CartProvider";
import StorefrontShell from "../components/StorefrontShell";
import "../styles/tokens.css";
import "../styles/globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DERMAVIA — مراقبت طبیعی، اعتماد پایدار",
  description:
    "فروشگاه محصولات مراقبت از پوست DERMAVIA؛ فرمول‌های ملایم و علمی با شفافیت کامل در ترکیبات.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazir.variable}>
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
