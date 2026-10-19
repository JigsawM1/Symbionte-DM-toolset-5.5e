# Bolt's Journal

## System Profile & Codebase Learnings

## 2025-05-20 - Pre-computing spell matchers in trait option filters
**Learning:** `opcionesElegiblesConjuros` filters candidate spell options for character trait selectors. Evaluating filters like `excluirPreparados` previously created temporary array concatenations (`[...pj.conjurosPreparadosIds, ...]`) inside the `.filter()` callback for every candidate spell (up to hundreds of items).
**Action:** Precompute matcher functions outside the option loop once per selector evaluation to avoid redundant garbage collection overhead and repeated scans.

## 2025-05-21 - Pre-expanding spell lookup variants into O(1) Sets
**Learning:** `crearMatcherHechizos` was performing linear list scans ($O(M)$) and running string lowercasing, diacritic normalization (`.normalize("NFD")`), regex replacements, slug generation, and alias lookups on every single target item check.
**Action:** Pre-expand all list items, normalized strings, slugs, diacritics, and aliases into a single pre-computed `Set<string>` once upon matcher creation to convert spell checks into $O(1)$ set lookups.
