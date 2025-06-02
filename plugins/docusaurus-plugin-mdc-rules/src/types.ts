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
  
  /** Base URL for cross-reference links (default: '/docs/rules') */
  crossReferenceBase: string;

  /** Main rule file name without extension (default: 'main') */
  mainRule: string;

  /** Component to use for rendering rule pages (default: '@site/src/components/RulePage/index.tsx') */
  component: string;
}

/**
 * Represents processed content from a single .mdc file
 */
export interface RuleContent {
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
}

export interface RuleProps {
  /** Rule ID */
  id: string;

  /** Rule title */
  title: string;

  /** Rule content */
  content: string;

  /** Rule metadata */
  metadata: Record<string, any>;

  /** Rule permalink */
  permalink: string;
}

export interface RedirectPageProps {
  /** Redirect destination */
  to: string;
}

export type RulePageProps = RuleProps | RedirectPageProps;

/**
 * Sidebar item configuration for navigation generation
 */
export interface SidebarItem {
  type: 'doc' | 'category';
  id?: string;
  label: string;
  position?: number;
  items?: SidebarItem[];
}

/**
 * Cross-reference link information
 */
export interface CrossReference {
  /** Original link text (e.g., './modes/plan.mdc') */
  original: string;
  
  /** Resolved link URL (e.g., '/docs/rules/modes/plan') */
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