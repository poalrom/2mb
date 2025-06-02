# ADR-002: Build-Time MDC Integration Plugin

## Status
**Accepted** - 2024

## Context
The memory-bank framework documentation site needs to integrate all existing `.mdc` files from `.cursor/rules/` as documentation pages within the Docusaurus site. The integration must create a dedicated rules section with proper navigation and internal linking while maintaining the original `.mdc` files as the single source of truth (no content duplication).

## Problem
Users need access to framework rules through a well-structured documentation interface, but the rules currently exist only as `.mdc` files in `.cursor/rules/` and are not accessible through the documentation website. The challenge is to integrate these files while:
- Preserving the exact folder structure in documentation URLs
- Converting cross-references to internal documentation links
- Processing and displaying metadata as organized tables
- Maintaining `.cursor/rules/` files as the single source of truth

## Decision
Implement **Solution A: Build-Time Processing with Custom Plugin**

We will create a custom Docusaurus plugin that processes `.mdc` files during build time, generating corresponding `.mdx` files in the docs directory that reference and transform the original content from `.cursor/rules/`.

### Architecture Components:
1. **Custom Docusaurus Plugin** (`docusaurus-plugin-mdc-rules`)
   - Processes all `.mdc` files from `.cursor/rules/` during build
   - Generates corresponding `.mdx` files in `docs/rules/` structure
   - Handles cross-reference resolution to internal links
   - Extracts and formats metadata as tables

2. **Content Transformation Pipeline**
   - MDC file reading and parsing
   - Cross-reference link conversion (e.g., `./modes/plan.mdc` → `/docs/rules/modes/plan`)
   - Metadata extraction and table generation
   - MDX file generation with proper frontmatter

3. **Navigation Integration**
   - Automatic sidebar generation for rules section
   - URL structure matching: `.cursor/rules/modes/plan.mdc` → `/docs/rules/modes/plan`
   - Hierarchical navigation reflecting folder structure

## Rationale
This decision was made after evaluating three potential solutions using a Tree of Thoughts approach with multiple expert perspectives:

**Why Solution A was chosen:**
- **Architectural Alignment**: Perfectly aligns with Docusaurus plugin ecosystem and content model
- **Performance**: Zero runtime overhead, optimal page load times through static generation
- **Security**: No runtime file access or API vulnerabilities
- **Maintainability**: Clear plugin architecture with testable, separated components
- **Single Source of Truth**: Original `.mdc` files remain authoritative, no content duplication
- **Scalability**: Handles any number of rules files efficiently

**Why alternatives were rejected:**
- **Runtime Symlink Strategy**: Poor system fit, security risks, platform dependency issues
- **Content Proxy API**: Over-engineered, introduces unnecessary complexity and performance overhead

## Consequences

### Positive Consequences:
- Clean separation between source rules and documentation presentation
- Excellent runtime performance with static content delivery
- Robust content transformation pipeline
- Maintainable plugin architecture
- Full compliance with "no content duplication" requirement
- Automatic navigation generation
- Future-proof extensibility for additional content processing

### Negative Consequences:
- Increased build complexity and time
- Custom plugin development and maintenance overhead
- Requires rebuild for any changes to `.mdc` files
- Team needs familiarity with Docusaurus plugin development

### Technical Dependencies:
- Docusaurus v3.8.0 plugin API
- Node.js file system operations for build-time processing
- Markdown/MDX parsing and transformation libraries
- Custom sidebar configuration generation

### Implementation Scope:
This ADR covers the architectural approach. Implementation will require:
1. Custom plugin development with content transformation pipeline
2. Sidebar configuration integration
3. Cross-reference resolution logic
4. Metadata extraction and table formatting
5. URL routing configuration
6. Testing and validation framework

## Links
- Related to current task: "Add rules serving to documentation site [L2]"
- Referenced in: `./memory-bank/current_task.md` 