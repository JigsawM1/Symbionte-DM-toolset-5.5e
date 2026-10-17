# Bolt's Journal

## System Profile & Codebase Learnings

## 2025-05-20 - Pre-computing spell matchers in trait option filters
**Learning:** `opcionesElegiblesConjuros` filters candidate spell options for character trait selectors. Evaluating filters like `excluirPreparados` previously created temporary array concatenations (`[...pj.conjurosPreparadosIds, ...]`) inside the `.filter()` callback for every candidate spell (up to hundreds of items).
**Action:** Precompute matcher functions outside the option loop once per selector evaluation to avoid redundant garbage collection overhead and repeated scans.
