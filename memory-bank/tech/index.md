# Technical Stack and Guidelines

## Overview
This project is a **Docusaurus documentation website** built with **TypeScript** and **React**. Docusaurus is a modern static website generator optimized for creating and maintaining documentation sites.

### Primary Technologies:
- **Framework**: Docusaurus v3.8.0
- **Language**: TypeScript (~5.6.2)
- **Frontend Library**: React v19.1.0
- **Package Manager**: npm (confirmed by presence of package-lock.json)
- **Node.js Requirement**: >=18.0

### Project Structure:
- **Documentation**: `docs/` directory with tutorial content
- **Blog**: `blog/` directory for blog posts
- **Static Assets**: `static/` directory for images and other assets
- **Source Components**: `src/` directory for custom React components
- **Configuration**: TypeScript-based Docusaurus configuration

## Custom Plugin Development (ADR-002, ADR-003)
As per [ADR-002](../architecture/ADR-002-build-time-mdc-integration-plugin.md) and [ADR-003](../architecture/ADR-003-docusaurus-content-loader-plugin-implementation.md), this project includes custom Docusaurus plugin development for processing `.mdc` rule files:

### Plugin Development Requirements:
- **Plugin Name**: `docusaurus-plugin-mdc-rules`
- **Purpose**: Build-time processing of `.mdc` files from `.cursor/rules/` into documentation pages
- **Architecture**: Custom Docusaurus content plugin with lifecycle hooks integration
- **Implementation**: Content Loader Plugin with Build Lifecycle Integration (ADR-003)

### Plugin Technical Stack:
- **Docusaurus Plugin API**: v3.8.0 lifecycle hooks (`loadContent`, `contentLoaded`, `configureWebpack`)
- **Content Processing**: Custom content parsing and processing logic
- **Cross-Reference Resolution**: Custom regex-based link conversion logic
- **Metadata Extraction**: Custom table generation from rule metadata
- **Navigation Integration**: Automatic sidebar configuration generation
- **File System Operations**: Node.js `fs` and `path` modules for directory traversal

### Required Dependencies (ADR-003):
| Dependency | Purpose | Type |
|---|---|---|
| `@types/node` | TypeScript definitions for Node.js APIs | Development |

### Plugin File Structure:
```
plugins/docusaurus-plugin-mdc-rules/
├── src/
│   ├── index.ts           # Main plugin export
│   ├── content-loader.ts  # File discovery and parsing
│   ├── link-resolver.ts   # Cross-reference resolution
│   ├── sidebar-generator.ts # Navigation generation
│   └── types.ts          # TypeScript interfaces
├── package.json
└── README.md
```

### Development Guidelines for Plugin:
1. Follow Docusaurus plugin development best practices and lifecycle patterns
2. Implement robust error handling for malformed `.mdc` files with detailed diagnostics
3. Ensure build-time validation of cross-references with warning system
4. Maintain single source of truth principle (no content duplication)
5. Include comprehensive unit tests for transformation logic and edge cases
6. Use TypeScript interfaces for strong typing of plugin configuration and content structures
7. Implement graceful fallback for missing or inaccessible source files

## Common Guidelines
*Links to different coding standards and guidelines will be added here.*

## Detected Dependencies and Versions

### Runtime Dependencies
| Dependency Name | Version | Purpose |
|---|---|---|
| @docusaurus/core | 3.8.0 | Core Docusaurus framework |
| @docusaurus/preset-classic | 3.8.0 | Classic Docusaurus preset with docs, blog, pages |
| @mdx-js/react | 3.1.0 | MDX (Markdown + JSX) support for React |
| clsx | 2.1.1 | Utility for constructing className strings |
| prism-react-renderer | 2.4.1 | Syntax highlighting for code blocks |
| react | 19.1.0 | React library |
| react-dom | 19.1.0 | React DOM rendering |

### Development Dependencies
| Dependency Name | Version | Purpose |
|---|---|---|
| @docusaurus/module-type-aliases | 3.8.0 | TypeScript type aliases for Docusaurus modules |
| @docusaurus/tsconfig | 3.8.0 | Base TypeScript configuration for Docusaurus |
| @docusaurus/types | 3.8.0 | TypeScript type definitions for Docusaurus |
| typescript | 5.6.3 | TypeScript compiler and language support |

### Browser Support
- **Production**: >0.5%, not dead, not op_mini all
- **Development**: Last 3 Chrome, Firefox versions; Last 5 Safari versions

### Key Features Enabled:
- Docusaurus v4 compatibility flag enabled
- International support (default: English)
- Blog with RSS/Atom feeds
- Tutorial documentation with sidebar navigation
- Custom CSS theming support
- GitHub integration ready 