"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Slider,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";
import Diversity1OutlinedIcon from "@mui/icons-material/Diversity1Outlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FaceRetouchingNaturalOutlinedIcon from "@mui/icons-material/FaceRetouchingNaturalOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { AnimatePresence, motion } from "framer-motion";
import MuiRtlThemeProvider from "../../components/theme/MuiRtlThemeProvider";
import {
  MotionFloatingOrb,
  MotionHoverCard,
  MotionNumberCounter,
  MotionSection,
  MotionStaggerGrid,
} from "../../components/motion/MotionPrimitives";
import { formatFaNumber, formatPriceMinor } from "../../lib/format";

interface TierItem {
  id: string;
  name: string;
  englishName: string;
  range: string;
  minPoints: number;
  featured?: boolean;
  accentColor: string;
  borderColor: string;
  buttonBg: string;
  buttonColor: string;
  buttonLabel: string;
  coupon: string;
  icon: "diamond" | "gold" | "silver" | "bronze";
  perks: string[];
}

const TIERS: TierItem[] = [
  {
    id: "diamond",
    name: "عضو الماس",
    englishName: "Diamond",
    range: "۴٬۰۰۰+ امتیاز",
    minPoints: 4000,
    featured: true,
    accentColor: "#FFFFFF",
    borderColor: "transparent",
    buttonBg: "rgba(255,255,255,0.22)",
    buttonColor: "#FFFFFF",
    buttonLabel: "شرایط الماس",
    coupon: "DIAMOND20",
    icon: "diamond",
    perks: [
      "۲۰ امتیاز نقدی از هر خرید",
      "تست محصولات جدید به‌صورت رایگان",
      "دعوت به رویدادهای حضوری برند",
      "پشتیبانی اختصاصی ۲۴ ساعته",
    ],
  },
  {
    id: "gold",
    name: "عضو طلایی",
    englishName: "Gold",
    range: "۱٬۵۰۰ تا ۳٬۹۹۹ امتیاز",
    minPoints: 1500,
    accentColor: "#E2BE74",
    borderColor: "#F2D591",
    buttonBg: "#E2BE74",
    buttonColor: "#1A2254",
    buttonLabel: "پیشنهاد ویژه",
    coupon: "DERMAVIA10",
    icon: "gold",
    perks: [
      "تخفیف دائمی ۱۰٪ در هر خرید",
      "ارسال رایگان تمام سفارش‌ها",
      "هدیه تولد ویژه درماکلاب",
      "مشاوره تخصصی رایگان پوست",
    ],
  },
  {
    id: "silver",
    name: "عضو نقره‌ای",
    englishName: "Silver",
    range: "۵۰۰ تا ۱٬۴۹۹ امتیاز",
    minPoints: 500,
    accentColor: "#8E9AAF",
    borderColor: "#E2E8F0",
    buttonBg: "#F4F6FA",
    buttonColor: "#1A2254",
    buttonLabel: "مشاهده جزئیات",
    coupon: "SILVER7",
    icon: "silver",
    perks: [
      "۱۲ امتیاز نقدی در هر خرید",
      "دسترسی به کمپین‌های تخفیف فصلی",
      "اولویت در اطلاع‌رسانی موجودی‌ها",
    ],
  },
  {
    id: "bronze",
    name: "عضو برنزی",
    englishName: "Bronze",
    range: "۰ تا ۴۹۹ امتیاز",
    minPoints: 0,
    accentColor: "#C87D55",
    borderColor: "#F3D8C7",
    buttonBg: "#FFF8F4",
    buttonColor: "#8C4A27",
    buttonLabel: "سطح پیش‌فرض",
    coupon: "PEARL5",
    icon: "bronze",
    perks: [
      "۵ امتیاز نقدی در هر خرید",
      "هدیه خوش‌آمدگویی عضویت",
      "دریافت خبرنامه تخصصی مراقبت پوست",
    ],
  },
];

