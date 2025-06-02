import type { LoadContext, Plugin, PluginContentLoadedActions } from '@docusaurus/types';
import * as path from 'path';
import { ContentLoader } from './content-loader';
import { SidebarGenerator } from './sidebar-generator';
import { PluginConfig, ProcessingResult } from './types';

/**
 * Default plugin configuration
 */
const DEFAULT_CONFIG: PluginConfig = {
  sourceDir: '.cursor/rules',
  targetPath: 'rules',
  includeMetadata: true,
  crossReferenceBase: '/cursor/rules',
  mainRule: 'main',
  component: '@site/src/components/RulePage/index.tsx'
};

/**
 * Main plugin export for docusaurus-plugin-mdc-rules
 * Processes .mdc files from .cursor/rules/ into documentation pages
 */
export default function plugin(
  context: LoadContext,
  options: Partial<PluginConfig>
): Plugin<ProcessingResult> {
  const config: PluginConfig = { ...DEFAULT_CONFIG, ...options };

  return {
    name: 'docusaurus-plugin-mdc-rules',

    /**
     * Return paths to watch for this plugin
     */
    getPathsToWatch(): string[] {
      const sourceDir = path.resolve(context.siteDir, config.sourceDir);
      return [sourceDir];
    },

    /**
     * Load and process .mdc files from the source directory
     * This lifecycle hook runs during the content loading phase
     */
    async loadContent(): Promise<ProcessingResult> {
      console.log(`Loading content from ${config.sourceDir}...`);
      
      try {
        const contentLoader = new ContentLoader(config, context.siteDir);
        const result = await contentLoader.loadContent();
        
        console.log(`Successfully loaded ${result.content.length} .mdc files`);
        
        // Log warnings if any
        if (result.warnings.length > 0) {
          console.warn(`Found ${result.warnings.length} warnings:`);
          result.warnings.forEach(warning => console.warn(`  ${warning}`));
        }
        
        // Log errors if any
        if (result.errors.length > 0) {
          console.error(`Found ${result.errors.length} errors:`);
          result.errors.forEach(error => console.error(`  ${error}`));
        }
        
        return result;
      } catch (error) {
        console.error(`Error loading content from ${config.sourceDir}:`, error);
        throw error;
      }
    },

    /**
     * Generate virtual documents and sidebar configuration
     * This lifecycle hook runs after content is loaded
     */
    async contentLoaded({ 
      content, 
      actions
    }: {
      content: ProcessingResult;
      actions: PluginContentLoadedActions;
    }): Promise<void> {
      const { content: ruleContents, crossReferences } = content;
      console.log(`Processing ${ruleContents.length} .mdc files with ${crossReferences.length} cross-references...`);
      
      try {
        // Generate sidebar configuration
        const sidebarGenerator = new SidebarGenerator();
        const sidebarConfig = sidebarGenerator.generateSidebar(ruleContents);
        
        console.log(`Generated sidebar with ${Object.keys(sidebarConfig).length} categories`);

        actions.addRoute({
          path: config.crossReferenceBase,
          component: config.component,
          exact: true,
          props: {
            to: `${config.crossReferenceBase}/${config.mainRule}`
          }
        })
        
        // Create routes for each .mdc file using direct props
        for (const rule of ruleContents) {
          // Add route for this rule page with inline props
          actions.addRoute({
            path: rule.permalink,
            component: config.component,
            exact: true,
            props: {
              id: rule.filePath.replace(/\.mdc$/, '').replace(/\\/g, '/'),
              title: rule.title,
              content: rule.content,
              metadata: rule.metadata,
              permalink: rule.permalink
            }
          });
        }
        
        // Set global data for sidebar and other components
        actions.setGlobalData({
          sidebar: sidebarConfig,
          rules: ruleContents.map(rule => ({
            id: rule.filePath.replace(/\.mdc$/, '').replace(/\\/g, '/'),
            title: rule.title,
            permalink: rule.permalink,
            metadata: rule.metadata
          })),
          crossReferences: crossReferences,
          config: config,
          totalRules: ruleContents.length
        });
        
        console.log(`Successfully created ${ruleContents.length} routes and sidebar configuration`);
        
      } catch (error) {
        console.error('Error in contentLoaded:', error);
        throw error;
      }
    }
  };
}

/**
 * Plugin configuration validation
 */
export function validateOptions({ 
  options, 
  validate 
}: { 
  options: Partial<PluginConfig>; 
  validate: any; 
}): PluginConfig {
  const validatedOptions = { ...DEFAULT_CONFIG, ...options };
  
  // Validate required configuration fields
  if (!validatedOptions.sourceDir) {
    throw new Error('sourceDir is required for docusaurus-plugin-mdc-rules');
  }
  
  if (!validatedOptions.targetPath) {
    throw new Error('targetPath is required for docusaurus-plugin-mdc-rules');
  }
  
  if (!validatedOptions.crossReferenceBase) {
    throw new Error('crossReferenceBase is required for docusaurus-plugin-mdc-rules');
  }
  
  console.log('Plugin configuration validated:', validatedOptions);
  
  return validatedOptions;
} 