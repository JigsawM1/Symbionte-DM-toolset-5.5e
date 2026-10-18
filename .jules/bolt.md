# Bolt's Journal

## System Profile & Codebase Learnings

## 2025-05-20 - Pre-computing spell matchers in trait option filters
**Learning:** `opcionesElegiblesConjuros` filters candidate spell options for character trait selectors. Evaluating filters like `excluirPreparados` previously created temporary array concatenations (`[...pj.conjurosPreparadosIds, ...]`) inside the `.filter()` callback for every candidate spell (up to hundreds of items).
**Action:** Precompute matcher functions outside the option loop once per selector evaluation to avoid redundant garbage collection overhead and repeated scans.

## 2025-05-21 - Caching spell lookup keys in WeakMap & avoiding redundant trait re-syncs
**Learning:** `crearClavesLookupHechizos` is invoked frequently across character hooks to map spells to slugs, aliases, and normalized forms. Generating these arrays for catalog spells required thousands of NFD normalizations and regex string replacements on every call. Furthermore, `usarCalculoAtaquesJugador` was re-executing `sincronizarRasgosAutomaticos` inside `useMemo` before `resolverRasgosAcciones`, despite `resolverRasgosAcciones` already falling back to synchronization when needed.
**Action:** Use a `WeakMap<HechizoBase, string[]>` in `crearClavesLookupHechizos` to cache lookup variant keys per spell instance (~29x speedup, 2,213 ms -> 75 ms for 1k calls), and pass `personajeActivo` directly to `resolverRasgosAcciones` without forcing redundant trait re-synchronization.
