import type { PropSidebar, PropSidebarItemCategory, PropSidebarItemLink } from '@docusaurus/plugin-content-docs';

/**
 * Table of Contents item structure
 */
export interface TOCItem {
  /** Display text for the heading */
  value: string;
  /** Anchor ID for the heading */
  id: string;
  /** Heading level (1-6) */
  level: number;
}

/**
 * Plugin configuration interface for docusaurus-plugin-mdc-rules
 * Defines all configuration options for the plugin
 */
export interface PluginConfig {
  /** Source directory containing .mdc files (default: '.cursor/rules') */
  sourceDir: string;

  /** Target path for generated documentation routes (default: 'rules') */
  targetPath: string;

  /** Whether to include metadata in generated documents (default: true) */
  includeMetadata: boolean;

  /** Main rule file name without extension (default: 'main') */
  mainRule: string;

  /** Component to use for rendering rule pages (default: '@site/src/components/RulePage/index.tsx') */
  component: string;
}

export interface InternalPluginConfig extends PluginConfig {
  /** Base URL for cross-reference links (default: '/rules') */
  crossReferenceBase: string;
}

/**
 * Represents processed content from a single .mdc file
 */
export interface RuleContent {
  /** Rule ID */
  id: string;

  /** Original file path relative to sourceDir */
  filePath: string;

  /** Document title (from frontmatter or first heading) */
  title: string;

  /** Processed markdown content with resolved cross-references */
  content: string;

  /** Extracted frontmatter and metadata */
  metadata: Record<string, any>;

  /** Generated permalink for the document */
  permalink: string;

  /** Pre-generated table of contents */
  toc: TOCItem[];
}

export interface RedirectPageProps {
  /** Redirect destination */
  to: string;
}

export type RulePageProps = (RuleContent | RedirectPageProps);

/**
 * Sidebar item configuration for navigation generation
 */
export type SidebarItem = (PropSidebarItemLink | PropSidebarItemCategory) & {
  position?: number;
}

/**
 * Cross-reference link information
 */
export interface CrossReference {
  /** Original link text (e.g., './modes/plan.mdc') */
  original: string;

  /** Resolved link URL (e.g., '/rules/modes/plan') */
  resolved: string;

  /** Whether the referenced file exists */
  isValid: boolean;
}

/**
 * File processing result with metadata
 */
export interface ProcessingResult {
  /** Successfully processed content */
  content: RuleContent[];

  /** Cross-reference validation results */
  crossReferences: CrossReference[];

  /** Processing warnings and errors */
  warnings: string[];

  /** Fatal errors that prevented processing */
  errors: string[];
}

export interface PluginData {
  sidebar: PropSidebar;
  rules: Omit<RuleContent, 'content'>[];
  crossReferences: CrossReference[];
  config: PluginConfig;
  totalRules: number;
}