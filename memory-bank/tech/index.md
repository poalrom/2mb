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

## MDC Rules Plugin Integration (ADR-002, ADR-003)
As per [ADR-002](../architecture/ADR-002-build-time-mdc-integration-plugin.md) and [ADR-003](../architecture/ADR-003-docusaurus-content-loader-plugin-implementation.md), this project uses a custom Docusaurus plugin for processing `.mdc` rule files:

### Plugin Integration:
- **Plugin Name**: `docusaurus-plugin-mdc-rules`
- **Status**: **External npm dependency** (moved to separate repository)
- **Purpose**: Build-time processing of `.mdc` files from `.cursor/rules/` into documentation pages
- **Architecture**: Custom Docusaurus content plugin with lifecycle hooks integration
- **Implementation**: Content Loader Plugin with Build Lifecycle Integration (ADR-003)

### Plugin Functionality:
- **Content Processing**: Automated parsing and processing of `.mdc` rule files
- **Cross-Reference Resolution**: Converts internal rule references to documentation links
- **Metadata Extraction**: Generates organized tables from rule metadata
- **Navigation Integration**: Automatic sidebar configuration generation
- **URL Mapping**: Maps `.cursor/rules/` structure to `/docs/rules/` URLs

**Note**: The plugin was originally developed as custom code within this project but has been extracted to a standalone npm package for reusability across multiple projects.

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