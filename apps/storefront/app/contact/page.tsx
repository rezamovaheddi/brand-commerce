"use client";

import { useState } from "react";
import Link from "next/link";
import LeafMark from "../../components/LeafMark";

const FAQS = [
  {
    q: "آیا محصولات درماویا برای پوست‌های به‌شدت حساس مناسب هستند؟",
    a: "بله، تمامی محصولات درماویا فاقد عطر مصنوعی، الکل دناتوره، پارابن و سولفات هستند و با pH فیزیولوژیک پوست (۵٫۵) هماهنگ شده‌اند. با این حال، همیشه توصیه می‌کنیم پیش از مصرف پچ‌تست انجام دهید.",
  },
  {
    q: "سفارش‌ها چگونه ارسال می‌شوند و زمان تحویل چقدر است؟",
    a: "سفارش‌های شهر تهران در کمتر از ۲۴ ساعت کاری با پیک اختصاصی و سفارش‌های سایر استان‌ها ظرف ۲ الی ۳ روز کاری با پست پیشتاز یا تیپاکس در بسته‌بندی امن و عایق حرارتی تحویل داده می‌شوند.",
  },
  {
    q: "چگونه می‌توانم مشاوره اختصاصی برای نوع پوست خود دریافت کنم؟",
    a: "شما می‌توانید از ابزار هوشمند تشخیص پوست در سایت استفاده کنید، یا از طریق فرم زیر یا تماس تلفنی با مشاورین ارشد درماویا در ارتباط باشید.",
  },
  {
    q: "سیاست مرجوعی کالا در صورت عدم رضایت چیست؟",
    a: "در صورت هرگونه مغایرت، آسیب‌دیدگی در حین حمل یا بروز حساسیت غیرمنتظره ظرف ۷ روز کاری، کالا با هزینه درماویا پس گرفته شده و وجه مسترد می‌گردد.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    topic: "consultation",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container dv-page-wrap">
      {/* Header */}
      <div className="contact-hero-header">
        <LeafMark size={38} />
        <h1 className="contact-title">ارتباط با بوتیک درماویا</h1>
        <p className="contact-subtitle">
          تیم مشاورین و پشتیبانی تخصصی درماویا، مشتاقانه آماده پاسخ‌گویی به پرسش‌های شما درباره محصولات و مراقبت از پوست هستند.
        </p>
      </div>

      <div className="contact-grid">
        {/* Contact Form */}
        <section className="contact-form-card">
          <h2 className="contact-card-title">ارسال پیام یا درخواست مشاوره</h2>

          {submitted ? (
            <div className="contact-success-box">
              <span className="success-icon">✓</span>
              <h3>پیام شما با موفقیت ثبت شد</h3>
              <p>کارشناسان درماویا ظرف ساعات کاری آینده با شما تماس خواهند گرفت.</p>
              <button
                type="button"
                className="dv-btn"
                onClick={() => { setSubmitted(false); setFormData({ fullName: "", phone: "", topic: "consultation", message: "" }); }}
              >
                ارسال پیام جدید
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="dv-form">
              <div className="dv-field">
                <label htmlFor="fullName">نام و نام خانوادگی:</label>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="مثال: سارا محمدی"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="dv-input"
                />
              </div>

              <div className="dv-field">
                <label htmlFor="phone">شماره تماس همراه:</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="dv-input"
                  dir="ltr"
                />
              </div>

              <div className="dv-field">
                <label htmlFor="topic">موضوع درخواست:</label>
                <select
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="dv-select"
                >
                  <option value="consultation">مشاوره انتخاب محصول و روتین پوست</option>
                  <option value="order">پیگیری سفارش و ارسال</option>
                  <option value="ingredients">پرسش فنی درباره ترکیبات و ایمنی</option>
                  <option value="b2b">همکاری تجاری و خرید عمده (B2B)</option>
                </select>
              </div>

              <div className="dv-field">
                <label htmlFor="message">متن پیام یا توضیحات وضعیت پوست:</label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  placeholder="لطفاً دغدغه پوستی یا سوال خود را به اختصار شرح دهید..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="dv-textarea"
                />
              </div>

              <button type="submit" className="dv-btn contact-submit-btn">
                ارسال پیام به مشاورین درماویا
              </button>
            </form>
          )}
        </section>

        {/* Contact Info & Details */}
        <aside className="contact-info-card">
          <h2 className="contact-card-title">اطلاعات بوتیک و دفتر مرکزی</h2>

          <div className="info-block">
            <span className="info-icon">📍</span>
            <div>
              <strong>نشانی بوتیک درماویا:</strong>
              <p>تهران، خیابان ولی‌عصر، بالاتر از زعفرانیه، مرکز تجاری پالادیوم، طبقه ۲</p>
            </div>
          </div>

          <div className="info-block">
            <span className="info-icon">📞</span>
            <div>
              <strong>مرکز تماس و مشاوره تلفنی:</strong>
              <p dir="ltr">۰۲۱ - ۲۲۰۰ ۳۴۵۶</p>
              <span className="info-sub">شنبه تا پنج‌شنبه: ۹ صبح الی ۱۹</span>
            </div>
          </div>

          <div className="info-block">
            <span className="info-icon">✉️</span>
            <div>
              <strong>پست الکترونیک رسمی:</strong>
              <p dir="ltr">care@dermavia.ir</p>
            </div>
          </div>

          <div className="info-cta-box">
            <h4>نیاز به مشاوره سریع دارید؟</h4>
            <p>می‌توانید همین حالا تیکت پشتیبانی در سامانه ثبت کنید یا از آزمون خودکار پوست استفاده نمایید.</p>
            <div className="info-actions">
              <Link href="/support" className="dv-outline-btn">
                ثبت تیکت در سامانه پشتیبانی
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* FAQ Section */}
      <section className="contact-faq-section">
        <h2 className="faq-main-heading">پرسش‌های متداول مشتریان</h2>
        <div className="faq-accordion">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className={`faq-item ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <p className="faq-answer-text">{faq.a}</p>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
