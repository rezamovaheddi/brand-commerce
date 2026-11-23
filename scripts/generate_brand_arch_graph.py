#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Brand Commerce Platform - Architecture Graph Generator
Scans apps/api, apps/storefront, packages/contracts, packages/domain, packages/database.
Generates graphify-out/graph.json and an interactive 4-level Vis.js graph dashboard in HTML.
"""

import os
import sys
import re
import json
from pathlib import Path
from collections import defaultdict

script_dir = Path(__file__).resolve().parent
if (script_dir.parent / "brand-commerce").is_dir():
    ROOT_DIR = script_dir.parent / "brand-commerce"
elif (script_dir.parent / "apps").is_dir():
    ROOT_DIR = script_dir.parent
elif (script_dir / "apps").is_dir():
    ROOT_DIR = script_dir
else:
    ROOT_DIR = Path.cwd()

# Excluded folders
EXCLUDE_DIRS = {"node_modules", ".next", "dist", ".turbo", "build", ".git", ".system_generated"}

def classify_layer(rel_path, node_id, kind):
    p = rel_path.lower().replace("\\", "/")
    if "test" in p or p.endswith(".spec.ts") or p.endswith(".e2e-spec.ts"):
        return "test"
    if "packages/contracts" in p:
        return "contracts"
    if "packages/domain" in p:
        return "domain-logic"
    if "packages/database" in p or "schema.prisma" in p:
        return "database"
    if "apps/storefront" in p:
        return "frontend"
    if "apps/api" in p:
        if "controller" in p or "controller" in node_id.lower():
            return "api-controller"
        if "service" in p or "service" in node_id.lower():
            return "api-service"
        if "module" in p:
            return "api-module"
        return "backend"
    return "other"

def classify_domain(rel_path, node_id, label):
    s = (rel_path + " " + node_id + " " + label).lower().replace("\\", "/")
    if any(k in s for k in ["cart", "سبد"]):
        return "Cart & Checkout (سبد خرید و تسویه)"
    if any(k in s for k in ["checkout", "order", "سفارش"]):
        return "Cart & Checkout (سبد خرید و تسویه)"
    if any(k in s for k in ["payment", "refund", "پرداخت", "استرداد", "shetab"]):
        return "Payments & Refund (درگاه پرداخت و استرداد)"
    if any(k in s for k in ["inventory", "ledger", "انبار", "لجر", "balance", "stock"]):
        return "Inventory & Ledger (انبارداری، رزرواسیون و لجر مالی)"
    if any(k in s for k in ["rfq", "quote", "استعلام"]):
        return "B2B Wholesale & RFQ (سازمانی، عمده و استعلام قیمت)"
    if any(k in s for k in ["b2b", "wholesale", "organization", "عمده"]):
        return "B2B Wholesale & RFQ (سازمانی، عمده و استعلام قیمت)"
    if any(k in s for k in ["oem", "formulation", "سفارشی"]):
        return "OEM Formulation (تولید سفارشی و فرمولاسیون)"
    if any(k in s for k in ["crm", "ticket", "support", "پشتیبانی"]):
        return "CRM & Support (پشتیبانی و تیکتینگ)"
    if any(k in s for k in ["product", "catalog", "inci", "variant", "محصول"]):
        return "Products & Catalog (محصولات، کاتالوگ و فرمول‌ها)"
    if any(k in s for k in ["auth", "jwt", "session", "user", "permission", "دسترسی"]):
        return "Auth & Identity (احراز هویت و دسترسی)"
    if any(k in s for k in ["storefront", "canopy", "stardust", "hero", "bookcatalog", "dock", "consultation", "loyalty", "magazine"]):
        return "B2C Storefront (فروشگاه B2C و تجربه کاربری)"
    if "prisma" in s or "database" in s:
        return "Database & Schema (پایگاه داده و مدل‌ها)"
    if "domain" in s or "contracts" in s:
        return "Shared Contracts & Logic (قراردادها و منطق دامنه)"
    return "Core Platform (هسته پلتفرم)"

def parse_typescript_file(file_path, root_dir):
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception:
        return [], [], []

    rel_path = file_path.relative_to(root_dir).as_posix()
    file_id = rel_path
    
    # Extract imports
    imports = []
    # Match: import ... from '...' or import(...)
    import_matches = re.findall(r'''import\s+(?:(?:[\w*\s{},$]+)\s+from\s+)?['"]([^'"]+)['"]''', content)
    for imp in import_matches:
        imports.append(imp)

    # Extract symbols
    symbols = []
    # Classes
    for match in re.finditer(r'''export\s+class\s+(\w+)''', content):
        symbols.append({"name": match.group(1), "kind": "class", "loc": match.start()})
    # Functions
    for match in re.finditer(r'''export\s+(?:default\s+)?function\s+(\w+)''', content):
        symbols.append({"name": match.group(1), "kind": "function", "loc": match.start()})
    # Const components / schemas / contracts
    for match in re.finditer(r'''export\s+const\s+(\w+)\s*=\s*(?:z\.|use|memo|forwardRef|\(|[A-Z])''', content):
        symbols.append({"name": match.group(1), "kind": "symbol", "loc": match.start()})
    # Interfaces and types
    for match in re.finditer(r'''export\s+(?:type|interface)\s+(\w+)''', content):
        symbols.append({"name": match.group(1), "kind": "type", "loc": match.start()})

    return file_id, imports, symbols

def parse_prisma_schema(file_path, root_dir):
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception:
        return [], []
    rel_path = file_path.relative_to(root_dir).as_posix()
    file_id = rel_path
    models = []
    for match in re.finditer(r'''model\s+(\w+)\s*{([^}]+)}''', content):
        model_name = match.group(1)
        body = match.group(2)
        # find relations
        relations = []
        for line in body.splitlines():
            line = line.strip()
            # Check field references
            parts = line.split()
            if len(parts) >= 2 and parts[1] in ["User", "Product", "Variant", "Cart", "CartItem", "Order", "OrderItem", "Payment", "InventoryItem", "LedgerEntry", "Organization", "Rfq"]:
                relations.append(parts[1])
        models.append({"name": model_name, "relations": relations})
    return file_id, models

def main():
    if not ROOT_DIR.exists():
        print(f"Error: ROOT_DIR does not exist: {ROOT_DIR}")
        sys.exit(1)

    print(f"Scanning codebase at: {ROOT_DIR}")
    
    files_map = {}
    nodes = []
    edges = []
    node_ids = set()

    # 1. Walk repository
    for root, dirs, files in os.walk(ROOT_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            p = Path(root) / f
            ext = p.suffix.lower()
            if ext in [".ts", ".tsx"]:
                fid, imps, syms = parse_typescript_file(p, ROOT_DIR)
                files_map[fid] = {"path": p, "imports": imps, "symbols": syms, "type": "ts"}
            elif ext == ".prisma":
                fid, models = parse_prisma_schema(p, ROOT_DIR)
                files_map[fid] = {"path": p, "models": models, "type": "prisma"}

    print(f"Found {len(files_map)} relevant code and schema files.")

    # 2. Build nodes & edges
    for fid, fmeta in files_map.items():
        fname = Path(fid).name
        layer = classify_layer(fid, fname, fmeta["type"])
        domain = classify_domain(fid, fname, fname)

        file_node = {
            "id": fid,
            "label": fname,
            "source_file": fid,
            "layer": layer,
            "domain": domain,
            "kind": "file",
            "language": "TypeScript" if fmeta["type"] == "ts" else "Prisma",
            "is_symbol": False,
            "external": False
        }
        nodes.append(file_node)
        node_ids.add(fid)

        # Handle symbols
        if fmeta["type"] == "ts":
            for s in fmeta.get("symbols", []):
                sid = f"{fid}#{s['name']}"
                s_layer = classify_layer(fid, s["name"], s["kind"])
                s_domain = classify_domain(fid, s["name"], s["name"])
                nodes.append({
                    "id": sid,
                    "label": s["name"],
                    "source_file": fid,
                    "layer": s_layer,
                    "domain": s_domain,
                    "kind": s["kind"],
                    "language": "TypeScript",
                    "is_symbol": True,
                    "external": False
                })
                node_ids.add(sid)
                edges.append({
                    "from": sid,
                    "to": fid,
                    "relation": "member_of"
                })

        elif fmeta["type"] == "prisma":
            for m in fmeta.get("models", []):
                mid = f"model_{m['name']}"
                nodes.append({
                    "id": mid,
                    "label": f"Model {m['name']}",
                    "source_file": fid,
                    "layer": "database",
                    "domain": classify_domain(fid, m["name"], m["name"]),
                    "kind": "model",
                    "language": "Prisma",
                    "is_symbol": True,
                    "external": False
                })
                node_ids.add(mid)
                edges.append({
                    "from": mid,
                    "to": fid,
                    "relation": "schema_def"
                })
                for target_model in m["relations"]:
                    t_mid = f"model_{target_model}"
                    edges.append({
                        "from": mid,
                        "to": t_mid,
                        "relation": "references"
                    })

    # 3. Resolve file-to-file import edges
    for fid, fmeta in files_map.items():
        if fmeta["type"] != "ts":
            continue
        cur_dir = Path(fid).parent
        for imp in fmeta.get("imports", []):
            target_fid = None
            if imp.startswith("@bc/contracts"):
                target_fid = "packages/contracts/src/index.ts"
            elif imp.startswith("@bc/domain"):
                target_fid = "packages/domain/src/index.ts"
            elif imp.startswith("@bc/database"):
                target_fid = "packages/database/src/index.ts"
            elif imp.startswith("."):
                # relative import
                resolved = (cur_dir / imp).resolve()
                # try extensions
                for candidate in [resolved.with_suffix(".ts"), resolved.with_suffix(".tsx"), resolved / "index.ts", resolved / "index.tsx"]:
                    cand_posix = candidate.as_posix().replace("\\", "/")
                    for k in files_map:
                        if k.replace("\\", "/").endswith(cand_posix) or cand_posix.endswith(k.replace("\\", "/")):
                            target_fid = k
                            break
                    if target_fid:
                        break

            if target_fid and target_fid in node_ids and target_fid != fid:
                edges.append({
                    "from": fid,
                    "to": target_fid,
                    "relation": "imports"
                })

    # Deduplicate edges
    unique_edges = []
    edge_seen = set()
    for e in edges:
        key = (e["from"], e["to"], e.get("relation", ""))
        if key not in edge_seen:
            edge_seen.add(key)
            unique_edges.append(e)

    # Compute degree and deps
    deps_map = defaultdict(set)
    rdeps_map = defaultdict(set)
    for e in unique_edges:
        deps_map[e["from"]].add(e["to"])
        rdeps_map[e["to"]].add(e["from"])

    for n in nodes:
        n["deps"] = sorted(list(deps_map[n["id"]]))
        n["rdeps"] = sorted(list(rdeps_map[n["id"]]))

    layers_dict = defaultdict(list)
    domains_dict = defaultdict(list)
    for n in nodes:
        layers_dict[n["layer"]].append(n["id"])
        domains_dict[n["domain"]].append(n["id"])

    metrics = {
        "پلتفرم": "Brand Commerce Platform (Dermavia / Brand Master)",
        "تعداد کل گره‌ها (Nodes)": len(nodes),
        "تعداد روابط (Edges)": len(unique_edges),
        "تعداد فایل‌های سورس": len(files_map),
        "لایه‌های معماری": len(layers_dict),
        "دامنه‌های تجاری": len(domains_dict),
        "میانگین اتصالات": round((2.0 * len(unique_edges)) / max(1, len(nodes)), 2)
    }
    for lk, lmembers in sorted(layers_dict.items()):
        metrics[f"لایه {lk}"] = len(lmembers)

    data_payload = {
        "nodes": nodes,
        "edges": unique_edges,
        "layers": {k: len(v) for k, v in layers_dict.items()},
        "domains": {k: len(v) for k, v in domains_dict.items()}
    }

    # Save graphify-out/graph.json
    out_dir = ROOT_DIR / "graphify-out"
    out_dir.mkdir(parents=True, exist_ok=True)
    graph_json_path = out_dir / "graph.json"
    with open(graph_json_path, "w", encoding="utf-8") as f:
        json.dump(data_payload, f, ensure_ascii=False, indent=2)
    print(f"Saved graph JSON: {graph_json_path}")

    # Generate HTML Dashboard
    html_content = generate_html_dashboard(data_payload, metrics)
    
    html_path1 = ROOT_DIR / "brand_arch_graph.html"
    html_path1.write_text(html_content, encoding="utf-8")
    print(f"Generated Dashboard in repo: {html_path1}")

    desktop_path = Path.home() / "Desktop" / "brand_arch_graph.html"
    try:
        desktop_path.write_text(html_content, encoding="utf-8")
        print(f"Generated Dashboard on Desktop: {desktop_path}")
    except Exception as ex:
        print(f"Desktop write note: {ex}")

def generate_html_dashboard(data_payload, metrics):
    data_json = json.dumps(data_payload, ensure_ascii=False)
    metrics_json = json.dumps(metrics, indent=2, ensure_ascii=False)

    return f"""<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Brand Commerce Platform · نقشه تعاملی معماری نرم‌افزار</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://unpkg.com/vis-network@9.1.6/standalone/umd/vis-network.min.js"></script>
