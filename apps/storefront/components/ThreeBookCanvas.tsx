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

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
) {
  const iw = img.naturalWidth || img.width || 1;
  const ih = img.naturalHeight || img.height || 1;
  const scale = Math.min(boxW / iw, boxH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = boxX + (boxW - dw) / 2;
  const dy = boxY + (boxH - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
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

function createPageEdgeTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FAF8FF";
  ctx.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? "rgba(82, 39, 155, 0.12)" : "rgba(26, 34, 84, 0.05)";
    ctx.fillRect(0, y, 64, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  return tex;
}

function applyPageArch(geo: THREE.PlaneGeometry, side: "right" | "left") {
  const pos = geo.attributes.position;
  const w = 4.12;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    // Normalized distance from spine (0 at spine, 1 at outer edge)
    const u = side === "right" ? (x + w / 2) / w : (w / 2 - x) / w;
    // Gentle paper arch rising from spine and settling toward outer edge
    const arch = Math.sin(u * Math.PI) * 0.14 - (1 - u) * 0.05;
    pos.setZ(i, arch);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

function createPageTexture(
  spread: BookSpreadData,
  side: "right" | "left",
  loadedImages: Record<string, HTMLImageElement>,
): THREE.CanvasTexture {
  const W = 1200;
  const H = 1460;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.direction = "rtl";

  // Crisp bright ivory-white paper background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#FFFFFF");
  bg.addColorStop(1, "#FBF9FF");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Delicate outer paper frame line
  drawRoundedRect(ctx, 26, 26, W - 52, H - 52, 22);
  ctx.strokeStyle = "rgba(82, 39, 155, 0.09)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Gentle spine gutter shading
  const spineGrad =
    side === "right"
      ? ctx.createLinearGradient(0, 0, 110, 0)
      : ctx.createLinearGradient(W - 110, 0, W, 0);
  if (side === "right") {
    spineGrad.addColorStop(0, "rgba(26, 34, 84, 0.11)");
    spineGrad.addColorStop(1, "rgba(26, 34, 84, 0)");
    ctx.fillStyle = spineGrad;
    ctx.fillRect(0, 0, 110, H);
  } else {
    spineGrad.addColorStop(0, "rgba(26, 34, 84, 0)");
    spineGrad.addColorStop(1, "rgba(26, 34, 84, 0.11)");
    ctx.fillStyle = spineGrad;
    ctx.fillRect(W - 110, 0, 110, H);
  }

  // Subtle gold corner flourishes
  ctx.strokeStyle = "rgba(226, 190, 116, 0.72)";
  ctx.lineWidth = 3.5;
  const m = 48;
  const cLen = 36;
  ctx.beginPath();
  ctx.moveTo(W - m - cLen, m);
  ctx.lineTo(W - m, m);
  ctx.lineTo(W - m, m + cLen);
  ctx.moveTo(m + cLen, m);
  ctx.lineTo(m, m);
  ctx.lineTo(m, m + cLen);
  ctx.moveTo(W - m - cLen, H - m);
  ctx.lineTo(W - m, H - m);
  ctx.lineTo(W - m, H - m - cLen);
  ctx.moveTo(m + cLen, H - m);
  ctx.lineTo(m, H - m);
  ctx.lineTo(m, H - m - cLen);
  ctx.stroke();

  const fontName = "'Vazirmatn RD UI FD', 'Vazirmatn', Tahoma, sans-serif";

  if (side === "right") {
    // Purple Bookmark Ribbon on top-right of right page
    ctx.fillStyle = "#52279B";
    ctx.beginPath();
    ctx.moveTo(W - 210, 0);
    ctx.lineTo(W - 150, 0);
    ctx.lineTo(W - 150, 100);
    ctx.lineTo(W - 180, 76);
    ctx.lineTo(W - 210, 100);
    ctx.closePath();
    ctx.fill();

    // Chapter pill badge
    drawRoundedRect(ctx, W - 360, 76, 270, 44, 22);
    ctx.fillStyle = "#F1ECFA";
    ctx.fill();
    ctx.fillStyle = "#52279B";
    ctx.font = `700 22px ${fontName}`;
    ctx.textAlign = "center";
    ctx.fillText(spread.chapter, W - 225, 105);

    // Heading
    ctx.fillStyle = "#1A2254";
    ctx.font = `800 50px ${fontName}`;
    ctx.textAlign = "right";
    ctx.fillText(spread.rightTitle, W - 88, 192);

    // Lead
    ctx.fillStyle = "#5A6A85";
    ctx.font = `400 28px ${fontName}`;
    let curY = wrapText(ctx, spread.rightLead, W - 88, 258, W - 176, 48, "right");

    // Numbered Step Badges
    curY += 40;
    const faNums = ["۱", "۲", "۳", "۴"];
    spread.rightBullets.forEach((b, idx) => {
      ctx.fillStyle = "#52279B";
      ctx.beginPath();
      ctx.arc(W - 108, curY - 10, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `800 22px ${fontName}`;
      ctx.textAlign = "center";
      ctx.fillText(faNums[idx] || String(idx + 1), W - 108, curY - 2);

      ctx.fillStyle = "#1A2254";
      ctx.font = `500 28px ${fontName}`;
      curY = wrapText(ctx, b, W - 144, curY, W - 250, 46, "right");
      curY += 22;
    });

    // Bottom Highlight Card
    const cardY = H - 425;
    ctx.save();
    ctx.shadowColor = "rgba(26, 34, 84, 0.07)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
    drawRoundedRect(ctx, 84, cardY, W - 168, 275, 30);
    ctx.fillStyle = "#F8F7FC";
    ctx.fill();
    ctx.restore();

    drawRoundedRect(ctx, 84, cardY, W - 168, 275, 30);
    ctx.strokeStyle = "#E4DDF2";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Soft circle behind product image
    ctx.fillStyle = "#EFEAF8";
    ctx.beginPath();
    ctx.arc(216, cardY + 138, 100, 0, Math.PI * 2);
    ctx.fill();

    const img = loadedImages[spread.rightImage];
    if (img) {
      drawImageContain(ctx, img, 122, cardY + 30, 188, 214);
    }

    ctx.fillStyle = "#1A2254";
    ctx.font = `800 35px ${fontName}`;
    ctx.textAlign = "right";
    ctx.fillText(spread.rightHighlightTitle, W - 120, cardY + 86);

    ctx.fillStyle = "#5A6A85";
    ctx.font = `400 26px ${fontName}`;
    wrapText(ctx, spread.rightHighlightDesc, W - 120, cardY + 142, W - 450, 42, "right");

    // Footer
    ctx.strokeStyle = "#EFEBF6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(84, H - 108);
    ctx.lineTo(W - 84, H - 108);
    ctx.stroke();

    ctx.fillStyle = "#64748B";
    ctx.font = `600 24px ${fontName}`;
    ctx.textAlign = "right";
    ctx.fillText(spread.chapter, W - 88, H - 58);
    ctx.textAlign = "left";
    ctx.fillText(spread.rightPageNum, 88, H - 58);
  } else {
    // Left Page (centered heading)
    ctx.fillStyle = "#1A2254";
    ctx.font = `800 48px ${fontName}`;
    ctx.textAlign = "center";
    ctx.fillText(spread.leftTitle, W / 2, 160);

    ctx.fillStyle = "#5A6A85";
    ctx.font = `400 27px ${fontName}`;
    wrapText(ctx, spread.leftLead, W / 2, 226, W - 190, 46, "center");

    // Stage Banner
    drawRoundedRect(ctx, 84, 355, W - 168, 395, 30);
    const stageGrad = ctx.createRadialGradient(W / 2, 552, 24, W / 2, 552, 420);
    stageGrad.addColorStop(0, "#FAF8FF");
    stageGrad.addColorStop(1, "#ECE6F6");
    ctx.fillStyle = stageGrad;
    ctx.fill();
    ctx.strokeStyle = "#E4DDF2";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw two product images with proper aspect ratio (contain)
    const p1 = spread.leftProducts[0];
    const p2 = spread.leftProducts[1];
    if (p1 && loadedImages[p1.image]) {
      drawImageContain(ctx, loadedImages[p1.image], W / 2 + 28, 382, 280, 340);
    }
    if (p2 && loadedImages[p2.image]) {
      drawImageContain(ctx, loadedImages[p2.image], W / 2 - 308, 386, 280, 332);
    }

    // Two Product Cards at bottom
    const cardW = (W - 168 - 32) / 2;
    spread.leftProducts.forEach((prod, idx) => {
      const cx = idx === 0 ? 84 + cardW + 32 : 84;
      const cy = 795;

      ctx.save();
      ctx.shadowColor = "rgba(26, 34, 84, 0.06)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      drawRoundedRect(ctx, cx, cy, cardW, 450, 28);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.restore();

      drawRoundedRect(ctx, cx, cy, cardW, 450, 28);
      ctx.strokeStyle = "#E4DDF2";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#1A2254";
      ctx.font = `800 32px ${fontName}`;
      ctx.textAlign = "right";
      ctx.fillText(prod.name, cx + cardW - 36, cy + 80);

      ctx.fillStyle = "#5A6A85";
      ctx.font = `400 25px ${fontName}`;
      wrapText(ctx, prod.desc, cx + cardW - 36, cy + 142, cardW - 72, 42, "right");

      // CTA pill inside page
      drawRoundedRect(ctx, cx + cardW - 266, cy + 344, 230, 64, 32);
      ctx.fillStyle = prod.btnColor;
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 25px ${fontName}`;
      ctx.textAlign = "center";
      ctx.fillText(prod.btnLabel, cx + cardW - 151, cy + 385);
    });

    // Footer
    ctx.strokeStyle = "#EFEBF6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(84, H - 108);
    ctx.lineTo(W - 84, H - 108);
    ctx.stroke();

    ctx.fillStyle = "#64748B";
    ctx.font = `600 24px ${fontName}`;
    ctx.textAlign = "right";
    ctx.fillText(spread.leftFooter, W - 88, H - 58);
    ctx.textAlign = "left";
    ctx.fillText(spread.leftPageNum, 88, H - 58);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Pure Three.js 3D Open-Book with rounded hardcover boards, crisp ivory-white
 * CanvasTexture pages, tucked purple spine with gold bands, soft shadow,
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
    targetZoomRef.current = isZoomed ? 1.1 : 1;
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
    const height = container.clientHeight || 600;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.75, 10.2);
    camera.lookAt(0, -0.05, 0);

    // Bright studio lighting so white pages stay crisp and luminous
    const ambient = new THREE.AmbientLight(0xffffff, 1.85);
    scene.add(ambient);

    const frontFill = new THREE.DirectionalLight(0xffffff, 0.85);
    frontFill.position.set(0, 1.5, 9);
    scene.add(frontFill);

    const topKey = new THREE.DirectionalLight(0xffffff, 0.65);
    topKey.position.set(3.5, 8, 5);
    topKey.castShadow = true;
    topKey.shadow.mapSize.width = 1024;
    topKey.shadow.mapSize.height = 1024;
    scene.add(topKey);

    const purpleRim = new THREE.PointLight(0x52279b, 1.1, 18);
    purpleRim.position.set(-5.5, 2.5, 4);
    scene.add(purpleRim);

    const goldAccent = new THREE.PointLight(0xe2be74, 0.8, 16);
    goldAccent.position.set(5.5, -1.5, 4);
    scene.add(goldAccent);

    // Soft shadow receiver plane under the 3D book
    const shadowGeo = new THREE.PlaneGeometry(15, 9);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.12 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.95;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 3D Open Book Group
    const bookGroup = new THREE.Group();
    bookGroup.rotation.x = 0.06;
    scene.add(bookGroup);
    bookGroupRef.current = bookGroup;

    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x1a2254,
      roughness: 0.36,
      metalness: 0.24,
    });
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x52279b,
      roughness: 0.34,
      metalness: 0.3,
    });
    const pageEdgeTex = createPageEdgeTexture();
    const edgeMat = new THREE.MeshStandardMaterial({
      map: pageEdgeTex,
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.02,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xe2be74,
      roughness: 0.24,
      metalness: 0.8,
    });

    // Rounded Hardcover Boards
    const coverShape = createRoundedRectShape(4.42, 5.28, 0.22);
    const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
    coverGeo.center();

    const leftCover = new THREE.Mesh(coverGeo, coverMat);
    leftCover.position.set(-2.22, 0, -0.2);
    leftCover.rotation.y = 0.07;
    leftCover.castShadow = true;
    bookGroup.add(leftCover);

    const rightCover = new THREE.Mesh(coverGeo, coverMat);
    rightCover.position.set(2.22, 0, -0.2);
    rightCover.rotation.y = -0.07;
    rightCover.castShadow = true;
    bookGroup.add(rightCover);

    // Tucked 3D Spine + Delicate Gold Bands
    const spineGeo = new THREE.CylinderGeometry(0.13, 0.13, 5.26, 24);
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(0, 0, -0.2);
    spine.castShadow = true;
    bookGroup.add(spine);

    const bandGeo = new THREE.CylinderGeometry(0.142, 0.142, 0.08, 24);
    [-2.15, 0, 2.15].forEach((yPos) => {
      const band = new THREE.Mesh(bandGeo, goldMat);
      band.position.set(0, yPos, -0.2);
      bookGroup.add(band);
    });

    // Gold Ribbon Bookmark at bottom
    const ribbonGeo = new THREE.BoxGeometry(0.22, 0.48, 0.025);
    const ribbonMesh = new THREE.Mesh(ribbonGeo, goldMat);
    ribbonMesh.position.set(0, -2.74, -0.06);
    bookGroup.add(ribbonMesh);

    // Rounded Stacked Paper Thickness Blocks
    const stackShape = createRoundedRectShape(4.16, 4.98, 0.14);
    const stackGeo = new THREE.ExtrudeGeometry(stackShape, {
      depth: 0.2,
      bevelEnabled: false,
    });
    stackGeo.center();

    const leftStack = new THREE.Mesh(stackGeo, edgeMat);
    leftStack.position.set(-2.12, 0, -0.01);
    leftStack.rotation.y = 0.07;
    leftStack.castShadow = true;
    bookGroup.add(leftStack);

    const rightStack = new THREE.Mesh(stackGeo, edgeMat);
    rightStack.position.set(2.12, 0, -0.01);
    rightStack.rotation.y = -0.07;
    rightStack.castShadow = true;
    bookGroup.add(rightStack);

    // Build page textures
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

    // Crisp arched paper planes curving naturally into the spine
    const rightPageGeo = new THREE.PlaneGeometry(4.12, 4.94, 24, 1);
    applyPageArch(rightPageGeo, "right");
    const leftPageGeo = new THREE.PlaneGeometry(4.12, 4.94, 24, 1);
    applyPageArch(leftPageGeo, "left");

    const rightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
    });
    const leftMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
    });
    rightMatRef.current = rightMat;
    leftMatRef.current = leftMat;

    const rightPageMesh = new THREE.Mesh(rightPageGeo, rightMat);
    rightPageMesh.position.set(2.1, 0, 0.11);
    rightPageMesh.rotation.y = -0.07;
    bookGroup.add(rightPageMesh);

    const leftPageMesh = new THREE.Mesh(leftPageGeo, leftMat);
    leftPageMesh.position.set(-2.1, 0, 0.11);
    leftPageMesh.rotation.y = 0.07;
    bookGroup.add(leftPageMesh);

    // Real 3D Two-Sided Turning Page Pivot at Spine (x = 0)
    const flipPivot = new THREE.Group();
    flipPivot.position.set(0, 0, 0.13);
    flipPivot.visible = false;
    bookGroup.add(flipPivot);
    flipPivotRef.current = flipPivot;

    const flipGeo = new THREE.PlaneGeometry(4.12, 4.94, 16, 1);
    const flipFrontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.FrontSide,
    });
    const flipBackMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.FrontSide,
    });
    flipFrontMatRef.current = flipFrontMat;
    flipBackMatRef.current = flipBackMat;

    const flipFrontMesh = new THREE.Mesh(flipGeo, flipFrontMat);
    flipFrontMesh.position.set(2.06, 0, 0);
    flipFrontMesh.castShadow = true;
    flipPivot.add(flipFrontMesh);

    const flipBackMesh = new THREE.Mesh(flipGeo, flipBackMat);
    flipBackMesh.position.set(2.06, 0, -0.002);
    flipBackMesh.rotation.y = Math.PI;
    flipBackMesh.castShadow = true;
    flipPivot.add(flipBackMesh);

    // Subtle floating ambient particles
    const particleCount = 32;
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
      size: 0.05,
      transparent: true,
      opacity: 0.25,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

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
        const targetX = 0.06 + targetTiltRef.current.x * 0.11;
        const targetY = targetTiltRef.current.y * 0.14;
        bookGroupRef.current.rotation.x += (targetX - bookGroupRef.current.rotation.x) * 0.08;
        bookGroupRef.current.rotation.y += (targetY - bookGroupRef.current.rotation.y) * 0.08;
        bookGroupRef.current.position.y = Math.sin(t * 1.25) * 0.035;

        const curScale = bookGroupRef.current.scale.x;
        const nextScale = curScale + (targetZoomRef.current - curScale) * 0.1;
        bookGroupRef.current.scale.set(nextScale, nextScale, nextScale);
      }

      particles.rotation.y = t * 0.03;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1040;
      const h = container.clientHeight || 600;
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
      pageEdgeTex.dispose();
      coverGeo.dispose();
      spineGeo.dispose();
      bandGeo.dispose();
      ribbonGeo.dispose();
      stackGeo.dispose();
      rightPageGeo.dispose();
      leftPageGeo.dispose();
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
      // Persian (RTL) Forward: Left page flips from LEFT (-PI) to RIGHT (0)
      backMat.map = prevTex.left;
      frontMat.map = nextTex.right;
      backMat.needsUpdate = true;
      frontMat.needsUpdate = true;

      leftMat.map = nextTex.left;
      leftMat.needsUpdate = true;

      pivot.visible = true;
      pivot.rotation.y = -Math.PI + 0.07;

      gsap.to(pivot.rotation, {
        y: -0.07,
        duration: 0.78,
        ease: "power2.inOut",
        onComplete: () => {
          rightMat.map = nextTex.right;
          rightMat.needsUpdate = true;
          pivot.visible = false;
          isFlippingRef.current = false;
        },
      });
    } else {
      // Persian (RTL) Backward: Right page flips from RIGHT (0) to LEFT (-PI)
      frontMat.map = prevTex.right;
      backMat.map = nextTex.left;
      frontMat.needsUpdate = true;
      backMat.needsUpdate = true;

      rightMat.map = nextTex.right;
      rightMat.needsUpdate = true;

      pivot.visible = true;
      pivot.rotation.y = -0.07;

      gsap.to(pivot.rotation, {
        y: -Math.PI + 0.07,
        duration: 0.78,
        ease: "power2.inOut",
        onComplete: () => {
          leftMat.map = nextTex.left;
          leftMat.needsUpdate = true;
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
        onTurnPage(isLeftHalf ? 1 : -1);
      }}
      title="برای ورق‌زدن سه‌بعدی روی صفحه کلیک کنید"
      style={{
        width: "100%",
        height: "clamp(460px, 56vw, 640px)",
        cursor: "pointer",
      }}
    />
  );
}
