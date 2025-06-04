import glob from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';
import { ContentLoader } from './content-loader';
import { LinkResolver } from './link-resolver';
import { MetadataParser } from './metadata-parser';
import { InternalPluginConfig } from './types';

// Mock dependencies
jest.mock('fs');
jest.mock('fast-glob');
jest.mock('./link-resolver');
jest.mock('./metadata-parser');

// Mock the unified/remark modules
jest.mock('unified', () => ({
  unified: jest.fn(() => ({
    use: jest.fn().mockReturnThis(),
    process: jest.fn().mockResolvedValue({
      toString: () => '<h1 id="test-heading">Test Heading</h1>\n<p>This is a <strong>bold</strong> text and <em>italic</em> text.</p>\n<h2 id="section-1">Section 1</h2>\n<p>Content for section 1.</p>\n<h3 id="subsection-11">Subsection 1.1</h3>\n<p>Content for subsection.</p>\n<pre><code class="language-javascript">console.log(\'Hello, world!\');\n</code></pre>\n<ul>\n<li>List item 1</li>\n<li>List item 2</li>\n</ul>\n<p><a href="https://example.com">Link example</a></p>'
    })
  }))
}));

jest.mock('remark-parse', () => ({
  default: jest.fn()
}));

jest.mock('remark-gfm', () => ({
  default: jest.fn()
}));

jest.mock('remark-rehype', () => ({
  default: jest.fn()
}));

jest.mock('rehype-slug', () => ({
  default: jest.fn()
}));

jest.mock('rehype-stringify', () => ({
  default: jest.fn()
}));

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedGlob = glob as jest.MockedFunction<typeof glob>;
const MockedLinkResolver = LinkResolver as jest.MockedClass<typeof LinkResolver>;
const MockedMetadataParser = MetadataParser as jest.MockedClass<typeof MetadataParser>;

