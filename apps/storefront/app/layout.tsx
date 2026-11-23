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
  title: "درمالایت | مرجع تخصصی نقد، بررسی و تامین محصولات درموکازمتیک",
  description:
    "فروشگاه تخصصی درمالایت؛ اصالت ۱۰۰٪ تضمین‌شده، فرمولاسیون‌های علمی و مشاوره پوست.",
  icons: {
    icon: "/images/dermalight_logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazir.variable} style={{ background: "#FFFFFF", color: "#1A2254" }}>
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
