"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

export interface BookSpreadData {
  id: string;
  label: string;
  chapter: string;
  rightTitle: string;
  rightLead: string;
  rightBullets: string[];
  rightHighlightTitle: string;
  rightHighlightDesc: string;
  rightPageNum: string;
  rightImage: string;
  leftTitle: string;
  leftLead: string;
  leftProducts: Array<{
    name: string;
    desc: string;
    btnLabel: string;
    btnColor: string;
    image: string;
  }>;
  leftPageNum: string;
  leftFooter: string;
}

interface ThreeBookCanvasProps {
  spreads: BookSpreadData[];
  spreadIndex: number;
  isZoomed: boolean;
  onTurnPage: (delta: number) => void;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign = "right",
): number {
  ctx.textAlign = align;
  const words = text.split(" ");
  let line = "";
  let curY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[i] + " ";
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, curY);
    curY += lineHeight;
  }
  return curY;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function createPageTexture(
  spread: BookSpreadData,
  side: "right" | "left",
  loadedImages: Record<string, HTMLImageElement>,
): THREE.CanvasTexture {
  const W = 1024;
  const H = 1240;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.direction = "rtl";

  // Paper gradient background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#FCFAFF");
  bg.addColorStop(1, "#FFFFFF");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle spine shading
  const spineGrad =
    side === "right"
      ? ctx.createLinearGradient(0, 0, 90, 0)
      : ctx.createLinearGradient(W - 90, 0, W, 0);
  if (side === "right") {
    spineGrad.addColorStop(0, "rgba(26, 34, 84, 0.12)");
    spineGrad.addColorStop(1, "rgba(26, 34, 84, 0)");
    ctx.fillStyle = spineGrad;
    ctx.fillRect(0, 0, 90, H);
  } else {
    spineGrad.addColorStop(0, "rgba(26, 34, 84, 0)");
    spineGrad.addColorStop(1, "rgba(26, 34, 84, 0.12)");
    ctx.fillStyle = spineGrad;
    ctx.fillRect(W - 90, 0, 90, H);
  }

  // Corner ornaments
  ctx.strokeStyle = "rgba(82, 39, 155, 0.28)";
  ctx.lineWidth = 3;
  const m = 36;
  const cLen = 34;
  // Top-right
  ctx.beginPath();
  ctx.moveTo(W - m - cLen, m);
  ctx.lineTo(W - m, m);
  ctx.lineTo(W - m, m + cLen);
  ctx.stroke();
  // Top-left
  ctx.beginPath();
  ctx.moveTo(m + cLen, m);
  ctx.lineTo(m, m);
  ctx.lineTo(m, m + cLen);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(W - m - cLen, H - m);
  ctx.lineTo(W - m, H - m);
  ctx.lineTo(W - m, H - m - cLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(m + cLen, H - m);
  ctx.lineTo(m, H - m);
  ctx.lineTo(m, H - m - cLen);
  ctx.stroke();

  const fontName = "'Vazirmatn RD UI FD', 'Vazirmatn', Tahoma, sans-serif";

  if (side === "right") {
    // Heading
    ctx.fillStyle = "#1A2254";
    ctx.font = `800 44px ${fontName}`;
    ctx.textAlign = "right";
    ctx.fillText(spread.rightTitle, W - 76, 128);

    // Lead
    ctx.fillStyle = "#5A6A85";
    ctx.font = `400 25px ${fontName}`;
    let curY = wrapText(ctx, spread.rightLead, W - 76, 188, W - 152, 42, "right");

    // Bullet points
    curY += 32;
    spread.rightBullets.forEach((b) => {
      ctx.fillStyle = "#52279B";
      ctx.beginPath();
      ctx.arc(W - 86, curY - 9, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1A2254";
      ctx.font = `500 25px ${fontName}`;
      curY = wrapText(ctx, b, W - 110, curY, W - 200, 40, "right");
      curY += 16;
    });

    // Bottom Highlight Card
    const cardY = H - 360;
    drawRoundedRect(ctx, 72, cardY, W - 144, 230, 28);
    ctx.fillStyle = "#F8F7FB";
    ctx.fill();
    ctx.strokeStyle = "#EAE5F3";
    ctx.lineWidth = 2;
    ctx.stroke();

    const img = loadedImages[spread.rightImage];
    if (img) {
      ctx.drawImage(img, 100, cardY + 24, 170, 180);
    }

    ctx.fillStyle = "#1A2254";
    ctx.font = `800 30px ${fontName}`;
    ctx.textAlign = "right";
    ctx.fillText(spread.rightHighlightTitle, W - 104, cardY + 68);

    ctx.fillStyle = "#5A6A85";
    ctx.font = `400 23px ${fontName}`;
    wrapText(ctx, spread.rightHighlightDesc, W - 104, cardY + 116, W - 380, 36, "right");

    // Footer
    ctx.strokeStyle = "#EFEBF6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(72, H - 96);
    ctx.lineTo(W - 72, H - 96);
    ctx.stroke();

    ctx.fillStyle = "#64748B";
    ctx.font = `600 22px ${fontName}`;
    ctx.textAlign = "right";
    ctx.fillText(spread.chapter, W - 76, H - 54);
    ctx.textAlign = "left";
    ctx.fillText(spread.rightPageNum, 76, H - 54);
  } else {
    // Left Page (centered heading)
    ctx.fillStyle = "#1A2254";
    ctx.font = `800 42px ${fontName}`;
    ctx.textAlign = "center";
    ctx.fillText(spread.leftTitle, W / 2, 128);

    ctx.fillStyle = "#5A6A85";
    ctx.font = `400 24px ${fontName}`;
    wrapText(ctx, spread.leftLead, W / 2, 186, W - 160, 40, "center");

    // Stage Banner
    drawRoundedRect(ctx, 72, 300, W - 144, 340, 28);
    const stageGrad = ctx.createRadialGradient(W / 2, 470, 20, W / 2, 470, 340);
    stageGrad.addColorStop(0, "#F4F1FA");
    stageGrad.addColorStop(1, "#EAE5F3");
    ctx.fillStyle = stageGrad;
    ctx.fill();

    // Draw two product images on stage
    const p1 = spread.leftProducts[0];
    const p2 = spread.leftProducts[1];
    if (p1 && loadedImages[p1.image]) {
      ctx.drawImage(loadedImages[p1.image], W / 2 + 40, 330, 220, 280);
    }
    if (p2 && loadedImages[p2.image]) {
      ctx.drawImage(loadedImages[p2.image], W / 2 - 260, 335, 220, 270);
    }

    // Two Product Cards at bottom
    const cardW = (W - 144 - 28) / 2;
    spread.leftProducts.forEach((prod, idx) => {
      const cx = idx === 0 ? 72 + cardW + 28 : 72;
      const cy = 684;
      drawRoundedRect(ctx, cx, cy, cardW, 380, 26);
      ctx.fillStyle = "#F8F7FB";
      ctx.fill();
      ctx.strokeStyle = "#EAE5F3";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#1A2254";
      ctx.font = `800 28px ${fontName}`;
      ctx.textAlign = "right";
      ctx.fillText(prod.name, cx + cardW - 32, cy + 68);

      ctx.fillStyle = "#5A6A85";
      ctx.font = `400 22px ${fontName}`;
      wrapText(ctx, prod.desc, cx + cardW - 32, cy + 120, cardW - 64, 36, "right");

      // CTA pill inside page
      drawRoundedRect(ctx, cx + cardW - 230, cy + 288, 198, 56, 28);
      ctx.fillStyle = prod.btnColor;
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 22px ${fontName}`;
      ctx.textAlign = "center";
      ctx.fillText(prod.btnLabel, cx + cardW - 131, cy + 324);
    });

    // Footer
    ctx.strokeStyle = "#EFEBF6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(72, H - 96);
    ctx.lineTo(W - 72, H - 96);
    ctx.stroke();

    ctx.fillStyle = "#64748B";
    ctx.font = `600 22px ${fontName}`;
    ctx.textAlign = "right";
    ctx.fillText(spread.leftFooter, W - 76, H - 54);
    ctx.textAlign = "left";
    ctx.fillText(spread.leftPageNum, 76, H - 54);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Pure Three.js 3D Open-Book with real CanvasTexture pages,
 * stacked 3D paper blocks, navy hardcover, purple spine, gold trim,
 * and genuine 3D two-sided page-turning animation via GSAP.
 */
export default function ThreeBookCanvas({
  spreads,
  spreadIndex,
  isZoomed,
  onTurnPage,
}: ThreeBookCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const bookGroupRef = useRef<THREE.Group | null>(null);
  const rightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const leftMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const flipPivotRef = useRef<THREE.Group | null>(null);
  const flipFrontMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const flipBackMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const texturesRef = useRef<Array<{ right: THREE.CanvasTexture; left: THREE.CanvasTexture }>>([]);
  const prevSpreadRef = useRef<number>(spreadIndex);
  const initialSpreadRef = useRef<number>(spreadIndex);
  const targetTiltRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetZoomRef = useRef<number>(1);
  const isFlippingRef = useRef<boolean>(false);

  useEffect(() => {
    targetZoomRef.current = isZoomed ? 1.12 : 1;
  }, [isZoomed]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const width = container.clientWidth || 1040;
    const height = container.clientHeight || 580;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 1.35, 9.4);
    camera.lookAt(0, -0.05, 0);

    // Lighting matching Dermalight clinical luxury palette
    const ambient = new THREE.AmbientLight(0xffffff, 1.05);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
    dirLight.position.set(3.5, 7.5, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const purpleRim = new THREE.PointLight(0x52279b, 1.8, 18);
    purpleRim.position.set(-5, 2.5, 4);
    scene.add(purpleRim);

    const goldAccent = new THREE.PointLight(0xe2be74, 1.2, 16);
    goldAccent.position.set(5, -1.5, 4);
    scene.add(goldAccent);

    // Soft shadow receiver plane under the 3D book
    const shadowGeo = new THREE.PlaneGeometry(14, 9);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.16 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.85;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 3D Open Book Group
    const bookGroup = new THREE.Group();
    bookGroup.rotation.x = 0.12;
    scene.add(bookGroup);
    bookGroupRef.current = bookGroup;

    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x1a2254,
      roughness: 0.38,
      metalness: 0.25,
    });
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x52279b,
      roughness: 0.32,
      metalness: 0.35,
    });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0xefeaf8,
      roughness: 0.8,
      metalness: 0.02,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xe2be74,
      roughness: 0.25,
      metalness: 0.8,
    });

    // Left & Right Hardcover Boards (angled slightly open)
    const coverGeo = new THREE.BoxGeometry(4.4, 5.25, 0.14);
    const leftCover = new THREE.Mesh(coverGeo, coverMat);
    leftCover.position.set(-2.22, 0, -0.18);
    leftCover.rotation.y = 0.09;
    leftCover.castShadow = true;
    bookGroup.add(leftCover);

    const rightCover = new THREE.Mesh(coverGeo, coverMat);
    rightCover.position.set(2.22, 0, -0.18);
    rightCover.rotation.y = -0.09;
    rightCover.castShadow = true;
    bookGroup.add(rightCover);

    // 3D Spine + Gold Bands
    const spineGeo = new THREE.CylinderGeometry(0.18, 0.18, 5.28, 24);
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(0, 0, -0.16);
    spine.castShadow = true;
    bookGroup.add(spine);

    const bandGeo = new THREE.CylinderGeometry(0.195, 0.195, 0.11, 24);
    [-2.2, 0, 2.2].forEach((yPos) => {
      const band = new THREE.Mesh(bandGeo, goldMat);
      band.position.set(0, yPos, -0.16);
      bookGroup.add(band);
    });

    // Gold Ribbon Bookmark hanging out at bottom
    const ribbonGeo = new THREE.BoxGeometry(0.24, 0.55, 0.03);
    const ribbonMesh = new THREE.Mesh(ribbonGeo, goldMat);
    ribbonMesh.position.set(0, -2.72, -0.02);
    bookGroup.add(ribbonMesh);

    // Left & Right 3D Stacked Paper Thickness Blocks
    const stackGeo = new THREE.BoxGeometry(4.15, 4.98, 0.24);
    const leftStack = new THREE.Mesh(stackGeo, edgeMat);
    leftStack.position.set(-2.12, 0, 0.02);
    leftStack.rotation.y = 0.09;
    leftStack.castShadow = true;
    bookGroup.add(leftStack);

    const rightStack = new THREE.Mesh(stackGeo, edgeMat);
    rightStack.position.set(2.12, 0, 0.02);
    rightStack.rotation.y = -0.09;
    rightStack.castShadow = true;
    bookGroup.add(rightStack);

    // Build initial page textures
    const loadedImgs: Record<string, HTMLImageElement> = {};
    const buildAllTextures = () => {
      texturesRef.current.forEach((t) => {
        t.right.dispose();
        t.left.dispose();
      });
      texturesRef.current = spreads.map((sp) => ({
        right: createPageTexture(sp, "right", loadedImgs),
        left: createPageTexture(sp, "left", loadedImgs),
      }));
      const initIdx = initialSpreadRef.current;
      if (rightMatRef.current && texturesRef.current[initIdx]) {
        rightMatRef.current.map = texturesRef.current[initIdx].right;
        rightMatRef.current.needsUpdate = true;
      }
      if (leftMatRef.current && texturesRef.current[initIdx]) {
        leftMatRef.current.map = texturesRef.current[initIdx].left;
        leftMatRef.current.needsUpdate = true;
      }
    };

    // Static textured page planes sitting cleanly on top of the stacked blocks
    const pagePlaneGeo = new THREE.PlaneGeometry(4.12, 4.94);
    const rightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.02,
    });
    const leftMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.02,
    });
    rightMatRef.current = rightMat;
    leftMatRef.current = leftMat;

    const rightPageMesh = new THREE.Mesh(pagePlaneGeo, rightMat);
    rightPageMesh.position.set(2.11, 0, 0.145);
    rightPageMesh.rotation.y = -0.09;
    bookGroup.add(rightPageMesh);

    const leftPageMesh = new THREE.Mesh(pagePlaneGeo, leftMat);
    leftPageMesh.position.set(-2.11, 0, 0.145);
    leftPageMesh.rotation.y = 0.09;
    bookGroup.add(leftPageMesh);

    // Real 3D Two-Sided Turning Page Pivot at Spine (x = 0)
    const flipPivot = new THREE.Group();
    flipPivot.position.set(0, 0, 0.17);
    flipPivot.visible = false;
    bookGroup.add(flipPivot);
    flipPivotRef.current = flipPivot;

    const flipGeo = new THREE.PlaneGeometry(4.12, 4.94, 16, 1);
    const flipFrontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.68,
      metalness: 0.03,
      side: THREE.FrontSide,
    });
    const flipBackMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.68,
      metalness: 0.03,
      side: THREE.BackSide,
    });
    flipFrontMatRef.current = flipFrontMat;
    flipBackMatRef.current = flipBackMat;

    const flipFrontMesh = new THREE.Mesh(flipGeo, flipFrontMat);
    flipFrontMesh.position.set(2.06, 0, 0);
    flipFrontMesh.castShadow = true;
    flipPivot.add(flipFrontMesh);

    const flipBackMesh = new THREE.Mesh(flipGeo, flipBackMat);
    flipBackMesh.position.set(2.06, 0, -0.002);
    flipBackMesh.castShadow = true;
    flipPivot.add(flipBackMesh);

    // Floating ambient particles
    const particleCount = 40;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.5 + 0.4;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x52279b,
      size: 0.055,
      transparent: true,
      opacity: 0.3,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Draw initial textures immediately, then refresh once product images finish loading
    buildAllTextures();
    const imgUrls = Array.from(
      new Set(
        spreads.flatMap((s) => [s.rightImage, ...s.leftProducts.map((p) => p.image)]),
      ),
    );
    let remaining = imgUrls.length;
    imgUrls.forEach((url) => {
      const im = new window.Image();
      im.crossOrigin = "anonymous";
      im.onload = () => {
        loadedImgs[url] = im;
        remaining -= 1;
        if (remaining === 0) buildAllTextures();
      };
      im.onerror = () => {
        remaining -= 1;
      };
      im.src = url;
    });

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (bookGroupRef.current) {
        const targetX = 0.14 + targetTiltRef.current.x * 0.14;
        const targetY = targetTiltRef.current.y * 0.18;
        bookGroupRef.current.rotation.x += (targetX - bookGroupRef.current.rotation.x) * 0.08;
        bookGroupRef.current.rotation.y += (targetY - bookGroupRef.current.rotation.y) * 0.08;
        bookGroupRef.current.position.y = Math.sin(t * 1.3) * 0.04;

        const curScale = bookGroupRef.current.scale.x;
        const nextScale = curScale + (targetZoomRef.current - curScale) * 0.1;
        bookGroupRef.current.scale.set(nextScale, nextScale, nextScale);
      }

      particles.rotation.y = t * 0.035;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1040;
      const h = container.clientHeight || 580;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      texturesRef.current.forEach((t) => {
        t.right.dispose();
        t.left.dispose();
      });
      coverGeo.dispose();
      spineGeo.dispose();
      bandGeo.dispose();
      ribbonGeo.dispose();
      stackGeo.dispose();
      pagePlaneGeo.dispose();
      flipGeo.dispose();
      shadowGeo.dispose();
      particleGeo.dispose();
      coverMat.dispose();
      spineMat.dispose();
      edgeMat.dispose();
      goldMat.dispose();
      rightMat.dispose();
      leftMat.dispose();
      flipFrontMat.dispose();
      flipBackMat.dispose();
      shadowMat.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [spreads]);

  // Genuine 3D Page-Flip driven by GSAP when spreadIndex changes
  useEffect(() => {
    if (prevSpreadRef.current === spreadIndex) return;
    const prevIdx = prevSpreadRef.current;
    const forward = spreadIndex > prevIdx;
    prevSpreadRef.current = spreadIndex;

    const pivot = flipPivotRef.current;
    const rightMat = rightMatRef.current;
    const leftMat = leftMatRef.current;
    const frontMat = flipFrontMatRef.current;
    const backMat = flipBackMatRef.current;
    const prevTex = texturesRef.current[prevIdx];
    const nextTex = texturesRef.current[spreadIndex];

    if (!pivot || !rightMat || !leftMat || !frontMat || !backMat || !prevTex || !nextTex) {
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      rightMat.map = nextTex.right;
      leftMat.map = nextTex.left;
      rightMat.needsUpdate = true;
      leftMat.needsUpdate = true;
      return;
    }

    isFlippingRef.current = true;
    gsap.killTweensOf(pivot.rotation);

    if (forward) {
      // RTL Forward: Right page flips over the spine to the Left
      frontMat.map = prevTex.right;
      backMat.map = nextTex.left;
      frontMat.needsUpdate = true;
      backMat.needsUpdate = true;

      rightMat.map = nextTex.right;
      rightMat.needsUpdate = true;

      pivot.visible = true;
      pivot.rotation.y = -0.09;

      gsap.to(pivot.rotation, {
        y: -Math.PI + 0.09,
        duration: 0.78,
        ease: "power2.inOut",
        onComplete: () => {
          leftMat.map = nextTex.left;
          leftMat.needsUpdate = true;
          pivot.visible = false;
          isFlippingRef.current = false;
        },
      });
    } else {
      // RTL Backward: Left page flips back over the spine to the Right
      frontMat.map = nextTex.right;
      backMat.map = prevTex.left;
      frontMat.needsUpdate = true;
      backMat.needsUpdate = true;

      leftMat.map = nextTex.left;
      leftMat.needsUpdate = true;

      pivot.visible = true;
      pivot.rotation.y = -Math.PI + 0.09;

      gsap.to(pivot.rotation, {
        y: -0.09,
        duration: 0.78,
        ease: "power2.inOut",
        onComplete: () => {
          rightMat.map = nextTex.right;
          rightMat.needsUpdate = true;
          pivot.visible = false;
          isFlippingRef.current = false;
        },
      });
    }
  }, [spreadIndex]);

  return (
    <div
      ref={mountRef}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        targetTiltRef.current = { x: -ny, y: nx };
      }}
      onMouseLeave={() => {
        targetTiltRef.current = { x: 0, y: 0 };
      }}
      onClick={(e) => {
        if (isFlippingRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const isLeftHalf = e.clientX - rect.left < rect.width / 2;
        // In RTL, clicking left half goes next, clicking right half goes prev
        onTurnPage(isLeftHalf ? 1 : -1);
      }}
      title="برای ورق‌زدن سه‌بعدی روی صفحه کلیک کنید"
      style={{
        width: "100%",
        height: "clamp(420px, 54vw, 620px)",
        cursor: "pointer",
      }}
    />
  );
}
