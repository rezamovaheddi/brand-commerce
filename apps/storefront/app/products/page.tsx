import type { Metadata } from "next";
import CatalogView from "../../components/catalog/CatalogView";

export const metadata: Metadata = {
  title: "کاتالوگ محصولات مراقبت از پوست و درموکازمتیک | درمالایت",
  description:
    "مجموعه محصولات تخصصی مراقبت پوست؛ کرم‌های ضد آفتاب، سرم‌های درمانی و پاک‌کننده‌های ملایم از معتبرترین برندهای جهان با اصالت ۱۰۰٪ تضمین‌شده.",
};

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = await searchParams;
  const initialCategory = first(sp.category)?.trim() || undefined;
  const initialQuery = first(sp.q)?.trim() || undefined;

  return (
    <CatalogView
      initialCategory={initialCategory}
      initialQuery={initialQuery}
    />
  );
}
