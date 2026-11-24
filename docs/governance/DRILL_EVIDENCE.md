# پایگاه داده و بازیابی اطلاعات — شواهد مانور بازیابی اضطراری (Disaster Recovery Drill Evidence)

- **شناسه مانور:** `DRILL-1795511626688`
- **تاریخ و زمان:** `2026-11-24T09:13:46.688Z`
- **وضعیت کل:** **تأیید شد (SUCCESS / PASSED)**
- **سرویس دیتابیس:** PostgreSQL 16.16 (بومی روی پورت ۵۴۳۲)
- **ابزار پشتیبان‌گیری:** `C:\Program Files\PostgreSQL\16\bin\pg_dump.exe`
- **مدت زمان بکاپ:** `223ms`
- **مدت زمان بازیابی:** `572ms`
- **اندازه فایل دامپ:** `80.75 KB`
- **مسیر فایل بکاپ:** `C:\Users\talas\OneDrive\Desktop\new_dragon_shop\brand-commerce\backups\brand_commerce_backup_2026-11-24_09-13-44.sql`

## جدول مقایسه و صحه‌گذاری یکپارچگی ردیف‌ها (Row Count Integrity Table)

| نام جدول | تعداد ردیف مبدأ | تعداد ردیف بازیابی‌شده | وضعیت تطابق |
| :--- | :---: | :---: | :---: |
| `Category` | 4 | 4 | ✅ تطابق کامل |
| `Product` | 8 | 8 | ✅ تطابق کامل |
| `ProductVariant` | 8 | 8 | ✅ تطابق کامل |
| `Cart` | 18 | 18 | ✅ تطابق کامل |
| `Order` | 10 | 10 | ✅ تطابق کامل |
| `InventoryItem` | 8 | 8 | ✅ تطابق کامل |
| `Organization` | 3 | 3 | ✅ تطابق کامل |
| `SupportTicket` | 3 | 3 | ✅ تطابق کامل |
| `AuditLog` | 0 | 0 | ✅ تطابق کامل |

---
*این سند به صورت خودکار توسط `scripts/backup-restore-drill.mjs` در چارچوب بند GAP-032 تولید شده است.*
