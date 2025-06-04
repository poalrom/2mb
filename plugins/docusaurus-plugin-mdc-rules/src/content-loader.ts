import glob from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { LinkResolver } from './link-resolver';
import { MetadataParser } from './metadata-parser';
import { InternalPluginConfig, ProcessingResult, RuleContent, TOCItem } from './types';

/**
 * Content loader for processing .mdc files from .cursor/rules/
 * Implements file discovery, parsing, and transformation logic
 */
export class ContentLoader {
  private config: InternalPluginConfig;
  private projectRoot: string;
  private linkResolver: LinkResolver;
  private metadataParser: MetadataParser;

  constructor(config: InternalPluginConfig, projectRoot: string) {
    this.config = config;
    this.projectRoot = projectRoot;
    this.linkResolver = new LinkResolver(config);
    this.metadataParser = new MetadataParser();
  }

  /**
   * Load and process all .mdc files from the source directory
   * @returns Processing result with content and cross-reference information
   */
  async loadContent(): Promise<ProcessingResult> {
    const sourceDir = path.resolve(this.projectRoot, this.config.sourceDir);
    
    try {
      // Check if source directory exists
      if (!fs.existsSync(sourceDir)) {
        console.warn(`Source directory not found: ${sourceDir}`);
        return {
          content: [],
          crossReferences: [],
          warnings: [`Source directory not found: ${sourceDir}`],
          errors: []
        };
      }

      // Discover all .mdc files using fast-glob
      const mdcFiles = await this.discoverMdcFiles(sourceDir);
      console.log(`Found ${mdcFiles.length} .mdc files in ${sourceDir}`);

      // First pass: Process all files without cross-reference resolution
      const processedContent: RuleContent[] = [];
      const warnings: string[] = [];
      const errors: string[] = [];

      for (const filePath of mdcFiles) {
        try {
          const content = await this.processFile(filePath, sourceDir);
          if (content) {
            processedContent.push(content);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error processing file ${filePath}:`, errorMessage);
          errors.push(`Error processing file ${filePath}: ${errorMessage}`);
          // Continue processing other files
        }
      }

      // Initialize link resolver with discovered files
      this.linkResolver.setDiscoveredFiles(processedContent);

      // Second pass: Resolve cross-references in all content
      const allCrossReferences = [];
      for (const content of processedContent) {
        const linkResult = this.linkResolver.resolveLinks(content.content, content.filePath);
        content.content = linkResult.content;
        allCrossReferences.push(...linkResult.crossReferences);

        // Generate warnings for broken links
        const linkWarnings = this.linkResolver.generateWarnings(linkResult.crossReferences, content.filePath);
        warnings.push(...linkWarnings);
      }

      // Log cross-reference resolution statistics
      const stats = this.linkResolver.getResolutionStats(allCrossReferences);
      console.log(`Cross-reference resolution: ${stats.valid}/${stats.total} resolved (${stats.successRate}%)`);

      return {
        content: processedContent,
        crossReferences: allCrossReferences,
        warnings,
        errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error loading content from ${sourceDir}:`, errorMessage);
      return {
        content: [],
        crossReferences: [],
        warnings: [],
        errors: [`Error loading content from ${sourceDir}: ${errorMessage}`]
      };
    }
  }

  /**
   * Discover all .mdc files in the source directory using fast-glob
   * @param sourceDir Source directory to scan
   * @returns Array of absolute file paths
   */
  private async discoverMdcFiles(sourceDir: string): Promise<string[]> {
    try {
      // Use fast-glob to find all .mdc files recursively
      const pattern = path.join(sourceDir, '**/*.mdc').replace(/\\/g, '/');
      const files = await glob(pattern, {
        onlyFiles: true,
        absolute: true,
        followSymbolicLinks: false
      });

      return files;
    } catch (error) {
      console.error(`Error discovering .mdc files in ${sourceDir}:`, error);
      return [];
    }
  }

  /**
   * Process a single .mdc file
   * @param filePath Absolute path to the file
   * @param sourceDir Source directory root
   * @returns Processed RuleContent or null if processing failed
   */
  private async processFile(
    filePath: string, 
    sourceDir: string,
  ): Promise<RuleContent | null> {
    try {
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Parse metadata and content using custom parser
      const { metadata, content } = this.metadataParser.parseWithNormalization(fileContent);

      // Generate relative path from source directory
      const relativePath = path.relative(sourceDir, filePath);
      
      // Extract title from metadata or first heading
      const title = this.extractTitle(metadata, content, relativePath);

      // Generate permalink
      const permalink = this.generatePermalink(relativePath);

      // Process markdown content using remark/rehype pipeline with GFM support
      const processedContent = await this.processMarkdown(content);

      // Extract table of contents from HTML content with actual IDs
      const toc = this.extractTOC(processedContent);

      return {
        id: relativePath.replace(/\.mdc$/, '').replace(/\\/g, '/'),
        filePath: relativePath,
        title,
        content: processedContent,
        metadata: {
          ...metadata,
          sourceFile: path.join(this.config.sourceDir, relativePath),
          lastModified: fs.statSync(filePath).mtime.toISOString()
        },
        permalink,
        toc
      };
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract title from metadata or first heading in content
   * @param metadata Parsed metadata
   * @param content Markdown content
   * @param relativePath File path for fallback
   * @returns Document title
   */
  private extractTitle(metadata: any, content: string, relativePath: string): string {
    // 1. Try metadata title
    if (metadata.title && typeof metadata.title === 'string') {
      return metadata.title;
    }

    // 2. Try metadata description (common in cursor rules)
    if (metadata.description && typeof metadata.description === 'string') {
      return metadata.description;
    }

    // 3. Try first heading in content
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    // 4. Fallback to filename without extension
    const filename = path.basename(relativePath, '.mdc');
    return filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Generate permalink from file path
   * Converts file path to URL following /docs/rules/path/structure pattern
   * @param relativePath Relative file path from source directory
   * @returns Generated permalink
   */
  private generatePermalink(relativePath: string): string {
    // Remove .mdc extension and normalize path separators
    const pathWithoutExt = relativePath.replace(/\.mdc$/, '');
    const normalizedPath = pathWithoutExt.replace(/\\/g, '/');
    
    // Generate permalink with base URL
    return path.join(this.config.crossReferenceBase, normalizedPath);
  }

  /**
   * Process markdown content using remark/rehype pipeline with GFM support
   * @param content Raw markdown content
   * @returns Processed HTML content
   */
  private async processMarkdown(content: string): Promise<string> {
    try {
      // Create unified processor with remark -> rehype -> stringify pipeline
      const processor = unified()
        .use(remarkParse) // Parse markdown to MDAST
        .use(remarkGfm) // Add GitHub Flavored Markdown support (tables, strikethrough, task lists, autolinks)
        .use(remarkRehype) // Convert MDAST to HAST
        .use(rehypeSlug) // Add automatic heading ID generation
        .use(rehypeStringify); // Convert HAST to HTML string

      // Process the markdown content
      const result = await processor.process(content);
      
      // Return the HTML string
      return String(result);
    } catch (error) {
      // Log error and return original content as fallback
      console.error(`Error processing markdown content:`, error);
      
      // Return content wrapped in a pre tag to preserve formatting as fallback
      return `<pre>${content}</pre>`;
    }
  }

  /**
   * Extract table of contents from HTML content with actual IDs
   * @param htmlContent Processed HTML content
   * @returns Array of TOC items
   */
  private extractTOC(htmlContent: string): TOCItem[] {
    const toc: TOCItem[] = [];

    // Parse HTML to extract headings with their IDs
    // Using a simple regex approach that works with the HTML generated by rehype-slug
    const headingRegex = /<(h[1-6])(?:\s+id="([^"]*)")?[^>]*>(.*?)<\/h[1-6]>/gi;
    
    let match;
    while ((match = headingRegex.exec(htmlContent)) !== null) {
      const tagName = match[1].toLowerCase();
      const id = match[2] || ''; // ID generated by rehype-slug
      const htmlContent = match[3];
      
      // Extract text content from HTML (remove any nested HTML tags)
      const value = htmlContent.replace(/<[^>]*>/g, '').trim();
      
      // Convert heading tag to level number (h1 = 1, h2 = 2, etc.)
      const level = parseInt(tagName.charAt(1), 10);
      
      // Only include headings that have IDs (generated by rehype-slug)
      if (id && value) {
        toc.push({ value, id, level });
      }
    }

    return toc;
  }
} 