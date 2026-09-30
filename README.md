# SSP Skeleton Generator

A free tool for drafting your **System Security Plan** against NIST SP 800-171 Rev. 2. Without an SSP, no assessment can be completed. This gives you the full skeleton: all 110 requirements, prompts for what assessors look for, and a clean export.

**Live tool:** https://nehemiah313.github.io/ssp-skeleton/

## What it does

- **Imports your statuses** from the [SPRS Score Calculator](https://github.com/nehemiah313/sprs-score-calculator) (same browser): Implemented, Planned, Partially implemented, Not Applicable
- Walks you through all **110 requirements across 14 families**, each with:
  - The requirement text
  - Status selector (Implemented / Planned / Partially implemented / Inherited / Not Applicable)
  - Narrative prompt tailored to the status (assessors want specifics: tools, configs, procedures)
  - Required justification when you mark something Not Applicable
  - Responsible role and evidence reference fields
- **Progress tracker**: X of 110 documented, with a filter for what's left
- Exports a **complete SSP draft in Markdown** (title block, system description, boundary, CUI categories, all 110 implementation statements, POA&M appendix) plus a **tracking CSV**
- Everything stays in your browser (localStorage only, nothing uploaded)

## Honest framing

This skeleton organizes your answers; the accuracy of each statement is yours. Review every narrative before you attest. A POA&M does not change your SPRS score.

## The dataset

Runs on the same machine-readable NIST SP 800-171 dataset as the calculator:

- [`data/nist-800-171-controls.json`](data/nist-800-171-controls.json)
- [`data/nist-800-171-controls.csv`](data/nist-800-171-controls.csv)

Requirement text: NIST SP 800-171 Rev. 2 (public domain). Free to reuse under MIT.

## Built by

**Neo Harvard**, CEO of [AI Tech Pros](https://aitechpros.ai) — SPRS and CMMC readiness for defense contractors. Part of the [MAPS framework](https://github.com/nehemiah313/maps-framework) family: Map, Assess, Prioritize, Sustain.
