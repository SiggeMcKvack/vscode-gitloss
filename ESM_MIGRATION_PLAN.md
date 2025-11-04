# CommonJS to ESM Migration Plan for GitLens

## Executive Summary

**Repository**: vscode-gitlens (GitLens VS Code Extension)
**Current State**: TypeScript source code using ESM syntax, compiled to CommonJS output
**Target State**: Native ESM extension for improved tree-shaking and modern JavaScript support
**Complexity**: Moderate - Source code is ESM-ready, but build configuration requires updates
**Risk Level**: Medium - VS Code ESM support is new (April 2025, v1.100+) and limited to Node.js extension host

---

## Current Architecture Analysis

### ✅ What's Already ESM-Ready

1. **Source Code**: All 361 TypeScript files use ESM syntax (`import`/`export`)
   - 4,055+ ESM import/export statements
   - Only 54 CommonJS patterns found (mostly in config files)
   - No `require()` statements in source TypeScript files

2. **TypeScript Configuration**:
   - `tsconfig.base.json` already uses `"module": "esnext"`
   - Target: ES2020 with modern JavaScript features
   - Proper module resolution configured

3. **Dependencies**: 11 of 12 production dependencies support ESM
   - ✅ @octokit/core, @vscode/codicons, @vscode/webview-ui-toolkit
   - ✅ lodash-es (ESM-only variant), node-fetch, ansi-regex
   - ✅ billboard.js, chroma-js, md5.js, path-browserify, sortablejs, uuid
   - ⚠️ **iconv-lite**: CommonJS-only (used in 2 files for character encoding)

### ❌ What Needs Migration

1. **Build Output Configuration**:
   - `webpack.config.js:114` - `libraryTarget: 'commonjs2'`
   - `webpack.config.test.js:90` - `libraryTarget: 'commonjs2'`
   - `esbuild.js:57` - `format: 'cjs'`

2. **Test Configuration**:
   - `tsconfig.test.json:4` - `"module": "commonjs"`
   - Test output directory: `out/` (CommonJS format)

3. **Package.json**:
   - Missing `"type": "module"` declaration
   - Entry points reference `.js` without module type specification

4. **Configuration Files**:
   - `webpack.config.js`, `esbuild.js` use CommonJS (expected, can remain)

---

## VS Code ESM Support Status

### ✅ Supported (as of VS Code 1.100, April 2025)

- **Node.js Extension Host**: Full ESM support
- **Requirement**: Add `"type": "module"` to package.json OR use `.mjs` extension
- **Sample Extension**: https://github.com/jrieken/vscode-esm-sample-extension
- **Benefits**: Native ESM, better tree-shaking, faster startup

### ❌ Not Yet Supported

- **Web Worker Extension Host**: ESM support blocked by technical challenges
- **Impact**: This extension has dual targets (`node` and `webworker`)
- **Tracking Issue**: https://github.com/microsoft/vscode/issues/130367

---

## Critical Decision Point: Dual Target Strategy

GitLens builds for **both** Node.js and Web Worker targets:
- `getExtensionConfig('node', mode, env)` - Main desktop extension
- `getExtensionConfig('webworker', mode, env)` - Browser/web version

### ⚠️ BLOCKER: Web Worker Target

**The web worker build CANNOT be migrated to ESM yet** because VS Code doesn't support ESM in the web worker extension host.

### Recommended Approach: Hybrid Strategy

Keep CommonJS for now due to web worker limitation, BUT prepare for future migration:

**Option A: Wait for Full ESM Support (RECOMMENDED)**
- ✅ Zero risk - current system works
- ✅ Maintains web worker compatibility
- ✅ Simple rollback if issues arise
- ❌ Miss out on ESM benefits (tree-shaking, faster load)
- ⏳ Wait for VS Code web worker ESM support

**Option B: Node-Only ESM Migration (COMPLEX)**
- ✅ Get ESM benefits for desktop users
- ❌ Requires maintaining two build systems (ESM + CJS)
- ❌ Significant complexity managing dual outputs
- ❌ Risk of divergence between builds
- ❌ Testing overhead for both formats

**Option C: Drop Web Worker Support (NOT RECOMMENDED)**
- ✅ Full ESM migration possible
- ❌ Lose VS Code web/browser support entirely
- ❌ Major feature regression

---

## Migration Steps (If Proceeding with Option B)

### Phase 1: Preparation (No Breaking Changes)

1. **Update Package.json**
   ```json
   {
     "type": "module",
     "engines": {
       "vscode": "^1.100.0"  // Require ESM-capable VS Code
     },
     "main": "./dist/gitlens.js",
     "browser": "./dist/browser/gitlens.js"
   }
   ```
   Note: `browser` build would remain CommonJS