const BENEFITS = [
  {
    title: "هدیه تولد",
    desc: "در روز تولدتان یک کد تخفیف ویژه و یک هدیه مراقبت از پوست از طرف ما دریافت می‌کنید.",
    icon: <CakeOutlinedIcon sx={{ fontSize: 22 }} />,
  },
  {
    title: "ارسال رایگان",
    desc: "اعضای سطوح طلایی و الماس از ارسال رایگان برای تمامی سفارش‌های خود در سراسر کشور بهره‌مند می‌شوند.",
    icon: <LocalShippingOutlinedIcon sx={{ fontSize: 22 }} />,
  },
  {
    title: "مشاوره اختصاصی",
    desc: "با دسترسی مستقیم به متخصصان پوست، روتین روزانه و درمانی متناسب با نوع پوست خود را بسازید.",
    icon: <SupportAgentOutlinedIcon sx={{ fontSize: 22 }} />,
  },
  {
    title: "دسترسی زودهنگام",
    desc: "اولین نفری باشید که از محصولات جدید، سری‌های محدود و تخفیف‌های فصلی پیش از اعلام عمومی مطلع می‌شوید.",
    icon: <RocketLaunchOutlinedIcon sx={{ fontSize: 22 }} />,
  },
];

const REWARDS = [
  {
    id: "vitc-serum",
    title: "سرم ویتامین C روشن‌کننده",
    points: 1800,
    cta: "تبدیل امتیاز",
    code: "REWARD-VITC18",
    visual: "serum",
    tag: "محصول نمونه",
  },
  {
    id: "discount-200k",
    title: "تخفیف ۲۰۰ هزار تومانی",
    points: 800,
    cta: "دریافت کد",
    code: "CLUB-200K-OFF",
    visual: "cream",
    tag: "کد تخفیف",
  },
  {
    id: "skin-analysis",
    title: "یک جلسه آنالیز هوشمند پوست",
    points: 1200,
    cta: "رزرو نوبت",
    code: "SKIN-AI-PASS",
    visual: "consult",
    tag: "مشاوره تخصصی",
  },
  {
    id: "bioderma-mini",
    title: "پک مینی‌سایز مراقبتی ویژه",
    points: 1500,
    cta: "تبدیل امتیاز",
    code: "MINI-KIT-15",
    visual: "kit",
    tag: "هدیه اختصاصی",
  },
];

const EARN_STEPS = [
  {
    title: "ثبت‌نام",
    subtitle: "۵۰ امتیاز خوش‌آمدگویی",
    icon: <PersonAddAlt1OutlinedIcon sx={{ fontSize: 24 }} />,
  },
  {
    title: "خرید محصولات",
    subtitle: "۱۰ امتیاز به ازای هر ۱۰۰ هزار تومان",
    icon: <ShoppingBagOutlinedIcon sx={{ fontSize: 24 }} />,
  },
  {
    title: "ثبت دیدگاه",
    subtitle: "۳۰ امتیاز برای هر نظر تاییدشده",
    icon: <RateReviewOutlinedIcon sx={{ fontSize: 24 }} />,
  },
  {
    title: "دعوت از دوستان",
    subtitle: "۱۰۰ امتیاز برای هر معرفی موفق",
    icon: <Diversity1OutlinedIcon sx={{ fontSize: 24 }} />,
  },
];

const FAQS = [
  {
    q: "آیا امتیازها تاریخ انقضا دارند؟",
    a: "امتیازهای کسب‌شده تا ۱۲ ماه پس از آخرین فعالیت یا خرید شما معتبر هستند و با هر سفارش جدید، اعتبار کل امتیازها تمدید می‌شود.",
  },
  {
    q: "چطور می‌توانم سطح خود را ارتقا دهم؟",
    a: "با جمع‌آوری امتیاز از طریق خرید محصولات، ثبت نقد و بررسی یا دعوت از دوستان، سطح عضویت شما به‌صورت خودکار ارتقا پیدا می‌کند.",
  },
  {
    q: "امتیاز خرید چه زمانی به حسابم اضافه می‌شود؟",
    a: "طبق قوانین لجر وفاداری، امتیاز هر سفارش پس از تایید تحویل و اتمام بازه بررسی مرجوعی به‌طور خودکار در حساب شما ثبت می‌شود.",
  },
];

