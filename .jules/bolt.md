# Bolt's Journal

## System Profile & Codebase Learnings

## 2025-05-20 - Pre-computing spell matchers in trait option filters
**Learning:** `opcionesElegiblesConjuros` filters candidate spell options for character trait selectors. Evaluating filters like `excluirPreparados` previously created temporary array concatenations (`[...pj.conjurosPreparadosIds, ...]`) inside the `.filter()` callback for every candidate spell (up to hundreds of items).
**Action:** Precompute matcher functions outside the option loop once per selector evaluation to avoid redundant garbage collection overhead and repeated scans.

## 2025-05-21 - Pre-indexing spell representations and bidirectionally mapping aliases for Set lookups
**Learning:** `crearMatcherHechizos` and `deduplicarListaIds` are called frequently across spell synchronization and sheet calculation pipelines. Repeatedly performing string normalizations, regex strip operations, and alias list iterations per spell comparison created significant CPU and GC pressure. Pre-indexing direct/reverse aliases into module-level maps and pre-populating item representations into a Set transforms lookup time complexity from O(N) string processing to O(1) set operations.
**Action:** When creating high-frequency matcher closures or deduplication routines for string IDs with multiple equivalence representations (accents, prefixes, synonyms), pre-populate all valid representations into a Set upon creation instead of dynamically processing and searching arrays per check.