<style>
:root {{
  --bg: #090d13;
  --panel: #111620;
  --panel2: #171f2c;
  --border: #263142;
  --text: #e6edf3;
  --muted: #8b949e;
  --accent: #d4af37;
  --gold: #f59e0b;
  --green: #3fb950;
  --red: #f85149;
  --blue: #58a6ff;
  --purple: #bc8cff;
}}
* {{ box-sizing: border-box; }}
html, body {{
  margin: 0;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font: 13px/1.5 "Vazirmatn", system-ui, -apple-system, sans-serif;
  overflow: hidden;
}}
#app {{
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 350px;
  grid-template-rows: 58px minmax(0, 1fr);
  grid-template-areas:
    "top top top"
    "side graph info";
  height: 100vh;
  width: 100vw;
}}
header {{
  grid-area: top;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
}}
header h1 {{
  font-size: 16px;
  margin: 0;
  font-weight: 800;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 10px;
}}
header h1 span {{
  color: var(--text);
  font-weight: 500;
  font-size: 13.5px;
}}
header .stats {{
  color: var(--muted);
  font-size: 12px;
  margin-right: auto;
}}
header input#search {{
  flex: 0 1 380px;
  background: var(--panel2);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
}}
header input#search:focus {{
  border-color: var(--accent);
}}
#sidebar {{
  grid-area: side;
  overflow-y: auto;
  background: var(--panel);
  border-left: 1px solid var(--border);
  padding: 16px;
}}
#graph {{
  grid-area: graph;
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}}
#network {{
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}}
#info {{
  grid-area: info;
  overflow-y: auto;
  background: var(--panel);
  border-right: 1px solid var(--border);
  padding: 18px;
}}
.section {{
  margin-bottom: 20px;
}}
.section h3 {{
  margin: 0 0 10px;
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--muted);
  font-weight: 700;
}}
.seg {{
  display: flex;
  flex-direction: column;
  gap: 6px;
}}
.seg button {{
  background: var(--panel2);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  text-align: right;
  transition: all 0.15s;
}}
.seg button.active {{
  background: rgba(212, 175, 55, 0.15);
  border-color: var(--accent);
  color: #fef3c7;
  font-weight: 700;
}}
.chip {{
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 3px;
  padding: 5px 12px;
  border-radius: 20px;
  background: var(--panel2);
  border: 1px solid var(--border);
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
}}
.chip.active {{
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--accent);
  color: #fff;
}}
.chip .n {{
  color: var(--muted);
  font-size: 11px;
}}
.field {{
  margin: 6px 0;
}}
.field b.k {{
  color: var(--muted);
  font-weight: 500;
  margin-left: 6px;
}}
.field .v {{
  word-break: break-all;
}}
a.nlink {{
  color: var(--accent);
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
}}
a.nlink:hover {{
  text-decoration: underline;
}}
#floating {{
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  gap: 8px;
  z-index: 5;
}}
#floating button {{
  background: var(--panel);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 7px 12px;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
}}
#floating button:hover {{
  border-color: var(--accent);
}}
#floating button.active {{
  background: var(--accent);
  border-color: var(--accent);
  color: #021e1d;
  font-weight: 700;
}}
#breadcrumb {{
  position: absolute;
  bottom: 14px;
  right: 16px;
  z-index: 5;
  background: rgba(17, 22, 32, .92);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12.5px;
  color: var(--muted);
}}
#breadcrumb b {{
  color: var(--text);
}}
.tag {{
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  margin-right: 4px;
  vertical-align: 1px;
}}
.tag.layer-frontend {{ background: #0d3a5c; color: #7cc4ff; }}
.tag.layer-api-controller {{ background: #442a1d; color: #fbd38d; }}
.tag.layer-api-service {{ background: #1c3d5a; color: #90cdf4; }}
.tag.layer-domain-logic {{ background: #14401f; color: #63e685; }}
.tag.layer-contracts {{ background: #3b2d54; color: #d6bcfa; }}
.tag.layer-database {{ background: #3d2e00; color: #ffd35c; }}
.tag.layer-test {{ background: #2b2140; color: #c0a0ff; }}
.dep-list {{
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  background: #090d13;
}}
.dep-list div {{
  padding: 5px 0;
  border-bottom: 1px solid #171f2c;
}}
.dep-list div:last-child {{
  border-bottom: none;
}}
</style>
</head>
<body>
<div id="app">
  <header>
    <h1>Brand Commerce <span>· نقشه تعاملی معماری پلتفرم</span></h1>
    <input id="search" type="search" placeholder="جستجو در سرویس‌ها، کنترلرها، قراردادها و صفحات..." autocomplete="off">
    <span class="stats" id="hdr-stats"></span>
  </header>
  <nav id="sidebar">
    <div class="section">
      <h3>سطح دید معماری (Level)</h3>
      <div class="seg" id="level-seg">
        <button data-level="1">۱ · لایه‌های نرم‌افزار (Layers)</button>
        <button data-level="2" class="active">۲ · دامنه‌های تجاری (Business Domains)</button>
        <button data-level="3">۳ · فایل‌های سیستم (Files)</button>
        <button data-level="4">۴ · توابع، کلاس‌ها و مدل‌ها (Symbols)</button>
      </div>
    </div>
    <div class="section">
      <h3>دامنه‌های تجاری پلتفرم</h3>
      <div id="domain-filters"></div>
    </div>
    <div class="section">
      <h3>لایه‌های معماری</h3>
      <div id="layer-filters"></div>
    </div>
    <div class="section">
      <h3>شاخص‌ها و آمار سیستم</h3>
      <pre id="metrics" style="white-space: pre-wrap; color: var(--muted); font-size: 11.5px; font-family: inherit;"></pre>
    </div>
  </nav>
  <main id="graph">
    <div id="network"></div>
    <div id="floating">
      <button id="btn-fit" title="انطباق با صفحه">⤢ Fit</button>
      <button id="btn-reset" title="بازنشانی">↺ Reset</button>
      <button id="btn-deps" title="وابستگی‌های خروجی">→ وابستگی‌ها (Deps)</button>
      <button id="btn-rdeps" title="تحلیل شعاع اثر">← شعاع اثر (Rdeps)</button>
    </div>
    <div id="breadcrumb">سطح جاری: <b id="bc-level">۲</b> · <b id="bc-view">دامنه‌های تجاری (Domains)</b></div>
  </main>
  <aside id="info">
    <div id="info-empty" style="color: var(--muted); text-align: center; padding-top: 40px;">
      روی هر گره کلیک کنید تا جزئیات، ارتباطات، وابستگی‌ها و کدهای مربوط به آن نمایش داده شود.
    </div>
    <div id="info-body"></div>
  </aside>
</div>

<script>
const DATA = {data_json};
const METRICS = {metrics_json};

const LAYER_COLORS = {{
  "frontend": "#58a6ff",
  "api-controller": "#e5a83b",
  "api-service": "#00A9A5",
  "domain-logic": "#3fb950",
  "contracts": "#bc8cff",
  "database": "#d29922",
  "test": "#ff7b72",
  "backend": "#79c0ff",
  "other": "#8b949e"
}};

let network = null;
let allNodes = new Map();
let level = 2;
let sel = null;
let hlDeps = false;
let hlRdeps = false;
const activeLayers = new Set();
const activeDomains = new Set();

function esc(s) {{
  return String(s ?? "").replace(/[&<>"']/g, c => ({{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}}[c]));
}}

DATA.nodes.forEach(n => allNodes.set(n.id, n));

function passesFilters(n) {{
  if (activeLayers.size > 0 && !activeLayers.has(n.layer)) return false;
  if (activeDomains.size > 0 && !activeDomains.has(n.domain)) return false;
  return true;
}}

function aggregate(lvl) {{
  const gidOf = lvl === 1 ? (n => n.layer || "other")
              : lvl === 2 ? (n => n.domain || "Core")
              : lvl === 3 ? (n => n.source_file)
              : (n => n.id);

  const g = new Map();
  DATA.nodes.forEach(n => {{
    if (!passesFilters(n)) return;
    if (lvl === 3 && n.is_symbol) return;
    const gid = gidOf(n);
    if (!g.has(gid)) g.set(gid, {{ members: [], sample: n }});
    g.get(gid).members.push(n.id);
  }});

  const nodes = [];
  const indexOf = new Map();
  for (const [gid, info] of g) {{
    indexOf.set(gid, nodes.length);
    const s = info.sample;
    let lbl = gid;
    if (lvl === 1) lbl = "لایه: " + gid;
    else if (lvl === 3) lbl = s.source_file.split("/").pop();
    else if (lvl === 4) lbl = s.label;

    nodes.push({{
      id: gid,
      label: lbl,
      value: info.members.length,
      layer: s.layer,
      domain: s.domain,
      color: LAYER_COLORS[s.layer] || "#8b949e",
      shape: lvl <= 2 ? "box" : "dot",
      font: {{ face: "Vazirmatn", color: "#ffffff", size: lvl <= 2 ? 14 : 12 }},
      margin: 10,
      borderWidth: 2,
      members: info.members
    }});
  }}

  // Aggregate edges
  const edgeCount = new Map();
  DATA.edges.forEach(e => {{
    const sn = allNodes.get(e.from);
    const tn = allNodes.get(e.to);
    if (!sn || !tn || !passesFilters(sn) || !passesFilters(tn)) return;
    const sg = gidOf(sn);
    const tg = gidOf(tn);
    if (sg === tg) return;
    if (!indexOf.has(sg) || !indexOf.has(tg)) return;
    const k = sg + "|||" + tg;
    edgeCount.set(k, (edgeCount.get(k) || 0) + 1);
  }});

  const edges = [];
  for (const [k, count] of edgeCount) {{
    const [from, to] = k.split("|||");
    edges.push({{
      from,
      to,
      width: Math.min(6, 1 + Math.log2(count + 1)),
      arrows: "to",
      color: {{ color: "rgba(255,255,255,0.22)", highlight: "#f59e0b" }}
    }});
  }}

  return {{ nodes, edges }};
}}

function render() {{
  const container = document.getElementById("network");
  const {{ nodes, edges }} = aggregate(level);

  const visNodes = new vis.DataSet(nodes);
  const visEdges = new vis.DataSet(edges);

  const options = {{
    nodes: {{
      borderWidthSelected: 3,
      shadow: true
    }},
    edges: {{
      smooth: {{ type: "continuous", roundness: 0.2 }}
    }},
    physics: {{
      solver: level <= 2 ? "forceAtlas2Based" : "barnesHut",
      forceAtlas2Based: {{
        gravitationalConstant: -70,
        centralGravity: 0.015,
        springLength: 140,
        springConstant: 0.08
      }},
      stabilization: {{ iterations: 120 }}
    }},
    interaction: {{
      hover: true,
      tooltipDelay: 100
    }}
  }};

  if (network) network.destroy();
  network = new vis.Network(container, {{ nodes: visNodes, edges: visEdges }}, options);

  network.on("click", params => {{
    if (params.nodes.length > 0) {{
      showInfo(params.nodes[0]);
    }} else {{
      clearInfo();
    }}
  }});

  document.getElementById("hdr-stats").textContent = `${{nodes.length}} گره · ${{edges.length}} ارتباط در سطح جاری`;
}}

function showInfo(nodeId) {{
  const infoEmpty = document.getElementById("info-empty");
  const infoBody = document.getElementById("info-body");
  infoEmpty.style.display = "none";
  infoBody.innerHTML = "";

  const node = allNodes.get(nodeId);
  if (!node) {{
    // Group node
    infoBody.innerHTML = `
      <h2>${{esc(nodeId)}}</h2>
      <div class="field"><b class="k">نوع گره:</b> <span class="v">خوشه انتزاعی</span></div>
      <div class="field"><b class="k">سطح:</b> <span class="v">${{level}}</span></div>
    `;
    return;
  }}

  let html = `
    <h2 style="margin: 0 0 10px; font-size: 16px; color: var(--accent);">${{esc(node.label)}}</h2>
    <div style="margin-bottom: 12px;">
      <span class="tag layer-${{esc(node.layer)}}">${{esc(node.layer)}}</span>
      <span class="tag" style="background:#263142;color:#f0f6fc">${{esc(node.kind)}}</span>
    </div>
    <div class="field"><b class="k">فایل منبع:</b> <span class="v" dir="ltr">${{esc(node.source_file)}}</span></div>
    <div class="field"><b class="k">دامنه تجاری:</b> <span class="v">${{esc(node.domain)}}</span></div>
    <div class="field"><b class="k">زبان:</b> <span class="v">${{esc(node.language)}}</span></div>

    <h3 style="margin-top: 20px; font-size: 13px; color: var(--muted);">وابستگی‌های مستقیم (Deps: ${{node.deps.length}}):</h3>
    <div class="dep-list">
      ${{node.deps.length === 0 ? '<div style="color:var(--muted)">بدون وابستگی خروجی</div>' :
        node.deps.map(d => `<div><a class="nlink" onclick="focusNode('${{esc(d)}}')">${{esc(d)}}</a></div>`).join("")}}
    </div>

    <h3 style="margin-top: 20px; font-size: 13px; color: var(--muted);">شعاع اثر / وابسته به این گره (Rdeps: ${{node.rdeps.length}}):</h3>
    <div class="dep-list">
      ${{node.rdeps.length === 0 ? '<div style="color:var(--muted)">هیچ گره‌ای به این ماژول وابسته نیست</div>' :
        node.rdeps.map(r => `<div><a class="nlink" onclick="focusNode('${{esc(r)}}')">${{esc(r)}}</a></div>`).join("")}}
    </div>
  `;

  infoBody.innerHTML = html;
}}

function clearInfo() {{
  document.getElementById("info-empty").style.display = "block";
  document.getElementById("info-body").innerHTML = "";
}}

window.focusNode = function(id) {{
  if (level < 3) {{
    setLevel(3);
  }}
  setTimeout(() => {{
    if (network) {{
      network.selectNodes([id]);
      network.focus(id, {{ scale: 1.2, animation: true }});
      showInfo(id);
    }}
  }}, 200);
}};

function setLevel(l) {{
  level = l;
  document.querySelectorAll("#level-seg button").forEach(b => {{
    b.classList.toggle("active", parseInt(b.dataset.level) === l);
  }});
  document.getElementById("bc-level").textContent = l;
  document.getElementById("bc-view").textContent = 
    l === 1 ? "لایه‌های نرم‌افزار (Layers)" :
    l === 2 ? "دامنه‌های تجاری (Domains)" :
    l === 3 ? "فایل‌های سیستم (Files)" : "توابع و کلاس‌ها (Symbols)";
  render();
}}

// Initialize Filters & Metrics
document.getElementById("metrics").textContent = JSON.stringify(METRICS, null, 2);

const domainFiltersDiv = document.getElementById("domain-filters");
Object.entries(DATA.domains).forEach(([d, count]) => {{
  const chip = document.createElement("div");
  chip.className = "chip";
  chip.innerHTML = `${{esc(d)}} <span class="n">${{count}}</span>`;
  chip.onclick = () => {{
    if (activeDomains.has(d)) activeDomains.delete(d);
    else activeDomains.add(d);
    chip.classList.toggle("active");
    render();
  }};
  domainFiltersDiv.appendChild(chip);
}});

const layerFiltersDiv = document.getElementById("layer-filters");
Object.entries(DATA.layers).forEach(([l, count]) => {{
  const chip = document.createElement("div");
  chip.className = "chip";
  chip.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${{LAYER_COLORS[l]||'#8b949e'}};margin-left:5px"></span>${{esc(l)}} <span class="n">${{count}}</span>`;
  chip.onclick = () => {{
    if (activeLayers.has(l)) activeLayers.delete(l);
    else activeLayers.add(l);
    chip.classList.toggle("active");
    render();
  }};
  layerFiltersDiv.appendChild(chip);
}});

// Level buttons
document.querySelectorAll("#level-seg button").forEach(b => {{
  b.onclick = () => setLevel(parseInt(b.dataset.level));
}});

// Floating buttons
document.getElementById("btn-fit").onclick = () => network && network.fit({{ animation: true }});
document.getElementById("btn-reset").onclick = () => {{
  activeLayers.clear();
  activeDomains.clear();
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  setLevel(2);
}};

// Search
document.getElementById("search").oninput = (e) => {{
  const q = e.target.value.trim().toLowerCase();
  if (!q) return;
  const match = DATA.nodes.find(n => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q));
  if (match) focusNode(match.id);
}};

render();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
