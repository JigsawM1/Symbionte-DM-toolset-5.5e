# Bolt's Journal

## System Profile & Codebase Learnings

## 2025-05-20 - Pre-computing spell matchers in trait option filters
**Learning:** `opcionesElegiblesConjuros` filters candidate spell options for character trait selectors. Evaluating filters like `excluirPreparados` previously created temporary array concatenations (`[...pj.conjurosPreparadosIds, ...]`) inside the `.filter()` callback for every candidate spell (up to hundreds of items).
**Action:** Precompute matcher functions outside the option loop once per selector evaluation to avoid redundant garbage collection overhead and repeated scans.

## 2025-05-21 - Fast-pathing single-string search targets and eliminating Array.from in Set loops
**Learning:** `coincideBusquedaTolerante` is called across all compendiums and list search inputs. It previously wrapped single-string targets in array allocations, sorted target lists unnecessarily, and called `Array.from(tokensPendientes)` inside the outer loop for every target item, creating heavy GC pressure during keystroke filtering.
**Action:** Provide a fast-path for single-string targets that skips array/Set instantiations, pre-build token variant metadata once outside target loops, and iterate directly over `Set` without `Array.from`.
