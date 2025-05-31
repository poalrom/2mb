# ADR-001: Single-Page Homepage with Dynamic README Import

## Status
**Accepted** - 2024

## Context
The 2MB documentation website currently uses standard Docusaurus boilerplate content (tutorial pages, blog, etc.) that needs to be replaced with a focused single-page presentation of the 2MB framework documentation from README.md. 

### Requirements
- Complete replacement of multi-page structure with single page
- Present all README.md content on the single page
- Ensure mermaid diagrams render properly
- Maintain functional links within content
- Preserve header navigation structure
- Maintain Docusaurus configuration for easy future expansion
- Minimal configuration changes to preserve Docusaurus features
- **Critical**: No content duplication - single source of truth

## Decision
Implement **Homepage Override with Dynamic README Import**:

1. **Homepage Replacement**: Replace the default Docusaurus homepage (`src/pages/index.tsx`) with a custom React component that dynamically imports and renders README.md content
2. **Dynamic Content Import**: Use Docusaurus's MDX capabilities to import README.md at build time, ensuring no content duplication
3. **Preserve Structure**: Keep existing docs/ and blog/ folder structure intact but hidden from navigation
4. **Mermaid Support**: Leverage Docusaurus's built-in mermaid plugin for diagram rendering
5. **Navigation Configuration**: Configure navigation to show only essential header elements

## Rationale
This solution was chosen over alternatives because it provides:

### Advantages
- **Minimal Configuration Changes**: Requires only homepage replacement and minor config adjustments
- **Single Source of Truth**: README.md remains the authoritative content source
- **Easy Future Expansion**: Trivial to re-enable docs/blog by updating navigation configuration
- **Full Docusaurus Features**: Preserves all Docusaurus optimizations, plugins, and capabilities
- **Performance**: Minimal overhead while maintaining Docusaurus optimizations
- **Maintainability**: Clear separation between content (README.md) and presentation (homepage component)

### Implementation Approach
- Custom React component in `src/pages/index.tsx`
- Dynamic import of `../../README.md` using Docusaurus MDX capabilities
- Configuration updates to hide docs/blog navigation temporarily
- Preserve mermaid plugin configuration for diagram rendering

## Consequences

### Positive
- Single-page site achieved with minimal structural changes
- README.md remains single source of truth for content
- Future multi-page expansion requires only configuration changes
- Full Docusaurus feature set remains available
- Mermaid diagrams and links work out-of-the-box

### Negative
- Slight performance overhead from unused docs/blog infrastructure loading
- Navigation may seem simplified compared to full documentation site
- Custom homepage component needs maintenance if README structure changes significantly

### Risks & Mitigations
- **Risk**: README.md import path issues during build
  - **Mitigation**: Use relative imports and test build process thoroughly
- **Risk**: Mermaid diagrams not rendering in imported content
  - **Mitigation**: Ensure mermaid plugin configuration covers imported MDX content

## Related Decisions
This ADR establishes the foundation for the single-page architecture. Future ADRs may address:
- Multi-page expansion strategy
- Content organization as site grows
- Advanced navigation patterns 