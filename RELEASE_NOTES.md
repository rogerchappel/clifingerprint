# Release candidate

### Highlights

- Fixes: Update package.json for pure ESM JS, remove TypeScript deps.
- Maintenance: Add smoke script to package.json for releasebox compliance.
- Features: Export public API from src/index.js.
- Features: Serializer - JSON I/O and diff report formatting.
- Features: Comparer - diff two fingerprints for changes.

### Changes

- Features: Export public API from src/index.js. (9fed77c)
- Features: Serializer - JSON I/O and diff report formatting. (996c034)
- Features: Comparer - diff two fingerprints for changes. (95d9ae9)
- Features: Builder - assemble fingerprints from probe configs. (0e68a9b)
- Features: Executor - spawn processes, capture stdout/stderr/exit code. (25f24e0)
- Features: Config loader with YAML/JSON support. (ca0d7a0)
- Fixes: Update package.json for pure ESM JS, remove TypeScript deps. (287989d)
- Maintenance: Add smoke script to package.json for releasebox compliance. (267a464)
- Maintenance: Fix build/smoke scripts and tsconfig for JS-only sources. (e4e8e20)
- Maintenance: Run prettier formatting across all JS files. (3854570)
- Tests: Fix YAML config loader path. (e10780e)
- Maintenance: Fix lint warnings, update test to pass. (392e683)
- Maintenance: Add ESLint flat config with prettier integration. (5d755e1)
- Maintenance: Add prettier config. (dc53d31)
- Maintenance: Remove TypeScript sources, update tests for JS paths. (bb39482)
- Maintenance: Convert types to minimal JS module. (438a1fd)
- Maintenance: Restore proper package.json with TypeScript build config. (0eeccb3)
- Maintenance: Add dist/ build output and cleanup stale scaffold files. (e4d3ceb)
- Tests: Add unit tests — fixtures loaded from fixtures/. (fc341d4)
- Maintenance: Fix package.json back to dist-based build config. (4743d41)

### Contributors

- Roger Chappel