describe('ContentLoader', () => {
  let contentLoader: ContentLoader;
  let mockConfig: InternalPluginConfig;
  let mockLinkResolver: jest.Mocked<LinkResolver>;
  let mockMetadataParser: jest.Mocked<MetadataParser>;
  let projectRoot: string;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock config
    mockConfig = {
      sourceDir: '.cursor/rules',
      targetPath: 'rules',
      includeMetadata: true,
      crossReferenceBase: '/docs/rules',
      mainRule: 'main',
      component: '@site/src/components/RulePage/index.tsx'
    };

    projectRoot = '/test/project';

    // Setup mock instances with default return values
    mockLinkResolver = {
      setDiscoveredFiles: jest.fn(),
      resolveLinks: jest.fn().mockReturnValue({
        content: '',
        crossReferences: []
      }),
      generateWarnings: jest.fn().mockReturnValue([]),
      getResolutionStats: jest.fn().mockReturnValue({
        total: 0,
        valid: 0,
        broken: 0,
        successRate: 100
      })
    } as any;

    mockMetadataParser = {
      parseWithNormalization: jest.fn().mockReturnValue({
        metadata: {},
        content: ''
      })
    } as any;

    // Configure constructor mocks
    MockedLinkResolver.mockImplementation(() => mockLinkResolver);
    MockedMetadataParser.mockImplementation(() => mockMetadataParser);

    // Create content loader instance
    contentLoader = new ContentLoader(mockConfig, projectRoot);

    mockedFs.existsSync.mockReturnValue(true);

    mockedFs.statSync.mockReturnValue({
        mtime: new Date('2023-01-01T00:00:00Z')
      } as any);
  });

  describe('loadContent', () => {
    it('should return empty result when source directory does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = await contentLoader.loadContent();

      expect(result).toEqual({
        content: [],
        crossReferences: [],
        warnings: [`Source directory not found: ${path.resolve(projectRoot, mockConfig.sourceDir)}`],
        errors: []
      });
      expect(mockedGlob).not.toHaveBeenCalled();
    });

    it('should process files successfully with empty directory', async () => {
      mockedGlob.mockResolvedValue([]);

      const result = await contentLoader.loadContent();

      expect(result).toEqual({
        content: [],
        crossReferences: [],
        warnings: [],
        errors: []
      });
      expect(mockLinkResolver.setDiscoveredFiles).toHaveBeenCalledWith([]);
    });

    it('should handle multiple files correctly', async () => {
      const filePaths = [
        '/test/project/.cursor/rules/file1.mdc',
        '/test/project/.cursor/rules/modes/file2.mdc'
      ];
      
      mockedGlob.mockResolvedValue(filePaths);
      
      // Mock file contents
      mockedFs.readFileSync
        .mockReturnValueOnce('---\ntitle: File 1\n---\nContent 1')
        .mockReturnValueOnce('---\ntitle: File 2\n---\nContent 2');

      // Mock parser responses
      mockMetadataParser.parseWithNormalization
        .mockReturnValueOnce({
          metadata: { title: 'File 1' },
          content: 'Content 1'
        })
        .mockReturnValueOnce({
          metadata: { title: 'File 2' },
          content: 'Content 2'
        });

      // Mock link resolver responses
      mockLinkResolver.resolveLinks
        .mockReturnValueOnce({
          content: 'Content 1',
          crossReferences: []
        })
        .mockReturnValueOnce({
          content: 'Content 2',
          crossReferences: []
        });

      mockLinkResolver.generateWarnings.mockReturnValue([]);
      mockLinkResolver.getResolutionStats.mockReturnValue({
        total: 0,
        valid: 0,
        broken: 0,
        successRate: 100
      });

      const result = await contentLoader.loadContent();

      expect(result.content).toHaveLength(2);
      expect(result.content[0].filePath).toBe('file1.mdc');
      expect(result.content[0]).toHaveProperty('toc');
      expect(Array.isArray(result.content[0].toc)).toBe(true);
      expect(result.content[1].filePath).toBe('modes/file2.mdc');
      expect(result.content[1]).toHaveProperty('toc');
      expect(Array.isArray(result.content[1].toc)).toBe(true);
      expect(mockLinkResolver.setDiscoveredFiles).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ filePath: 'file1.mdc' }),
          expect.objectContaining({ filePath: 'modes/file2.mdc' })
        ])
      );
    });

    it('should handle errors that bubble up from file processing', async () => {
      const filePath = '/test/project/.cursor/rules/error.mdc';
      
      mockedGlob.mockResolvedValue([filePath]);
      
      // Mock the entire ContentLoader.processFile to throw an error
      // This simulates an error that would reach the main catch block
      const originalProcessFile = (contentLoader as any).processFile;
      (contentLoader as any).processFile = jest.fn().mockRejectedValue(new Error('Processing error'));

      const result = await contentLoader.loadContent();

      // This should reach the main catch block and add to errors array
      expect(result.content).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Error processing file');
      expect(result.errors[0]).toContain('Processing error');

      // Restore original method
      (contentLoader as any).processFile = originalProcessFile;
    });

    it('should handle glob discovery errors', async () => {
      mockedGlob.mockRejectedValue(new Error('Glob error'));

      const result = await contentLoader.loadContent();

      // Glob errors are caught by discoverMdcFiles and return empty array,
      // then processing continues normally with empty file list
      expect(result).toEqual({
        content: [],
        crossReferences: [],
        warnings: [],
        errors: []
      });
    });

    it('should include warnings from link resolver', async () => {
      const filePath = '/test/project/.cursor/rules/test.mdc';
      
      mockedGlob.mockResolvedValue([filePath]);
      mockedFs.readFileSync.mockReturnValue('# Test');
      mockMetadataParser.parseWithNormalization.mockReturnValue({
        metadata: {},
        content: '# Test'
      });
      
      const warning = 'Broken link warning';
      mockLinkResolver.resolveLinks.mockReturnValue({
        content: '# Test',
        crossReferences: []
      });
      mockLinkResolver.generateWarnings.mockReturnValue([warning]);

      const result = await contentLoader.loadContent();

      expect(result.warnings).toContain(warning);
    });

  });

  describe('title extraction', () => {
    it('should extract title from metadata', async () => {
      const filePath = '/test/project/.cursor/rules/test.mdc';
      
      mockedGlob.mockResolvedValue([filePath]);
      mockedFs.readFileSync.mockReturnValue('content');
      mockMetadataParser.parseWithNormalization.mockReturnValue({
        metadata: { title: 'Metadata Title' },
        content: '# Heading Title\nContent'
      });
      mockLinkResolver.resolveLinks.mockReturnValue({
        content: '# Heading Title\nContent',
        crossReferences: []
      });

      const result = await contentLoader.loadContent();

      expect(result.content[0].title).toBe('Metadata Title');
      expect(result.content[0]).toHaveProperty('toc');
      expect(Array.isArray(result.content[0].toc)).toBe(true);
    });

    it('should extract title from description when title is missing', async () => {
      const filePath = '/test/project/.cursor/rules/test.mdc';
      
      mockedGlob.mockResolvedValue([filePath]);
      mockedFs.readFileSync.mockReturnValue('content');
      mockMetadataParser.parseWithNormalization.mockReturnValue({
        metadata: { description: 'Description Title' },
        content: '# Heading Title\nContent'
      });
      mockLinkResolver.resolveLinks.mockReturnValue({
        content: '# Heading Title\nContent',
        crossReferences: []
      });

      const result = await contentLoader.loadContent();

      expect(result.content[0].title).toBe('Description Title');
    });

    it('should extract title from first heading when metadata is missing', async () => {
      const filePath = '/test/project/.cursor/rules/test.mdc';
      
      mockedGlob.mockResolvedValue([filePath]);
      mockedFs.readFileSync.mockReturnValue('content');
      mockMetadataParser.parseWithNormalization.mockReturnValue({
        metadata: {},
        content: '# Heading Title\nContent here'
      });
      mockLinkResolver.resolveLinks.mockReturnValue({
        content: '# Heading Title\nContent here',
        crossReferences: []
      });

      const result = await contentLoader.loadContent();

      expect(result.content[0].title).toBe('Heading Title');
    });

    it('should fallback to filename when no title sources available', async () => {
      const filePath = '/test/project/.cursor/rules/my-rule-file.mdc';
      
      mockedGlob.mockResolvedValue([filePath]);
      mockedFs.readFileSync.mockReturnValue('content');
      mockMetadataParser.parseWithNormalization.mockReturnValue({
        metadata: {},
        content: 'Content without heading'
      });
      mockLinkResolver.resolveLinks.mockReturnValue({
        content: 'Content without heading',
        crossReferences: []
      });

      const result = await contentLoader.loadContent();

      expect(result.content[0].title).toBe('My Rule File');
    });

    it('should handle non-string metadata values', async () => {
      const filePath = '/test/project/.cursor/rules/test.mdc';
      
      mockedGlob.mockResolvedValue([filePath]);
      mockedFs.readFileSync.mockReturnValue('content');
      mockMetadataParser.parseWithNormalization.mockReturnValue({
        metadata: { title: 123, description: false },
        content: 'Content without heading'
      });
      mockLinkResolver.resolveLinks.mockReturnValue({
        content: 'Content without heading',
        crossReferences: []
      });

      const result = await contentLoader.loadContent();

      expect(result.content[0].title).toBe('Test');
    });
  });

  describe('permalink generation', () => {
    it('should generate correct permalink for root file', async () => {
      const filePath = '/test/project/.cursor/rules/main.mdc';
      
      mockedGlob.mockResolvedValue([filePath]);
      mockedFs.readFileSync.mockReturnValue('# Test');
      mockMetadataParser.parseWithNormalization.mockReturnValue({
        metadata: {},
        content: '# Test'
      });
      mockLinkResolver.resolveLinks.mockReturnValue({
        content: '# Test',
        crossReferences: []
      });

      const result = await contentLoader.loadContent();

      expect(result.content[0].permalink).toBe('/docs/rules/main');
    });

    it('should generate correct permalink for nested file', async () => {
      const filePath = '/test/project/.cursor/rules/modes/implement.mdc';
      
      mockedGlob.mockResolvedValue([filePath]);
      mockedFs.readFileSync.mockReturnValue('# Test');
      mockMetadataParser.parseWithNormalization.mockReturnValue({
        metadata: {},
        content: '# Test'
      });
      mockLinkResolver.resolveLinks.mockReturnValue({
        content: '# Test',
        crossReferences: []
      });

      const result = await contentLoader.loadContent();

      expect(result.content[0].permalink).toBe('/docs/rules/modes/implement');
    });

    it('should handle Windows path separators', async () => {
      const filePath = '/test/project/.cursor/rules/modes\\windows-file.mdc';
      
      mockedGlob.mockResolvedValue([filePath]);
      mockedFs.readFileSync.mockReturnValue('# Test');
      mockMetadataParser.parseWithNormalization.mockReturnValue({
        metadata: {},
        content: '# Test'
      });
      mockLinkResolver.resolveLinks.mockReturnValue({
        content: '# Test',
        crossReferences: []
      });

      const result = await contentLoader.loadContent();

      expect(result.content[0].permalink).toBe('/docs/rules/modes/windows-file');
    });
  });

  describe('integration scenarios', () => {

    it('should handle mixed success and failure scenarios', async () => {
      const filePaths = [
        '/test/project/.cursor/rules/good.mdc',
        '/test/project/.cursor/rules/bad.mdc'
      ];
      
      mockedGlob.mockResolvedValue(filePaths);
      
      // First file succeeds
      mockedFs.readFileSync
        .mockReturnValueOnce('# Good file')
        .mockImplementationOnce(() => {
          throw new Error('Bad file error');
        });

      mockMetadataParser.parseWithNormalization.mockReturnValue({
        metadata: {},
        content: '# Good file'
      });

      mockLinkResolver.resolveLinks.mockReturnValue({
        content: '# Good file',
        crossReferences: []
      });

      const result = await contentLoader.loadContent();

      // Only the good file is processed, bad file returns null from processFile
      expect(result.content).toHaveLength(1);
      expect(result.content[0].filePath).toBe('good.mdc');
      expect(result.errors).toHaveLength(0); // No errors in the main error array
    });

    it('should log discovery and resolution statistics', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const filePath = '/test/project/.cursor/rules/test.mdc';
      
      mockedGlob.mockResolvedValue([filePath]);
      mockedFs.readFileSync.mockReturnValue('# Test');
      mockMetadataParser.parseWithNormalization.mockReturnValue({
        metadata: {},
        content: '# Test'
      });
      mockLinkResolver.resolveLinks.mockReturnValue({
        content: '# Test',
        crossReferences: []
      });
      mockLinkResolver.getResolutionStats.mockReturnValue({
        total: 5,
        valid: 3,
        broken: 2,
        successRate: 60
      });

      await contentLoader.loadContent();

      expect(consoleSpy).toHaveBeenCalledWith('Found 1 .mdc files in /test/project/.cursor/rules');
      expect(consoleSpy).toHaveBeenCalledWith('Cross-reference resolution: 3/5 resolved (60%)');
      
      consoleSpy.mockRestore();
    });
  });

  describe('processMarkdown', () => {
    it('should convert markdown to HTML using remark/rehype pipeline', async () => {
      // Access the private method through type assertion
      const processMarkdown = (contentLoader as any).processMarkdown.bind(contentLoader);

      const markdownContent = `# Test Heading

This is a **bold** text and _italic_ text.

\`\`\`javascript
console.log('Hello, world!');
\`\`\`

- List item 1
- List item 2

[Link example](https://example.com)`;

      const result = await processMarkdown(markdownContent);

      // Verify that the result is HTML (mocked response)
      expect(result).toContain('<h1 id="test-heading">Test Heading</h1>');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('console.log(\'Hello, world!\');');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>List item 1</li>');
      expect(result).toContain('<li>List item 2</li>');
      expect(result).toContain('<a href="https://example.com">Link example</a>');

      // Verify unified was called correctly
      const { unified } = require('unified');
      expect(unified).toHaveBeenCalled();
    });

    it('should handle empty markdown content', async () => {
      const processMarkdown = (contentLoader as any).processMarkdown.bind(contentLoader);

      const result = await processMarkdown('');

      // Should return the mocked HTML result
      expect(typeof result).toBe('string');
      expect(result.length > 0).toBe(true);
    });

    it('should handle errors gracefully and return fallback HTML', async () => {
      const processMarkdown = (contentLoader as any).processMarkdown.bind(contentLoader);
      
      // Mock console.error to avoid error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock unified to throw an error
      const { unified } = require('unified');
      unified.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const malformedContent = 'Some content';
      
      const result = await processMarkdown(malformedContent);

      // Should return fallback HTML (wrapped in pre tags)
      expect(result).toBe('<pre>Some content</pre>');
      expect(consoleSpy).toHaveBeenCalledWith('Error processing markdown content:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});