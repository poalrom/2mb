/**
 * Custom metadata parser for .mdc files
 * Handles cursor rules metadata format which may not be valid YAML frontmatter
 */
export class MetadataParser {
  
  /**
   * Parse metadata from .mdc file content
   * @param content Raw file content
   * @returns Parsed metadata and remaining content
   */
  parseMetadata(content: string): {
    metadata: Record<string, any>;
    content: string;
  } {
    const trimmedContent = content.trim();
    
    // Check if content starts with metadata block (---)
    if (!trimmedContent.startsWith('---')) {
      return {
        metadata: {},
        content: trimmedContent
      };
    }

    // Find the end of metadata block
    const lines = trimmedContent.split('\n');
    let metadataEndIndex = -1;
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        metadataEndIndex = i;
        break;
      }
    }

    // If no closing --- found, treat as regular content
    if (metadataEndIndex === -1) {
      return {
        metadata: {},
        content: trimmedContent
      };
    }

    // Extract metadata lines (excluding the --- delimiters)
    const metadataLines = lines.slice(1, metadataEndIndex);
    const remainingContent = lines.slice(metadataEndIndex + 1).join('\n').trim();

    // Parse metadata using custom parser
    const metadata = this.parseMetadataLines(metadataLines);

    return {
      metadata,
      content: remainingContent
    };
  }

  /**
   * Parse metadata lines with a lenient approach
   * @param metadataLines Array of metadata lines
   * @returns Parsed metadata object
   */
  private parseMetadataLines(metadataLines: string[]): Record<string, any> {
    const metadata: Record<string, any> = {};
    let i = 0;

    while (i < metadataLines.length) {
      const line = metadataLines[i].trim();
      
      // Skip empty lines
      if (!line) {
        i++;
        continue;
      }

      // Check if this line has a colon (key-value pair)
      const colonIndex = line.indexOf(':');
      
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const valueAfterColon = line.substring(colonIndex + 1).trim();
        
        if (valueAfterColon === '') {
          // Empty value - might be a multiline value or just empty
          // Look ahead to see if the next non-empty line is indented or another key
          let j = i + 1;
          let nextNonEmptyLine = '';
          while (j < metadataLines.length) {
            const nextLine = metadataLines[j].trim();
            if (nextLine) {
              nextNonEmptyLine = nextLine;
              break;
            }
            j++;
          }
          
          // If next line looks like another key (has colon and not indented), this is just empty
          if (nextNonEmptyLine.includes(':') && !metadataLines[j]?.startsWith(' ')) {
            metadata[key] = '';
          } else {
            // This might be a multiline value, but for cursor rules it's often just empty
            metadata[key] = '';
          }
        } else {
          // Single line value
          metadata[key] = this.parseValue(valueAfterColon);
        }
      }
      
      i++;
    }

    return metadata;
  }

  /**
   * Parse a value string into appropriate type
   * @param value Raw value string
   * @returns Parsed value
   */
  private parseValue(value: string): any {
    if (!value) {
      return '';
    }

    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // Handle boolean values
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }

    // Handle null/undefined
    if (value.toLowerCase() === 'null' || value.toLowerCase() === '~') {
      return null;
    }

    // Handle numbers
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^-?\d*\.?\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Handle arrays (simple comma-separated)
    if (value.includes(',') && !value.includes(' ')) {
      return value.split(',').map(item => item.trim());
    }

    // Return as string
    return value;
  }

  /**
   * Extract metadata with normalization for common patterns
   * @param content File content
   * @returns Extracted metadata with normalized fields
   */
  parseWithNormalization(content: string): {
    metadata: Record<string, any>;
    content: string;
  } {
    const result = this.parseMetadata(content);
    
    // Clean up and normalize metadata
    const cleanedMetadata = { ...result.metadata };

    // Handle globs field (normalize to array)
    if (cleanedMetadata.globs !== undefined) {
      if (typeof cleanedMetadata.globs === 'string') {
        if (cleanedMetadata.globs.trim() === '') {
          cleanedMetadata.globs = [];
        } else {
          cleanedMetadata.globs = [cleanedMetadata.globs];
        }
      }
    } else {
      // Default to empty array if not specified
      cleanedMetadata.globs = [];
    }

    // Handle alwaysApply field (normalize to boolean)
    if (cleanedMetadata.alwaysApply !== undefined) {
      if (typeof cleanedMetadata.alwaysApply === 'string') {
        cleanedMetadata.alwaysApply = cleanedMetadata.alwaysApply.toLowerCase() === 'true';
      }
    } else {
      // Default to false if not specified
      cleanedMetadata.alwaysApply = false;
    }

    // Remove any undefined or null values
    Object.keys(cleanedMetadata).forEach(key => {
      if (cleanedMetadata[key] === undefined || cleanedMetadata[key] === null) {
        delete cleanedMetadata[key];
      }
    });

    return {
      metadata: cleanedMetadata,
      content: result.content
    };
  }
} 