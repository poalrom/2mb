import * as path from 'path';
import { CrossReference, PluginConfig, RuleContent } from './types';

/**
 * Link resolver for processing cross-references in .mdc files
 * Converts relative .mdc references to documentation URLs
 */
export class LinkResolver {
  private config: PluginConfig;
  private discoveredFiles: Map<string, RuleContent>;
  
  // Updated regex pattern for detecting relative .mdc references (more inclusive)
  // Matches patterns like: ./file.mdc, ./path/file.mdc, ./.cursor/rules/file.mdc
  private readonly MDC_LINK_PATTERN = /\.\/[^\s\)]+\.mdc/g;

  constructor(config: PluginConfig) {
    this.config = config;
    this.discoveredFiles = new Map();
  }

  /**
   * Initialize the resolver with discovered files for validation
   * @param ruleContents Array of discovered and processed rule content
   */
  setDiscoveredFiles(ruleContents: RuleContent[]): void {
    this.discoveredFiles.clear();
    
    // Create a map for quick lookup of discovered files
    for (const content of ruleContents) {
      // Store by file path for validation
      this.discoveredFiles.set(content.filePath, content);
      
      // Also store normalized versions for better matching
      const normalizedPath = content.filePath.replace(/\\/g, '/');
      this.discoveredFiles.set(normalizedPath, content);
    }
  }

  /**
   * Process content and resolve all cross-references
   * @param content Original markdown content
   * @param sourceFilePath Path of the source file (for relative resolution)
   * @returns Object containing processed content and cross-reference information
   */
  resolveLinks(content: string, sourceFilePath: string): {
    content: string;
    crossReferences: CrossReference[];
  } {
    const crossReferences: CrossReference[] = [];
    let processedContent = content;

    // Find all .mdc link patterns
    const matches = content.matchAll(this.MDC_LINK_PATTERN);
    
    for (const match of matches) {
      const originalLink = match[0];
      const resolvedInfo = this.resolveSingleLink(originalLink, sourceFilePath);
      
      crossReferences.push(resolvedInfo);
      
      // Replace the original link with the resolved URL
      processedContent = processedContent.replace(originalLink, resolvedInfo.resolved);
    }

    return {
      content: processedContent,
      crossReferences
    };
  }

  /**
   * Resolve a single cross-reference link
   * @param originalLink Original link text (e.g., './modes/plan.mdc' or './.cursor/rules/adr-structure.mdc')
   * @param sourceFilePath Path of the source file
   * @returns Cross-reference information with validation
   */
  private resolveSingleLink(originalLink: string, sourceFilePath: string): CrossReference {
    try {
      // Handle special case for .cursor/rules references
      let targetFilePath = originalLink;
      
      if (originalLink.includes('.cursor/rules/')) {
        // Extract just the filename part from .cursor/rules path
        const rulesIndex = originalLink.indexOf('.cursor/rules/') + '.cursor/rules/'.length;
        targetFilePath = originalLink.substring(rulesIndex);
      } else if (originalLink.startsWith('./')) {
        // Remove leading ./ for relative paths
        targetFilePath = originalLink.substring(2);
      }

      // Generate the documentation URL
      const pathWithoutExt = targetFilePath.replace(/\.mdc$/, '');
      const normalizedPath = pathWithoutExt.replace(/\\/g, '/');
      const resolvedUrl = `${this.config.crossReferenceBase}/${normalizedPath}`;
      
      // Validate that the target file exists
      const isValid = this.validateTargetExists(targetFilePath, originalLink);
      
      return {
        original: originalLink,
        resolved: resolvedUrl,
        isValid
      };
    } catch (error) {
      console.error(`Error resolving link ${originalLink} from ${sourceFilePath}:`, error);
      
      return {
        original: originalLink,
        resolved: originalLink, // Keep original if resolution fails
        isValid: false
      };
    }
  }

  /**
   * Validate that a target file exists in the discovered files
   * @param relativePath Relative path to the target file
   * @param originalLink Original link for logging
   * @returns Whether the target file exists
   */
  private validateTargetExists(relativePath: string, originalLink: string): boolean {
    // Try exact match first
    if (this.discoveredFiles.has(relativePath)) {
      return true;
    }

    // Try without leading './' if present
    const cleanPath = relativePath.replace(/^\.\//, '');
    if (this.discoveredFiles.has(cleanPath)) {
      return true;
    }

    // Try various path normalizations
    const normalizedPath = cleanPath.replace(/\\/g, '/');
    if (this.discoveredFiles.has(normalizedPath)) {
      return true;
    }

    return false;
  }

  /**
   * Generate warnings for broken cross-references
   * @param crossReferences Array of cross-reference information
   * @param sourceFilePath Path of the source file
   * @returns Array of warning messages
   */
  generateWarnings(crossReferences: CrossReference[], sourceFilePath: string): string[] {
    const warnings: string[] = [];

    for (const ref of crossReferences) {
      if (!ref.isValid) {
        const availableFiles = Array.from(this.discoveredFiles.keys())
          .filter(path => path.endsWith('.mdc'))
          .map(path => `./${path}`)
          .sort();

        // Find potential matches for suggestions
        const suggestions = this.findSimilarFiles(ref.original, availableFiles);
        
        let warningMessage = `Broken cross-reference in ${sourceFilePath}: ${ref.original}`;
        
        if (suggestions.length > 0) {
          warningMessage += `\n  Suggestions: ${suggestions.join(', ')}`;
        }
        
        warningMessage += `\n  Available files: ${availableFiles.slice(0, 5).join(', ')}`;
        if (availableFiles.length > 5) {
          warningMessage += ` (and ${availableFiles.length - 5} more)`;
        }

        warnings.push(warningMessage);
      }
    }

    return warnings;
  }

  /**
   * Find similar files that might be the intended target
   * @param originalLink Original broken link
   * @param availableFiles List of available files
   * @returns Array of similar file suggestions
   */
  private findSimilarFiles(originalLink: string, availableFiles: string[]): string[] {
    const linkBasename = path.basename(originalLink, '.mdc').toLowerCase();
    const suggestions: string[] = [];

    for (const file of availableFiles) {
      const fileBasename = path.basename(file, '.mdc').toLowerCase();
      
      // Exact basename match
      if (fileBasename === linkBasename) {
        suggestions.push(file);
      }
      // Partial match
      else if (fileBasename.includes(linkBasename) || linkBasename.includes(fileBasename)) {
        suggestions.push(file);
      }
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Get summary statistics about cross-reference resolution
   * @param allCrossReferences All cross-references from all files
   * @returns Summary statistics
   */
  getResolutionStats(allCrossReferences: CrossReference[]): {
    total: number;
    valid: number;
    broken: number;
    successRate: number;
  } {
    const total = allCrossReferences.length;
    const valid = allCrossReferences.filter(ref => ref.isValid).length;
    const broken = total - valid;
    const successRate = total > 0 ? (valid / total) * 100 : 100;

    return {
      total,
      valid,
      broken,
      successRate: Math.round(successRate * 100) / 100
    };
  }
} 