2. **Handle iconv-lite Dependency**
   - Option A: Replace with native Node.js `TextDecoder`/`TextEncoder`
     ```typescript
     // Old: import { decode } from 'iconv-lite';
     // New: const decoder = new TextDecoder('windows-1252');
     ```
   - Option B: Use dynamic `import()` with CommonJS compatibility
   - Files affected:
     - `src/git/gitProviderService.ts:1` (encodingExists check)
     - `src/env/node/git/shell.ts:4` (decode function)

3. **Create Separate Build Configurations**
   ```
   webpack.config.esm.js     - Node ESM build
   webpack.config.cjs.js     - Web worker CJS build
   esbuild.esm.js           - Node ESM alternative
   esbuild.cjs.js           - Web worker CJS alternative
   ```

### Phase 2: Build System Updates

4. **Update Webpack for Node Target (ESM)**
   ```javascript
   // webpack.config.esm.js
   output: {
     path: path.join(__dirname, 'dist'),
     filename: 'gitlens.js',
     library: { type: 'module' },  // ESM output
     module: true,
     chunkFormat: 'module',
   },
   experiments: {
     outputModule: true,  // Enable ESM output
   },
   ```

5. **Update esbuild for Node Target (ESM)**
   ```javascript
   // esbuild.esm.js
   format: 'esm',  // Change from 'cjs'
   ```

6. **Keep Web Worker Build as CommonJS**
   - No changes to `libraryTarget: 'commonjs2'` for webworker target
   - Maintain existing configuration

### Phase 3: Test Migration

7. **Update Test Configuration**
   ```json
   // tsconfig.test.json
   {
     "compilerOptions": {
       "module": "esnext"  // Change from "commonjs"
     }
   }
   ```

8. **Update Test Runner**
   - Mocha supports ESM with `--loader` flag or `.mjs` extensions
   - May need to update `src/test/suite/index.ts` for ESM compatibility
   - Update glob pattern to look for `.test.js` or `.test.mjs`

9. **Update Test Build Script**
   ```json
   // package.json
   {
     "scripts": {
       "build:tests": "tsc -p tsconfig.test.json && tsc-alias -p tsconfig.test.json",
       "test": "node --loader ./test-loader.js ./out/test/runTest.js"
     }
   }
   ```

### Phase 4: Validation

10. **Verify Extension Loading**
    - Test with VS Code 1.100+
    - Verify both ESM (node) and CJS (webworker) builds work
    - Check that bundle size decreased (ESM tree-shaking benefit)

11. **Run Full Test Suite**
    - Both unit tests and integration tests
    - Test on multiple platforms (Windows, macOS, Linux)
    - Test web worker build separately

12. **Performance Testing**
    - Measure extension activation time
    - Compare bundle sizes (should decrease with ESM)
    - Verify memory usage unchanged

---

## Testing Strategy

### ✅ Current Tests Are Sufficient

The existing test suite covers:
- **Unit Tests**: 2 test files found
  - `src/test/suite/system/path.test.ts` - Path utility tests
  - `src/test/suite/system/trie.test.ts` - Data structure tests
- **Integration Tests**: Via `@vscode/test-electron`

### 📋 Additional Tests Recommended

Since this is a **build configuration change** (not functional changes), existing tests should catch issues IF:

1. **Add Module Loading Tests**
   ```typescript
   // src/test/suite/module.test.ts
   describe('ESM Module Loading', () => {
     it('should load extension as ESM', async () => {
       const ext = await import('../../extension.js');
       assert.ok(ext.activate);
     });
   });
   ```

2. **Add Dependency Import Tests**
   ```typescript
   it('should import iconv-lite alternative', () => {
     // Verify character encoding works with new approach
   });
   ```

3. **Bundle Verification**
   - Add CI check for bundle size (should decrease)
   - Verify no CommonJS requires in ESM bundle
   - Check for proper tree-shaking

### Manual Testing Checklist

After migration:
- [ ] Extension activates in VS Code 1.100+
- [ ] Git operations work correctly
- [ ] Webviews load and function
- [ ] All commands execute without errors
- [ ] Character encoding works (iconv-lite replacement)
- [ ] Remote Git providers function (GitHub, GitLab, etc.)
- [ ] Web worker build still works (CommonJS)
- [ ] Extension size decreased (ESM tree-shaking)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Web worker build breaks | High | Critical | Keep separate CJS build |
| iconv-lite replacement fails | Medium | High | Thorough encoding tests |
| VS Code compatibility issues | Low | Critical | Require VS Code 1.100+ |
| Dependency ESM issues | Low | Medium | All deps support ESM |
| Test suite breaks | Medium | Medium | Update test runner config |
| Bundle size increases | Low | Low | Webpack tree-shaking |

