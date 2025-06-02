# ADR-003: Docusaurus Content Loader Plugin Implementation

## Status
**Accepted** - 2024

## Context
Following [ADR-002: Build-Time MDC Integration Plugin](./ADR-002-build-time-mdc-integration-plugin.md), the high-level architectural approach has been established. This ADR addresses the specific implementation decisions needed to build the custom Docusaurus plugin (`docusaurus-plugin-mdc-rules`) that will process `.mdc` files from `.cursor/rules/` into documentation pages.

## Problem
While ADR-002 established the build-time processing approach, several technical implementation decisions remained unresolved:
- Plugin architecture and lifecycle hooks selection
- Content transformation algorithm design  
- Cross-reference resolution implementation strategy
- Sidebar integration approach
- Error handling and validation mechanisms

## Decision
Implement **Solution A: Content Loader Plugin with Build Lifecycle Integration**

We will create a custom Docusaurus content plugin using the `loadContent` and `contentLoaded` lifecycle hooks to generate virtual documents during build time.

### Implementation Architecture:

#### Plugin Structure:
```typescript
interface PluginConfig {
  sourceDir: string;           // '.cursor/rules'
  targetPath: string;          // 'rules'
  includeMetadata: boolean;    // true
  crossReferenceBase: string;  // '/docs/rules'
}

interface RuleContent {
  filePath: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  permalink: string;
}
```

#### Lifecycle Hooks Strategy:
1. **`loadContent`**: 
   - Scan `.cursor/rules/` directory recursively
   - Parse `.mdc` files and extract metadata
   - Process content and resolve cross-references
   - Return structured content data

2. **`contentLoaded`**: 
   - Generate virtual documents from processed content
   - Create sidebar configuration matching directory structure
   - Register routes with proper permalinks

3. **`configureWebpack`** (if needed): 
   - Add any necessary webpack configurations for content processing

#### Content Transformation Algorithm:
1. **File Discovery**: 
   - Recursive directory traversal of `.cursor/rules/`
   - Filter for `.mdc` file extensions
   - Preserve directory structure metadata

2. **Content Parsing**: 
   - Extract frontmatter metadata using custom parsing logic
   - Parse markdown content with custom processing pipeline
   - Identify cross-reference patterns (e.g., `./modes/plan.mdc`)

3. **Link Resolution**: 
   - Convert relative `.mdc` references to absolute documentation links
   - Pattern: `./modes/plan.mdc` → `/docs/rules/modes/plan`
   - Validate target files exist and warn on broken links

4. **Virtual Document Generation**: 
   - Create document objects with proper permalinks
   - Generate frontmatter with title, sidebar position
   - Apply content transformations for MDX compatibility

#### Cross-Reference Resolution Strategy:
- **Pattern Detection**: Regex pattern `/\.\/[\w\/\-]+\.mdc/g` to find relative references
- **Link Conversion**: Replace matched patterns with documentation URLs
- **Validation**: Cross-check against discovered files, emit warnings for broken links
- **Fallback**: Preserve original links for external or absolute references

#### Sidebar Integration Approach:
- **Auto-generation**: Create sidebar items from directory structure
- **Hierarchical Organization**: Mirror `.cursor/rules/` folder hierarchy exactly
- **Metadata Integration**: Use frontmatter `title` and `sidebar_position` for customization
- **Category Creation**: Automatic category generation for subdirectories

#### Error Handling Mechanisms:
- **File Access Errors**: Log warnings and continue processing other files
- **Parse Errors**: Detailed error messages with file path and line context
- **Cross-Reference Validation**: Warning system for broken internal links with suggestions
- **Build Failure Strategy**: Continue build with warnings unless critical configuration errors

### Plugin File Structure:
```
plugins/
└── docusaurus-plugin-mdc-rules/
    ├── src/
    │   ├── index.ts           # Main plugin export
    │   ├── content-loader.ts  # File discovery and parsing
    │   ├── link-resolver.ts   # Cross-reference resolution
    │   ├── sidebar-generator.ts # Navigation generation
    │   └── types.ts          # TypeScript interfaces
    ├── package.json
    └── README.md
```

## Rationale
This decision was made after evaluating three implementation approaches using expert analysis:

**Why Content Loader Plugin was chosen:**
- **Architectural Alignment**: Follows native Docusaurus plugin patterns perfectly
- **Performance**: Optimal build-time processing with zero runtime overhead
- **Control**: Full control over document generation and frontmatter
- **Integration**: Seamless integration with Docusaurus optimization pipeline
- **Maintainability**: Clear separation of concerns following plugin conventions

**Why alternatives were rejected:**
- **File Generation Plugin**: Creates temporary files with cleanup responsibilities and potential git issues
- **Webpack Loader Integration**: Over-engineered approach that fights against Docusaurus content model

## Consequences

### Positive Consequences:
- Native integration with Docusaurus content system
- Optimal performance through build-time processing
- Full control over document generation and metadata
- Robust error handling with detailed diagnostics
- Future-proof extensibility for additional processing features
- Clean plugin architecture following established patterns

### Negative Consequences:
- Requires deeper understanding of Docusaurus internal APIs
- More complex implementation than simple file generation
- Plugin maintenance overhead for Docusaurus version updates
- Build-time dependency on `.cursor/rules/` file availability

### Technical Dependencies:
- **Docusaurus Plugin API**: v3.8.0 lifecycle hooks (`loadContent`, `contentLoaded`)
- **Content Processing**: Custom content parsing and processing logic
- **File System**: Node.js `fs` and `path` modules for directory traversal
- **TypeScript**: Strong typing for plugin interfaces and content structures

### Implementation Requirements:
1. Custom plugin development with TypeScript interfaces
2. Content parsing pipeline with metadata extraction
3. Cross-reference resolution algorithm with validation
4. Sidebar configuration auto-generation
5. Comprehensive error handling and logging
6. Unit tests for transformation logic and edge cases

## Links
- Implements: [ADR-002: Build-Time MDC Integration Plugin](./ADR-002-build-time-mdc-integration-plugin.md)
- Related task: "Implement ADR-002: Build-Time MDC Integration Plugin [L2]"
- Referenced in: `./memory-bank/current_task.md` 