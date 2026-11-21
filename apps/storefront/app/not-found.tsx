import Link from "next/link";

export const metadata = {
  title: "صفحه یافت نشد | DERMAVIA",
};

/** Friendly Persian 404 (rendered inside the layout's <main>). */
export default function NotFound() {
  return (
    <div className="container dv-center-state">
      <h1>صفحه‌ای که دنبالش بودید پیدا نشد</h1>
      <p>
        ممکن است آدرس تغییر کرده باشد یا محصول از فهرست حذف شده باشد.
        می‌توانید از فهرست محصولات ادامه دهید.
      </p>
      <Link href="/" className="dv-btn">بازگشت به خانه</Link>
    </div>
  );
}
