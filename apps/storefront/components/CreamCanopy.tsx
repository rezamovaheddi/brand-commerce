import React from "react";

/**
 * 3D Cream Drip Canopy (هدر کرم چکان سه‌بعدی و براق)
 * Pure SVG with specular highlights, pearl bubbles and deep drop shadows.
 * Hardware accelerated and pointer-events: none.
 */
export default function CreamCanopy() {
  return (
    <div className="cream-drip-canopy" aria-hidden="true">
      <svg
        viewBox="0 0 1600 250"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="creamBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffef9" />
            <stop offset="46%" stopColor="#f7f0e4" />
            <stop offset="82%" stopColor="#e5d7c3" />
            <stop offset="100%" stopColor="#ccb99f" />
          </linearGradient>
          <linearGradient id="creamGlossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
            <stop offset="65%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="bubbleGlow" cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#efe4d3" />
            <stop offset="100%" stopColor="#cdbba0" />
          </radialGradient>
        </defs>

        {/* Soft shadow depth under the cream canopy */}
        <path
          d="M0,0 L1600,0 L1600,124 C1574,126 1554,148 1546,162 C1536,178 1510,174 1506,144 C1502,114 1472,102 1446,120 C1424,136 1416,184 1394,186 C1372,188 1364,146 1352,126 C1334,98 1286,98 1266,130 C1248,160 1244,218 1220,218 C1196,218 1192,158 1178,132 C1162,100 1126,102 1114,134 C1104,162 1094,174 1076,174 C1058,174 1052,144 1044,124 C1030,92 982,92 968,128 C954,164 950,210 928,210 C906,210 902,156 888,128 C870,96 822,94 804,134 C792,162 790,194 768,194 C746,194 744,154 732,126 C714,92 666,94 648,132 C632,164 628,220 604,220 C580,220 578,158 564,130 C544,94 494,96 476,136 C462,166 456,180 436,180 C416,180 410,148 398,128 C378,96 328,96 312,134 C298,166 292,216 268,216 C244,216 240,158 226,128 C208,94 162,94 144,130 C130,158 118,172 98,170 C78,168 70,136 52,124 C34,112 14,122 0,134 Z"
          fill="rgba(182, 162, 138, 0.40)"
          transform="translate(0, 7)"
        />

        {/* Main silky cream dripping body */}
        <path
          d="M0,0 L1600,0 L1600,118 C1574,120 1554,142 1546,156 C1536,172 1510,168 1506,138 C1502,108 1472,96 1446,114 C1424,130 1416,178 1394,180 C1372,182 1364,140 1352,120 C1334,92 1286,92 1266,124 C1248,154 1244,212 1220,212 C1196,212 1192,152 1178,126 C1162,94 1126,96 1114,128 C1104,156 1094,168 1076,168 C1058,168 1052,138 1044,118 C1030,86 982,86 968,122 C954,158 950,204 928,204 C906,204 902,150 888,122 C870,90 822,88 804,128 C792,156 790,188 768,188 C746,188 744,148 732,120 C714,86 666,88 648,126 C632,158 628,214 604,214 C580,214 578,152 564,124 C544,88 494,90 476,130 C462,160 456,174 436,174 C416,174 410,142 398,122 C378,90 328,90 312,128 C298,160 292,210 268,210 C244,210 240,152 226,122 C208,88 162,88 144,124 C130,152 118,166 98,164 C78,162 70,130 52,118 C34,106 14,116 0,128 Z"
          fill="url(#creamBodyGrad)"
        />

        {/* Specular gloss highlights */}
        <ellipse cx="268" cy="194" rx="11" ry="15" fill="url(#creamGlossGrad)" />
        <ellipse cx="604" cy="197" rx="11" ry="16" fill="url(#creamGlossGrad)" />
        <ellipse cx="768" cy="173" rx="10" ry="13" fill="url(#creamGlossGrad)" />
        <ellipse cx="928" cy="188" rx="11" ry="15" fill="url(#creamGlossGrad)" />
        <ellipse cx="1220" cy="195" rx="11" ry="16" fill="url(#creamGlossGrad)" />
        <ellipse cx="1394" cy="164" rx="10" ry="13" fill="url(#creamGlossGrad)" />
        <ellipse cx="436" cy="160" rx="10" ry="11" fill="url(#creamGlossGrad)" />
        <ellipse cx="98" cy="150" rx="10" ry="11" fill="url(#creamGlossGrad)" />

        {/* Micro pearl bubbles */}
        <g opacity="0.88">
          <circle cx="132" cy="84" r="5" fill="url(#bubbleGlow)" />
          <circle cx="148" cy="92" r="2.8" fill="url(#bubbleGlow)" />
          <circle cx="348" cy="82" r="4.5" fill="url(#bubbleGlow)" />
          <circle cx="520" cy="88" r="3.6" fill="url(#bubbleGlow)" />
          <circle cx="848" cy="84" r="5.2" fill="url(#bubbleGlow)" />
          <circle cx="1028" cy="80" r="4" fill="url(#bubbleGlow)" />
          <circle cx="1306" cy="86" r="5" fill="url(#bubbleGlow)" />
          <circle cx="1474" cy="88" r="3.8" fill="url(#bubbleGlow)" />
        </g>
      </svg>
    </div>
  );
}