---

## Effort Estimate

| Task | Time Estimate | Complexity |
|------|--------------|------------|
| Update build configs | 2-4 hours | Medium |
| Replace iconv-lite | 1-2 hours | Low |
| Update test configuration | 2-3 hours | Medium |
| Testing & validation | 4-8 hours | High |
| Documentation updates | 1-2 hours | Low |
| **Total** | **10-19 hours** | **Medium** |

---

## Recommendation

### 🚨 DO NOT MIGRATE YET

**Reasoning:**
1. **Web Worker Support**: GitLens needs web worker support for VS Code web/browser
2. **Complexity vs. Benefit**: Maintaining dual builds (ESM + CJS) adds significant complexity
3. **New Feature Risk**: ESM support is only ~6 months old (April 2025 release)
4. **No Critical Need**: Current CommonJS build works perfectly

**Wait for:**
- VS Code to add web worker ESM support (track issue #130367)
- ESM ecosystem to mature (6-12 more months)
- Community feedback on ESM extensions

### 🎯 Alternative: Prepare for Future Migration

Take these **zero-risk** preparation steps now:

1. **Audit Dependencies**: Ensure all deps support ESM (already done ✅)
2. **Document**: Keep this migration plan updated
3. **Monitor**: Watch VS Code issue #130367 for web worker ESM support
4. **Test**: Run the extension with `"type": "module"` in a branch to identify issues early

### When to Migrate

Migrate when **ALL** of these conditions are met:
- ✅ VS Code supports ESM in web worker extension host
- ✅ ESM extensions are widely adopted (20%+ of popular extensions)
- ✅ No major issues reported in VS Code ESM support
- ✅ Development team capacity for 2-3 week migration effort

---

## Alternative Consideration: Partial ESM Adoption

**What if you DON'T care about web worker support?**

If dropping browser/web support is acceptable:
1. Remove web worker build entirely
2. Full ESM migration becomes straightforward
3. Focus only on desktop VS Code
4. Migration drops to ~8-12 hours effort

**Trade-off**: Lose VS Code web (github.dev, vscode.dev) support

---

## Appendix: File Changes Required

### Minimal Changes (If Migrating)

```
Modified (10 files):
  package.json                    - Add "type": "module", update engines
  webpack.config.js               - Change libraryTarget for node build
  esbuild.js                      - Change format: 'cjs' to 'esm'
  tsconfig.test.json              - Change module to "esnext"
  src/git/gitProviderService.ts   - Replace iconv-lite import
  src/env/node/git/shell.ts       - Replace iconv-lite import
  src/test/suite/index.ts         - Update for ESM test loading
  .github/workflows/*.yml         - Update CI for dual builds (if needed)
  README.md                       - Document VS Code version requirement
  CHANGELOG.md                    - Document ESM migration

Optional:
  webpack.config.test.js          - Update test build config
  .vscode/launch.json             - Update debug configurations
```

### No Changes Required

- All TypeScript source files (already use ESM syntax)
- Most build tooling (can process ESM input)
- VS Code extension manifest (activationEvents, etc.)

---

## Questions for Decision Making

Before proceeding, answer these:

1. **Is web worker/browser support required?** (If yes, MUST wait for VS Code support)
2. **What VS Code version is minimum?** (ESM needs 1.100+, released April 2025)
3. **Can the team dedicate 2-3 weeks for this?** (Development + testing + rollback planning)
4. **What's the primary motivation?** (Performance? Modern JS? Bundle size? Developer experience?)
5. **Is there user demand for this?** (Does this improve user experience?)

---

## Conclusion

**Recommendation: WAIT for VS Code web worker ESM support before migrating.**

The GitLens codebase is already written in ESM-style TypeScript, making future migration straightforward. The main blocker is VS Code's lack of ESM support in the web worker extension host, which GitLens requires for browser/web compatibility.

**The cost/benefit ratio currently favors waiting:**
- Cost: 10-19 hours + dual build maintenance + testing complexity
- Benefit: Potential bundle size reduction + modern tooling
- Risk: New feature (6 months old) + web worker support loss

**When VS Code adds web worker ESM support, revisit this plan.** The migration will be much simpler (single build target) and less risky.

Until then, the current CommonJS output from ESM source is the right approach for this extension.
