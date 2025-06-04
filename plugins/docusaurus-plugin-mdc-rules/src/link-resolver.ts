import * as path from 'path';
import { CrossReference, InternalPluginConfig, RuleContent } from './types';

/**
 * Link resolver for processing cross-references in .mdc files
 * Converts relative .mdc references to documentation URLs
 */
export class LinkResolver {
  private config: InternalPluginConfig;
  private discoveredFiles: Map<string, RuleContent>;
  
  // Updated regex pattern for detecting .mdc links in HTML anchor tags and bare references
  // Matches patterns like: <a href="./file.mdc">text</a>, <a href="mdc:.cursor/rules/file.mdc">text</a>, ./file.mdc
  private readonly MDC_LINK_PATTERN = /(<a\s+[^>]*href\s*=\s*["'](\.\/[^\s"']+\.mdc|\.cursor\/rules\/[^\s"']+\.mdc|mdc:[^\s"']+\.mdc)["'][^>]*>.*?<\/a>)|(\.\/[^\s\)\]]+\.mdc|\.cursor\/rules\/[^\s\)\]]+\.mdc|mdc:[^\s\)\]]+\.mdc)/g;

  constructor(config: InternalPluginConfig) {
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
   * @param content Original HTML content
   * @param sourceFilePath Path of the source file (for relative resolution)
   * @returns Object containing processed content and cross-reference information
   */
  resolveLinks(content: string, sourceFilePath: string): {
    content: string;
    crossReferences: CrossReference[];
  } {
    const crossReferences: CrossReference[] = [];
    let processedContent = content;

    // Find all .mdc link patterns (both HTML anchor tags and bare links)
    const matches = content.matchAll(this.MDC_LINK_PATTERN);
    
    for (const match of matches) {
      const fullMatch = match[0];
      let originalLink: string;
      let linkText: string | null = null;

      if (match[1]) {
        // HTML anchor tag match
        const anchorTag = match[1];
        originalLink = match[2]; // The href value
        
        // Extract link text from the anchor tag
        const textMatch = anchorTag.match(/>([^<]*)</);
        linkText = textMatch ? textMatch[1] : 'link';
        
        const resolvedInfo = this.resolveSingleLink(originalLink, sourceFilePath);
        crossReferences.push(resolvedInfo);
        
        // Replace the entire anchor tag with the resolved URL
        const newAnchorTag = `<a href="${resolvedInfo.resolved}">${linkText}</a>`;
        processedContent = processedContent.replace(anchorTag, newAnchorTag);
      } else if (match[3]) {
        // Bare .mdc link match
        originalLink = match[3];
        
        const resolvedInfo = this.resolveSingleLink(originalLink, sourceFilePath);
        crossReferences.push(resolvedInfo);
        
        // Replace the bare link with the resolved URL
        processedContent = processedContent.replace(originalLink, resolvedInfo.resolved);
      }
    }

    return {
      content: processedContent,
      crossReferences
    };
  }

  /**
   * Resolve a single cross-reference link
   * @param originalLink Original link text (e.g., './modes/plan.mdc', './.cursor/rules/adr-structure.mdc', or 'mdc:.cursor/rules/modes/init.mdc')
   * @param sourceFilePath Path of the source file
   * @returns Cross-reference information with validation
   */
  private resolveSingleLink(originalLink: string, sourceFilePath: string): CrossReference {
    try {
      let targetFilePath = originalLink;
      
      if (originalLink.startsWith('mdc:')) {
        // Handle mdc: scheme format (e.g., mdc:.cursor/rules/modes/init.mdc)
        const mdcPath = originalLink.substring(4); // Remove 'mdc:' prefix
        
        // If the path starts with the sourceDir, extract the relative part
        if (mdcPath.startsWith(this.config.sourceDir + '/')) {
          targetFilePath = mdcPath.substring(this.config.sourceDir.length + 1);
        } else if (mdcPath.startsWith('./' + this.config.sourceDir + '/')) {
          targetFilePath = mdcPath.substring(('./' + this.config.sourceDir + '/').length);
        } else {
          // Use the path as-is if it doesn't start with sourceDir
          targetFilePath = mdcPath;
        }
      } else if (originalLink.includes('.cursor/rules/')) {
        // Handle legacy .cursor/rules references
        const rulesIndex = originalLink.indexOf('.cursor/rules/') + '.cursor/rules/'.length;
        targetFilePath = originalLink.substring(rulesIndex);
      } else if (originalLink.startsWith('./')) {
        // Remove leading ./ for relative paths
        targetFilePath = originalLink.substring(2);
      }

      // Generate the documentation URL
      const pathWithoutExt = targetFilePath.replace(/\.mdc$/, '');
      const normalizedPath = pathWithoutExt.replace(/\\/g, '/');
      const resolvedUrl = path.join(this.config.crossReferenceBase, normalizedPath);
      
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