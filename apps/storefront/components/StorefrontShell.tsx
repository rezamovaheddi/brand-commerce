"use client";

import { useState, type ReactNode } from "react";
import Header from "./Header";
import CreamCanopy from "./CreamCanopy";
import StardustCanvas from "./StardustCanvas";
import CartDrawer from "./CartDrawer";
import FloatingDock from "./FloatingDock";
import SkinConsultationModal from "./SkinConsultationModal";

export default function StorefrontShell({ children }: { children: ReactNode }) {
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  return (
    <>
      {/* 2D Canvas Cosmic Particle Stardust Layer */}
      <StardustCanvas />

      {/* 3D Cream Drip Canopy */}
      <CreamCanopy />

      {/* Frosted Cream Capsule Header */}
      <Header onOpenConsultation={() => setIsConsultationOpen(true)} />

      {/* Main Content */}
      <main id="main">
        {children}
      </main>

      {/* Global Slide-over Luxury Cart Drawer */}
      <CartDrawer />

      {/* Floating 4-Button Bottom Dock */}
      <FloatingDock onOpenConsultation={() => setIsConsultationOpen(true)} />

      {/* Smart Skin Consultation Quiz Modal */}
      <SkinConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
      />
    </>
  );
}
