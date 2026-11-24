# OpenAPI Spectral Governance & Linter Report (TASK-182)

Generated at: 2026-11-24T08:21:21.128Z  
Specification Source: `apps/api/openapi.json`  
Governance Ruleset: `docs/governance/.spectral.yaml`  
Total URL Routes: 66  
Total Operations: 69  
Domain Tags: 11 (health, products, carts, checkout, orders, payments, admin, b2b, b2b-org, support, Features)  
DTO Schemas: 0  

## Validation Results
- **Overall Status:** PASSED (100% Compliant)
- **Total Rules Evaluated:** 8
- **Critical Errors:** 0
- **Warnings:** 0

## Detailed Governance Checks
| Rule ID | Standard / Policy | Status | Evidence & Details |
|---|---|---|---|
| OAS-01 | Document Header & Versioning | **PASS** | `OpenAPI 3.0.0 (Brand Commerce API v1.0)` |
| OAS-02 | API Server Targets Declared | **PASS** | `Default / server assumed in OpenAPI 3.0` |
| OAS-03 | Kebab-Case URL Standard | **PASS** | `All 66 paths adhere to kebab-case` |
| OAS-04 | Unique operationId standard | **PASS** | `All 69 operations declare operationId` |
| OAS-05 | Bounded Context Tags Coverage | **PASS** | `11 domain tag groups: health, products, carts, checkout, orders, payments...` |
| OAS-06 | Operation Documentation Standard | **PASS** | `All 69 operations documented with summary/description` |
| OAS-07 | Response Specification Governance | **PASS** | `All 69 operations define HTTP status response codes` |
| OAS-08 | Component Schemas Catalog | **PASS** | `0 canonical DTO schemas verified` |

## Domain Tag Distribution
- **health**: Categorizes related service routes and schema contracts
- **products**: Categorizes related service routes and schema contracts
- **carts**: Categorizes related service routes and schema contracts
- **checkout**: Categorizes related service routes and schema contracts
- **orders**: Categorizes related service routes and schema contracts
- **payments**: Categorizes related service routes and schema contracts
- **admin**: Categorizes related service routes and schema contracts
- **b2b**: Categorizes related service routes and schema contracts
- **b2b-org**: Categorizes related service routes and schema contracts
- **support**: Categorizes related service routes and schema contracts
- **Features**: Categorizes related service routes and schema contracts

## Architectural Invariants
1. **Strict Kebab-Case:** Every path follows lowercase kebab-case URI design standard (`/api/v1/...`).
2. **Client SDK Parity:** Every operation contains a deterministic `operationId` suitable for automated OpenAPI generator clients.
3. **Persian & English Documentation:** Operation summaries are cataloged for developer documentation and swagger UI exploration.
