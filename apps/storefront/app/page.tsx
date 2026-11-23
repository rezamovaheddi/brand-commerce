import HomeHero from "../components/HomeHero";
import CategoryGrid from "../components/CategoryGrid";
import SpecialOffers from "../components/SpecialOffers";
import WhyDermatologists from "../components/WhyDermatologists";
import DermaClubBanner from "../components/DermaClubBanner";

export default function HomePage() {
  return (
    <>
      {/* 1. Cinematic Dermalight Hero Section */}
      <HomeHero />

      {/* 2. Product Categories Grid */}
      <CategoryGrid />

      {/* 3. Special Offers & Featured Products */}
      <SpecialOffers />

      {/* 4. Why Dermatologists Choose Dermalight */}
      <WhyDermatologists />

      {/* 5. Derma Club Loyalty Banner */}
      <DermaClubBanner />
    </>
  );
}
