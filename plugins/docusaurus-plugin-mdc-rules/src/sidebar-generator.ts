import * as path from 'path';
import { RuleContent, SidebarItem } from './types';

/**
 * Sidebar generator for creating Docusaurus navigation structure
 * Automatically generates sidebar items from directory structure of processed .mdc files
 */
export class SidebarGenerator {
  
  /**
   * Generate sidebar configuration from processed rule content
   * Mirrors the .cursor/rules/ folder hierarchy exactly
   * @param ruleContent Array of processed rule content
   * @returns Sidebar configuration object
   */
  generateSidebar(ruleContent: RuleContent[]): SidebarItem[] {
    // Build directory tree structure
    const directoryTree = this.buildDirectoryTree(ruleContent);
    
    // Convert tree to sidebar items
    const sidebarItems = this.convertTreeToSidebarItems(directoryTree);
    
    // Return sidebar configuration for Docusaurus
    return sidebarItems;
  }
  
  /**
   * Build hierarchical directory tree from rule content
   * @param ruleContent Array of processed rule content
   * @returns Directory tree structure
   */
  private buildDirectoryTree(ruleContent: RuleContent[]): DirectoryNode {
    const root: DirectoryNode = {
      name: '',
      path: '',
      type: 'directory',
      children: new Map(),
      items: []
    };
    
    // Process each rule content file
    for (const rule of ruleContent) {
      this.addFileToTree(root, rule);
    }
    
    return root;
  }
  
  /**
   * Add a single file to the directory tree
   * @param root Root directory node
   * @param rule Rule content to add
   */
  private addFileToTree(root: DirectoryNode, rule: RuleContent): void {
    const pathParts = rule.filePath.split(path.sep).filter(part => part.length > 0);
    let currentNode = root;
    
    // Navigate/create directory structure
    for (let i = 0; i < pathParts.length - 1; i++) {
      const dirName = pathParts[i];
      
      if (!currentNode.children.has(dirName)) {
        const dirPath = pathParts.slice(0, i + 1).join('/');
        currentNode.children.set(dirName, {
          name: dirName,
          path: dirPath,
          type: 'directory',
          children: new Map(),
          items: []
        });
      }
      
      currentNode = currentNode.children.get(dirName)!;
    }
    
    // Add file to the appropriate directory
    const fileNode: FileNode = {
      name: path.basename(rule.filePath, '.mdc'),
      path: rule.filePath,
      type: 'file',
      rule: rule
    };
    
    currentNode.items.push(fileNode);
  }
  
  /**
   * Convert directory tree to Docusaurus sidebar items
   * @param tree Directory tree structure
   * @returns Array of sidebar items
   */
  private convertTreeToSidebarItems(tree: DirectoryNode): SidebarItem[] {
    const items: SidebarItem[] = [];
    
    // Add files in current directory first
    for (const fileNode of tree.items) {
      const sidebarItem = this.createSidebarItemFromFile(fileNode);
      items.push(sidebarItem);
    }
    
    // Add subdirectories as categories
    for (const [dirName, dirNode] of tree.children) {
      const categoryItem = this.createSidebarItemFromDirectory(dirNode);
      items.push(categoryItem);
    }
    
    // Sort items by position if specified, then by label
    return this.sortSidebarItems(items);
  }
  
  /**
   * Create sidebar item from file node
   * @param fileNode File node containing rule content
   * @returns Sidebar item for document
   */
  private createSidebarItemFromFile(fileNode: FileNode): SidebarItem {
    const rule = fileNode.rule;
    
    // Extract sidebar position from frontmatter
    const position = this.extractSidebarPosition(rule.metadata);
    
    return {
      type: 'link',
      label: rule.title,
      href: rule.permalink,
      ...(position !== undefined && { position })
    };
  }
  
  /**
   * Create sidebar item from directory node
   * @param dirNode Directory node
   * @returns Sidebar item for category
   */
  private createSidebarItemFromDirectory(dirNode: DirectoryNode): SidebarItem {
    // Generate label from directory name (capitalize and replace hyphens/underscores)
    const label = this.formatDirectoryLabel(dirNode.name);
    
    // Recursively process subdirectory contents
    const items = this.convertTreeToSidebarItems(dirNode);
    
    return {
      type: 'category',
      label: label,
      items: items,
      collapsed: true,
      collapsible: true,
    };
  }
  
  /**
   * Extract sidebar position from rule metadata
   * @param metadata Rule metadata object
   * @returns Sidebar position number or undefined
   */
  private extractSidebarPosition(metadata: Record<string, any>): number | undefined {
    const position = metadata.sidebar_position || metadata.sidebarPosition;
    
    if (typeof position === 'number') {
      return position;
    }
    
    if (typeof position === 'string') {
      const parsed = parseInt(position, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    
    return undefined;
  }
  
  /**
   * Format directory name into user-friendly label
   * @param dirName Directory name
   * @returns Formatted label
   */
  private formatDirectoryLabel(dirName: string): string {
    return dirName
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  /**
   * Sort sidebar items by position, then by label
   * @param items Array of sidebar items to sort
   * @returns Sorted array of sidebar items
   */
  private sortSidebarItems(items: SidebarItem[]): SidebarItem[] {
    return items.sort((a, b) => {
      // Position takes precedence
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      
      if (a.position !== undefined) {
        return -1; // Items with position come first
      }
      
      if (b.position !== undefined) {
        return 1; // Items with position come first
      }
      
      // Fall back to alphabetical sorting by label
      return a.label.localeCompare(b.label);
    });
  }
}

/**
 * Directory tree node representing a folder
 */
interface DirectoryNode {
  name: string;
  path: string;
  type: 'directory';
  children: Map<string, DirectoryNode>;
  items: FileNode[];
}

/**
 * File node representing a processed .mdc file
 */
interface FileNode {
  name: string;
  path: string;
  type: 'file';
  rule: RuleContent;
} 