function renderTierIcon(icon: TierItem["icon"], color: string) {
  const sx = { fontSize: 22, color };
  switch (icon) {
    case "diamond":
      return <DiamondOutlinedIcon sx={sx} />;
    case "gold":
      return <WorkspacePremiumOutlinedIcon sx={sx} />;
    case "silver":
      return <VerifiedOutlinedIcon sx={sx} />;
    case "bronze":
      return <CardGiftcardOutlinedIcon sx={sx} />;
  }
}

export default function LoyaltyPage() {
  const [memberPoints, setMemberPoints] = useState<number>(2450);
  const [selectedTierId, setSelectedTierId] = useState<string>("gold");
  const [purchaseAmountToman, setPurchaseAmountToman] = useState<number>(3_000_000);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinPhone, setJoinPhone] = useState("");
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "info" | "warning" }>({
    open: false,
    message: "",
    severity: "success",
  });
  const rewardsScrollRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const statusCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !pageRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (statusCardRef.current) {
        gsap.to(statusCardRef.current, {
          y: -8,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      gsap.from(".gsap-tier-card", {
        y: 34,
        rotationY: 12,
        opacity: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: "power3.out",
        clearProps: "transform,opacity",
        scrollTrigger: {
          trigger: ".gsap-tiers-grid",
          start: "top 85%",
          once: true,
        },
      });

      gsap.from(".gsap-reward-card", {
        y: 28,
        rotation: -4,
        scale: 0.92,
        opacity: 0,
        duration: 0.6,
        stagger: 0.09,
        ease: "back.out(1.3)",
        clearProps: "transform,opacity",
        scrollTrigger: {
          trigger: ".gsap-rewards-grid",
          start: "top 85%",
          once: true,
        },
      });

      gsap.from(".gsap-earn-icon", {
        scale: 0.6,
        rotation: -35,
        opacity: 0,
        duration: 0.55,
        stagger: 0.1,
        ease: "back.out(1.6)",
        clearProps: "transform,opacity",
        scrollTrigger: {
          trigger: ".gsap-earn-grid",
          start: "top 88%",
          once: true,
        },
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  const selectedTier = TIERS.find((t) => t.id === selectedTierId) ?? TIERS[1];
  const nextGoal = 3000;
  const progressPct = Math.min(100, Math.round((memberPoints / nextGoal) * 100));
  const pointsRemaining = Math.max(0, nextGoal - memberPoints);
  const simulatedEarnedPoints = Math.floor(purchaseAmountToman / 100_000) * 10;

  const handleSelectTier = (tierId: string) => {
    setSelectedTierId(tierId);
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) {
      gsap.fromTo(
        ".gsap-status-badge",
        { rotation: -180, scale: 0.7 },
        { rotation: 0, scale: 1, duration: 0.55, ease: "back.out(1.7)" },
      );
    }
  };

  const handleRedeem = (reward: (typeof REWARDS)[number]) => {
    if (memberPoints < reward.points) {
      setSnack({
        open: true,
        severity: "warning",
        message: `برای دریافت «${reward.title}» به ${formatFaNumber(reward.points - memberPoints)} امتیاز بیشتر نیاز دارید.`,
      });
      return;
    }
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) {
      gsap.fromTo(
        `#reward-card-${reward.id}`,
        { scale: 0.94, rotation: -3 },
        { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(1.8)" },
      );
    }
    setMemberPoints((prev) => prev - reward.points);
    setSnack({
      open: true,
      severity: "success",
      message: `پاداش «${reward.title}» با کد نمونه ${reward.code} برای شما فعال شد.`,
    });
  };

  const scrollRewards = (dir: "left" | "right") => {
    if (!rewardsScrollRef.current) return;
    const offset = dir === "left" ? -320 : 320;
    rewardsScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const handleJoinSubmit = () => {
    setJoinOpen(false);
    setMemberPoints((prev) => prev + 50);
    setSnack({
      open: true,
      severity: "success",
      message: "عضویت نمونه در درماکلاب ثبت شد و ۵۰ امتیاز خوش‌آمدگویی اضافه گردید.",
    });
  };

  return (
    <MuiRtlThemeProvider>
      <Box ref={pageRef} sx={{ bgcolor: "#FFFFFF", pb: 8, overflowX: "hidden" }}>
        {/* 1. HERO SECTION */}
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(125deg, #F3B3A6 0%, #9E5EA4 38%, #5D2486 72%, #330E59 100%)",
            color: "#FFFFFF",
            pt: { xs: 7, md: 9 },
            pb: { xs: 8, md: 10 },
          }}
        >
          <MotionFloatingOrb
            size={300}
            color="rgba(244, 217, 150, 0.28)"
            top="-60px"
            left="12%"
            duration={9}
          />
          <MotionFloatingOrb
            size={260}
            color="rgba(255, 255, 255, 0.14)"
            bottom="-80px"
            right="8%"
            duration={11}
          />

          <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
                gap: { xs: 4, md: 6 },
                alignItems: "center",
              }}
            >
              {/* Right Side (RTL): Copy & CTAs */}
              <Box>
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2, gap: 1 }}>
                    <Chip
                      icon={<AutoAwesomeIcon sx={{ color: "#F4D996 !important", fontSize: 16 }} />}
                      label="باشگاه اختصاصی درمالایت"
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.16)",
                        color: "#FFFFFF",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.22)",
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label="داده نمونه"
                      size="small"
                      sx={{
                        bgcolor: "rgba(226, 190, 116, 0.2)",
                        color: "#F4D996",
                        border: "1px solid rgba(244, 217, 150, 0.35)",
                        fontSize: "0.7rem",
                      }}
                    />
                  </Stack>

                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: "1.9rem", md: "2.85rem" },
                      lineHeight: 1.35,
                      mb: 2,
                      color: "#FFFFFF",
                    }}
                  >
                    پاداش وفاداری شما؛
                    <br />
                    فراتر از یک خرید
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: { xs: "0.95rem", md: "1.05rem" },
                      lineHeight: 1.85,
                      color: "rgba(255,255,255,0.88)",
                      maxWidth: 540,
                      mb: 3.5,
                    }}
                  >
                    در باشگاه مشتریان درمالایت، هر خرید شما ارزشی به امتیاز و پاداش‌های
                    متفاوت می‌دهد؛ از تخفیف‌های اختصاصی تا هدیه‌های تولد و مشاوره تخصصی کاملاً علمی در انتظار شماست.
                  </Typography>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ gap: 1.5 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => setJoinOpen(true)}
                      sx={{
                        bgcolor: "#FFFFFF",
                        color: "#330E59",
                        px: 3.5,
                        py: 1.3,
                        "&:hover": { bgcolor: "#F8F5FC" },
                      }}
                    >
                      عضویت رایگان در باشگاه
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      href="#how-to-earn"
                      sx={{
                        color: "#FFFFFF",
                        borderColor: "rgba(255,255,255,0.45)",
                        bgcolor: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(8px)",
                        px: 3,
                        py: 1.3,
                        "&:hover": {
                          borderColor: "#FFFFFF",
                          bgcolor: "rgba(255,255,255,0.2)",
                        },
                      }}
                    >
                      نحوه کسب امتیاز
                    </Button>
                  </Stack>
                </motion.div>
              </Box>

              {/* Left Side (RTL): Floating Glass Status Card */}
              <div ref={statusCardRef}>
                <Card
                  sx={{
                    background: "rgba(255, 255, 255, 0.14)",
                    backdropFilter: "blur(18px)",
                    border: "1px solid rgba(255, 255, 255, 0.28)",
                    boxShadow: "0 24px 48px rgba(24, 5, 45, 0.28)",
                    color: "#FFFFFF",
                    p: { xs: 2.5, md: 3.5 },
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                    <Box>
                      <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", mb: 0.5 }}>
                        سطح فعلی شما
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF" }}>
                        {selectedTier.name} ({selectedTier.englishName})
                      </Typography>
                    </Box>

                    <Box
                      className="gsap-status-badge"
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: "14px",
                        bgcolor: "#F2C96B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 20px rgba(242, 201, 107, 0.4)",
                      }}
                    >
                      <WorkspacePremiumOutlinedIcon sx={{ color: "#330E59", fontSize: 26 }} />
                    </Box>
                  </Stack>

                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.75)" }}>
                      امتیاز شما
                    </Typography>
                    <Typography sx={{ fontSize: "2.25rem", fontWeight: 800, lineHeight: 1.2 }}>
                      <MotionNumberCounter value={memberPoints} />
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={progressPct}
                    sx={{
                      height: 8,
                      borderRadius: 99,
                      bgcolor: "rgba(255,255,255,0.22)",
                      mb: 1.2,
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 99,
                        background: "linear-gradient(90deg, #E2BE74 0%, #FFE6A3 100%)",
                      },
                    }}
                  />

                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.85)" }}>
                      {formatFaNumber(memberPoints)} / {formatFaNumber(nextGoal)} امتیاز
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#F4D996", fontWeight: 600 }}>
                      {pointsRemaining > 0
                        ? `${formatFaNumber(pointsRemaining)} امتیاز تا سطح الماس`
                        : "به سطح الماس رسیده‌اید!"}
                    </Typography>
                  </Stack>
                </Card>
              </div>
            </Box>
          </Container>
        </Box>

        {/* 2. MEMBERSHIP TIERS ("سطوح عضویت درما کلاب") */}
        <Box sx={{ bgcolor: "#F8F7FB", py: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <MotionSection>
              <Box sx={{ textAlign: "center", mb: 5 }}>
                <Typography variant="h2" sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, mb: 1.2 }}>
                  سطوح عضویت درما کلاب
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.95rem" }}>
                  با هر خرید یا فعالیت در سایت، سطح خود را ارتقا دهید و از مزایای شگفت‌انگیز هر سطح بهره‌مند شوید.
                </Typography>
              </Box>
            </MotionSection>

            <Box
              className="gsap-tiers-grid"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(4, 1fr)",
                },
                gap: 2.5,
                alignItems: "stretch",
                perspective: "1000px",
              }}
            >
              {TIERS.map((tier) => {
                const isSelected = selectedTierId === tier.id;
                return (
                  <MotionHoverCard
                    key={tier.id}
                    className="gsap-tier-card"
                    onClick={() => handleSelectTier(tier.id)}
                  >
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          p: 1,
                          background: tier.featured
                            ? "linear-gradient(155deg, #4B1C71 0%, #8344B2 65%, #BA88DF 100%)"
                            : "#FFFFFF",
                          color: tier.featured ? "#FFFFFF" : "#1A2254",
                          border: isSelected
                            ? `2px solid ${tier.featured ? "#F4D996" : tier.accentColor}`
                            : `1.5px solid ${tier.borderColor}`,
                          boxShadow: isSelected
                            ? "0 18px 36px rgba(75, 28, 113, 0.16)"
                            : "0 8px 24px rgba(26, 34, 84, 0.05)",
                          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: "14px",
                                bgcolor: tier.featured
                                  ? "rgba(255,255,255,0.16)"
                                  : `${tier.accentColor}20`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {renderTierIcon(tier.icon, tier.accentColor)}
                            </Box>
                          </Box>

                          <Typography
                            variant="h6"
                            sx={{ textAlign: "center", fontWeight: 800, mb: 0.5 }}
                          >
                            {tier.name}
                          </Typography>
                          <Typography
                            sx={{
                              textAlign: "center",
                              fontSize: "0.78rem",
                              color: tier.featured ? "rgba(255,255,255,0.78)" : "text.secondary",
                              mb: 2.5,
                            }}
                          >
                            {tier.range}
                          </Typography>

                          <Stack spacing={1.2}>
                            {tier.perks.map((perk, idx) => (
                              <Stack key={idx} direction="row" spacing={1} sx={{ alignItems: "flex-start", gap: 1 }}>
                                <CheckCircleOutlineOutlinedIcon
                                  sx={{
                                    fontSize: 17,
                                    mt: "2px",
                                    color: tier.featured ? "#F4D996" : tier.accentColor,
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: "0.82rem",
                                    lineHeight: 1.55,
                                    color: tier.featured ? "rgba(255,255,255,0.92)" : "text.secondary",
                                  }}
                                >
                                  {perk}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </CardContent>

                        <Box sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            sx={{
                              bgcolor: tier.buttonBg,
                              color: tier.buttonColor,
                              py: 1,
                              fontSize: "0.85rem",
                              "&:hover": {
                                bgcolor: tier.buttonBg,
                                opacity: 0.92,
                              },
                            }}
                          >
                            {tier.buttonLabel}
                          </Button>
                        </Box>
                      </Card>
                    </MotionHoverCard>
                  );
                })}
              </Box>

            {/* Active Tier Quick Code Spotlight */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <Card
                  sx={{
                    mt: 3.5,
                    p: { xs: 2, md: 2.5 },
                    border: "1px solid #EAE5F3",
                    bgcolor: "#FFFFFF",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "flex-start", md: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      کد فعال‌سازی {selectedTier.name}:{" "}
                      <Chip
                        label={selectedTier.coupon}
                        size="small"
                        color="primary"
                        sx={{ mx: 0.5, fontWeight: 700 }}
                      />
                    </Typography>
                    <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 0.5 }}>
                      می‌توانید این کد نمونه را در کشوی سبد خرید اعمال کنید.
                    </Typography>
                  </Box>
                  <Button component={Link} href="/products" variant="contained" color="primary">
                    مشاهده محصولات و خرید ←
                  </Button>
                </Card>
              </motion.div>
            </AnimatePresence>
          </Container>
        </Box>

        {/* 3. EXCLUSIVE BENEFITS ("مزایایی که فقط مختص شماست") */}
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          <MotionSection>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "0.85fr 1.15fr" },
                gap: 4,
                alignItems: "center",
              }}
            >
              {/* Right column in RTL */}
              <Box>
                <Typography variant="h2" sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, mb: 1.5, lineHeight: 1.35 }}>
                  مزایایی که فقط
                  <br />
                  مختص شماست
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.95rem", lineHeight: 1.8, mb: 2.5 }}>
                  باشگاه درمالایت فراتر از یک سیستم جمع‌آوری امتیاز است؛ ما این امکانات را برای
                  تجربه بهتر شما از روتین پوستی فراهم کرده‌ایم.
                </Typography>
                <Button
                  component={Link}
                  href="/about"
                  variant="text"
                  color="primary"
                  sx={{ px: 0, fontWeight: 700 }}
                >
                  همه مزایا را مطالعه کنید ←
                </Button>
              </Box>

              {/* Left column in RTL: 2x2 Grid */}
              <MotionStaggerGrid>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                    gap: 2.5,
                  }}
                >
                  {BENEFITS.map((item) => (
                    <MotionHoverCard key={item.title} lift={-4}>
                      <Card
                        sx={{
                          height: "100%",
                          border: "1px solid #F0ECF7",
                          boxShadow: "0 8px 24px rgba(26, 34, 84, 0.04)",
                          p: 1,
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: "12px",
                              bgcolor: "#F4EEFA",
                              color: "#5B2182",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mb: 1.5,
                            }}
                          >
                            {item.icon}
                          </Box>
                          <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 800, mb: 0.8 }}>
                            {item.title}
                          </Typography>
                          <Typography sx={{ fontSize: "0.84rem", color: "text.secondary", lineHeight: 1.7 }}>
                            {item.desc}
                          </Typography>
                        </CardContent>
                      </Card>
                    </MotionHoverCard>
                  ))}
                </Box>
              </MotionStaggerGrid>
            </Box>
          </MotionSection>
        </Container>

        {/* 4. REWARDS MARKETPLACE ("بازار پاداش‌ها") */}
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <MotionSection>
            <Box
              sx={{
                borderRadius: "28px",
                background: "linear-gradient(145deg, #240B3B 0%, #3F1665 55%, #5C228B 100%)",
                color: "#FFFFFF",
                p: { xs: 3, md: 5 },
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 4, gap: 2 }}
              >
                <Box>
                  <Typography variant="h2" sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" }, color: "#FFFFFF", mb: 0.8 }}>
                    بازار پاداش‌ها
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.78)", fontSize: "0.9rem" }}>
                    امتیازهای خود را به این محصولات و خدمات تبدیل کنید:
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} sx={{ gap: 1 }}>
                  <IconButton
                    aria-label="قبلی"
                    onClick={() => scrollRewards("right")}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.12)",
                      color: "#FFFFFF",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                  <IconButton
                    aria-label="بعدی"
                    onClick={() => scrollRewards("left")}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.12)",
                      color: "#FFFFFF",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                </Stack>
              </Stack>

              <Box
                ref={rewardsScrollRef}
                className="gsap-rewards-grid"
                sx={{
                  display: "grid",
                  gridAutoFlow: "column",
                  gridAutoColumns: { xs: "82%", sm: "46%", md: "23.5%" },
                  gap: 2.5,
                  overflowX: "auto",
                  pb: 1,
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {REWARDS.map((reward) => (
                  <motion.div
                    key={reward.id}
                    id={`reward-card-${reward.id}`}
                    className="gsap-reward-card"
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      sx={{
                        bgcolor: "rgba(255,255,255,0.09)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#FFFFFF",
                        p: 1.5,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Box
                          sx={{
                            height: 150,
                            borderRadius: "14px",
                            mb: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                              reward.visual === "serum"
                                ? "linear-gradient(135deg, #2D2A32 0%, #575366 100%)"
                                : reward.visual === "cream"
                                ? "linear-gradient(135deg, #ECE9F2 0%, #D9D3E6 100%)"
                                : reward.visual === "consult"
                                ? "linear-gradient(135deg, #1E2E4A 0%, #2F4975 100%)"
                                : "linear-gradient(135deg, #2C1E3E 0%, #4E346E 100%)",
                            color: reward.visual === "cream" ? "#1A2254" : "#FFFFFF",
                            position: "relative",
                          }}
                        >
                          <Chip
                            label={reward.tag}
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              fontSize: "0.68rem",
                              bgcolor: "rgba(0,0,0,0.35)",
                              color: "#FFFFFF",
                            }}
                          />
                          {reward.visual === "consult" ? (
                            <FaceRetouchingNaturalOutlinedIcon sx={{ fontSize: 48, opacity: 0.9 }} />
                          ) : (
                            <CardGiftcardOutlinedIcon sx={{ fontSize: 48, opacity: 0.85 }} />
                          )}
                        </Box>

                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 1.5 }}>
                          {reward.title}
                        </Typography>
                      </Box>

                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ color: "#F4D996", fontWeight: 700, fontSize: "0.85rem" }}>
                          {formatFaNumber(reward.points)} امتیاز
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleRedeem(reward)}
                          sx={{
                            bgcolor: "#FFFFFF",
                            color: "#240B3B",
                            px: 1.8,
                            fontSize: "0.78rem",
                            "&:hover": { bgcolor: "#F4D996" },
                          }}
                        >
                          {reward.cta}
                        </Button>
                      </Stack>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            </Box>
          </MotionSection>
        </Container>

        {/* 5. HOW TO EARN POINTS ("چگونه امتیاز کسب کنیم؟") + SIMULATOR */}
        <Container id="how-to-earn" maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          <MotionSection>
            <Box sx={{ textAlign: "center", mb: 5 }}>
              <Typography variant="h2" sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, mb: 1 }}>
                چگونه امتیاز کسب کنیم؟
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.95rem" }}>
                مسیر ساده و شفاف برای ارتقای سطح در درما کلاب
              </Typography>
            </Box>

            <MotionStaggerGrid>
              <Box
                className="gsap-earn-grid"
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                  gap: 3,
                  borderTop: "1px solid #EFEBF6",
                  pt: 4,
                }}
              >
                {EARN_STEPS.map((step) => (
                  <MotionHoverCard key={step.title} lift={-4}>
                    <Box sx={{ textAlign: "center", px: 1 }}>
                      <Box
                        className="gsap-earn-icon"
                        sx={{
                          width: 54,
                          height: 54,
                          borderRadius: "16px",
                          bgcolor: "#F5F0FA",
                          color: "#5B2182",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 1.5,
                        }}
                      >
                        {step.icon}
                      </Box>
                      <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 0.5 }}>
                        {step.title}
                      </Typography>
                      <Typography sx={{ fontSize: "0.84rem", color: "text.secondary" }}>
                        {step.subtitle}
                      </Typography>
                    </Box>
                  </MotionHoverCard>
                ))}
              </Box>
            </MotionStaggerGrid>

            {/* Interactive Points Calculator Card */}
            <Card
              sx={{
                mt: 5,
                p: { xs: 2.5, md: 3.5 },
                border: "1px solid #EAE5F3",
                background: "linear-gradient(180deg, #FCFAFF 0%, #FFFFFF 100%)",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                sx={{ justifyContent: "space-between", alignItems: { xs: "stretch", md: "center" }, gap: 3 }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                    شبیه‌ساز محاسبه امتیاز خرید
                  </Typography>
                  <Typography sx={{ fontSize: "0.88rem", color: "text.secondary", mb: 2 }}>
                    مبلغ خرید تخمینی:{" "}
                    <strong style={{ color: "#5B2182" }}>
                      {formatPriceMinor(purchaseAmountToman * 10)}
                    </strong>
                  </Typography>
                  <Slider
                    value={purchaseAmountToman}
                    min={500_000}
                    max={10_000_000}
                    step={500_000}
                    onChange={(_, val) => setPurchaseAmountToman(val as number)}
                    color="primary"
                    aria-label="مبلغ خرید تخمینی"
                  />
                </Box>

                <Box
                  sx={{
                    minWidth: { md: 260 },
                    p: 2.5,
                    borderRadius: "16px",
                    bgcolor: "#F4EEFA",
                    textAlign: "center",
                  }}
                >
                  <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 0.5 }}>
                    امتیاز تخمینی این خرید
                  </Typography>
                  <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#5B2182" }}>
                    +{formatFaNumber(simulatedEarnedPoints)} امتیاز
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </MotionSection>
        </Container>

        {/* 6. FAQ SECTION ("سوالات متداول باشگاه") */}
        <Box sx={{ bgcolor: "#F8F7FB", py: { xs: 6, md: 8 } }}>
          <Container maxWidth="md">
            <MotionSection>
              <Typography
                variant="h2"
                sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" }, textAlign: "center", mb: 4 }}
              >
                سوالات متداول باشگاه
              </Typography>

              <Stack spacing={1.5}>
                {FAQS.map((item, idx) => (
                  <Accordion key={idx} defaultExpanded={idx === 0}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon color="primary" />}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.q}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography sx={{ fontSize: "0.88rem", color: "text.secondary", lineHeight: 1.8 }}>
                        {item.a}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </MotionSection>
          </Container>
        </Box>

        {/* Free Club Join Dialog */}
        <Dialog open={joinOpen} onClose={() => setJoinOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 800 }}>عضویت رایگان در درماکلاب</DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: "0.88rem", color: "text.secondary", mb: 2 }}>
              شماره موبایل خود را وارد کنید تا ۵۰ امتیاز خوش‌آمدگویی نمونه برایتان فعال شود.
            </Typography>
            <TextField
              fullWidth
              label="شماره موبایل"
              placeholder="09123456789"
              value={joinPhone}
              onChange={(e) => setJoinPhone(e.target.value)}
              dir="ltr"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setJoinOpen(false)} color="inherit">
              انصراف
            </Button>
            <Button variant="contained" onClick={handleJoinSubmit}>
              ثبت عضویت و دریافت ۵۰ امتیاز
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feedback Snackbar */}
        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snack.severity}
            variant="filled"
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </Box>
    </MuiRtlThemeProvider>
  );
}
