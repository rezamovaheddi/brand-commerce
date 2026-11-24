---
name: license-supply-chain-audit
description: Assess dependency provenance, licenses, vulnerable packages, secrets exposure, SBOM and supply-chain controls before commercial reuse or production release.
---

# License and Supply Chain Audit

- Inspect lockfiles and full transitive dependency graph.
- Generate SBOM with a pinned, approved tool; preserve exact tool version and command.
- Classify package and asset licenses separately; a repository license does not automatically license embedded assets or plugins.
- Flag GPL/AGPL/OSL/MSCL/source-available/commercial carve-outs for counsel review; do not make legal conclusions.
- Review package lifecycle, release activity, maintainer signals, provenance, install scripts and integrity.
- Run secret scanning without copying matched values into reports; rotate confirmed leaked credentials.
- Record CVE/CVSS, exploitability, reachability, fixed version and exception owner.
- Produce a license bill of materials, SBOM, vulnerability report and approved/blocked dependency list.
