/* global module */
/**
 * Dependency-Cruiser Configuration for Brand Commerce Platform (TASK-180)
 * Enforces strict modular monolith import directions, layer isolation, and pure domain purity.
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular-dependencies",
      severity: "error",
      comment: "Circular imports between modules or packages are strictly prohibited.",
      from: {},
      to: { circular: true },
    },
    {
      name: "domain-does-not-import-apps",
      severity: "error",
      comment: "Pure domain package (@bc/domain) must never import from application layers.",
      from: { path: "^packages/domain" },
      to: { path: "^apps/" },
    },
    {
      name: "domain-does-not-import-database",
      severity: "error",
      comment: "Domain logic must remain pure and free from persistence/ORM concerns.",
      from: { path: "^packages/domain" },
      to: { path: "^packages/database|@prisma/client" },
    },
    {
      name: "contracts-does-not-import-apps-or-domain",
      severity: "error",
      comment: "Wire contracts (@bc/contracts) define types and must not depend on apps or domain logic.",
      from: { path: "^packages/contracts" },
      to: { path: "^apps/|^packages/domain" },
    },
    {
      name: "no-app-to-app-imports",
      severity: "error",
      comment: "apps/api and apps/storefront must remain completely isolated.",
      from: { path: "^apps/storefront" },
      to: { path: "^apps/api" },
    },
    {
      name: "storefront-does-not-import-database",
      severity: "error",
      comment: "Storefront connects via REST API, never directly to database layer.",
      from: { path: "^apps/storefront" },
      to: { path: "^packages/database|@prisma/client" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(dist|build|coverage|\\.next)(/|$)" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
    },
  },
};
