import { LinkResolver } from './link-resolver';
import { InternalPluginConfig, RuleContent } from './types';

describe('LinkResolver', () => {
  const mockConfig: InternalPluginConfig = {
    sourceDir: '.cursor/rules',
    targetPath: 'rules',
    includeMetadata: true,
    crossReferenceBase: '/rules',
    mainRule: 'main',
    component: '@site/src/components/RulePage/index.tsx'
  };

  const mockFiles: RuleContent[] = [
    {
      id: 'main',
      filePath: 'main.mdc',
      title: 'Main Rule',
      content: '',
      metadata: {},
      permalink: '/rules/main',
      toc: []
    },
    {
      id: 'modes/implement',
      filePath: 'modes/implement.mdc',
      title: 'Implement Mode',
      content: '',
      metadata: {},
      permalink: '/rules/modes/implement',
      toc: []
    },
    {
      id: 'modes/plan',
      filePath: 'modes/plan.mdc',
      title: 'Plan Mode',
      content: '',
      metadata: {},
      permalink: '/rules/modes/plan',
      toc: []
    },
    {
      id: 'adr-structure',
      filePath: 'adr-structure.mdc',
      title: 'ADR Structure',
      content: '',
      metadata: {},
      permalink: '/rules/adr-structure',
      toc: []
    }
  ];

  beforeEach(() => {
    // Clear console.error spy between tests
    jest.clearAllMocks();
  });

  describe('resolveLinks', () => {
    it('should resolve relative .mdc links correctly', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockFiles);

      const content = 'See <a href="./main.mdc">main rule</a> and <a href="./modes/implement.mdc">implement mode</a>.';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.content).toContain('<a href="/rules/main">main rule</a>');
      expect(result.content).toContain('<a href="/rules/modes/implement">implement mode</a>');
    });

    it('should resolve project root links correctly', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockFiles);

      const content = 'See <a href=".cursor/rules/main.mdc">main rule</a>';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.content).toContain('<a href="/rules/main">main rule</a>');
    });

    it('should detect cross-references correctly', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockFiles);

      const content = 'Links: ./main.mdc and ./modes/implement.mdc and ./nonexistent.mdc';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.crossReferences).toHaveLength(3);
      expect(result.crossReferences[0]).toEqual({
        original: './main.mdc',
        resolved: '/rules/main',
        isValid: true
      });
      expect(result.crossReferences[1]).toEqual({
        original: './modes/implement.mdc',
        resolved: '/rules/modes/implement',
        isValid: true
      });
      expect(result.crossReferences[2]).toEqual({
        original: './nonexistent.mdc',
        resolved: '/rules/nonexistent',
        isValid: false
      });
    });

    it('should not modify non-.mdc links', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockFiles);

      const content = 'External link: <a href="https://google.com">Google</a> and <a href="./file.txt">relative</a>';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.content).toBe(content);
      expect(result.crossReferences).toHaveLength(0);
    });

    it('should handle multiple links in one content block', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockFiles);

      const content = `
        Multiple links:
        - ./main.mdc
        - ./modes\\plan.mdc  
        - ./.cursor/rules/adr-structure.mdc
        - ./nonexistent.mdc
      `;
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.crossReferences).toHaveLength(4);
      expect(result.crossReferences.filter(ref => ref.isValid)).toHaveLength(3);
      expect(result.crossReferences.filter(ref => !ref.isValid)).toHaveLength(1);
    });

    it('should resolve mdc: scheme links correctly', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockFiles);

      const content = 'See <a href="mdc:.cursor/rules/modes/implement.mdc">init mode</a> and <a href="mdc:.cursor/rules/adr-structure.mdc">ADR structure</a>.';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.content).toContain('<a href="/rules/modes/implement">init mode</a>');
      expect(result.content).toContain('<a href="/rules/adr-structure">ADR structure</a>');
      expect(result.crossReferences).toHaveLength(2);
      expect(result.crossReferences[0].original).toBe('mdc:.cursor/rules/modes/implement.mdc');
      expect(result.crossReferences[0].resolved).toBe('/rules/modes/implement');
      expect(result.crossReferences[0].isValid).toBe(true);
    });

    it('should handle mixed link formats correctly', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockFiles);

      const content = `
        Mixed links:
        - ./main.mdc
        - mdc:.cursor/rules/modes/implement.mdc
        - <a href=".cursor/rules/adr-structure.mdc">legacy</a>
        - <a href="mdc:.cursor/rules/modes/plan.mdc">new format</a>
      `;
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.crossReferences).toHaveLength(4);
      expect(result.crossReferences.filter(ref => ref.isValid)).toHaveLength(4);
      
      // Check that mdc: links are properly resolved
      const mdcLinks = result.crossReferences.filter(ref => ref.original.startsWith('mdc:'));
      expect(mdcLinks).toHaveLength(2);
      expect(mdcLinks[0].resolved).toBe('/rules/modes/implement');
      expect(mdcLinks[1].resolved).toBe('/rules/modes/plan');
    });
  });

  describe('generateWarnings', () => {

    it('should handle invalid cross-references gracefully', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles([]);

      const content = 'Invalid link: ./nonexistent.mdc';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.crossReferences).toHaveLength(1);
      expect(result.crossReferences[0].isValid).toBe(false);
      expect(result.crossReferences[0].original).toBe('./nonexistent.mdc');
    });

    it('should generate helpful warnings for broken links', () => {
      const linkResolver = new LinkResolver(mockConfig);
      const mockFiles: RuleContent[] = [
        {
          id: 'main',
          filePath: 'main.mdc',
          title: 'Main Rule',
          content: '',
          metadata: {},
          permalink: '/rules/main',
          toc: []
        }
      ];
      linkResolver.setDiscoveredFiles(mockFiles);

      const brokenCrossRefs = [
        { original: './broken.mdc', resolved: '/rules/broken', isValid: false }
      ];

      const warnings = linkResolver.generateWarnings(brokenCrossRefs, 'test.mdc');

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('Broken cross-reference');
      expect(warnings[0]).toContain('test.mdc');
      expect(warnings[0]).toContain('./broken.mdc');
    });

    it('should provide suggestions for similar files', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles([
        {
          id: 'implement',
          filePath: 'implement.mdc',
          title: 'Implement',
          content: '',
          metadata: {},
          permalink: '/rules/implement',
          toc: []
        },
        {
          id: 'implementation-guide',
          filePath: 'implementation-guide.mdc',
          title: 'Implementation Guide',
          content: '',
          metadata: {},
          permalink: '/rules/implementation-guide',
          toc: []
        }
      ]);

      const brokenCrossRefs = [
        { original: './implem.mdc', resolved: '/rules/implem', isValid: false }
      ];

      const warnings = linkResolver.generateWarnings(brokenCrossRefs, 'test.mdc');

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('Suggestions:');
      expect(warnings[0]).toContain('./implement.mdc');
    });

    it('should limit available files display to 5 with overflow indicator', () => {
      const linkResolver = new LinkResolver(mockConfig);
      const manyRules: RuleContent[] = Array.from({ length: 8 }, (_, i) => ({
        id: `rule${i}`,
        filePath: `rule${i}.mdc`,
        title: `Rule ${i}`,
        content: '',
        metadata: {},
        permalink: `/rules/rule${i}`,
        toc: []
      }));
      linkResolver.setDiscoveredFiles(manyRules);

      const brokenCrossRefs = [
        { original: './nonexistent.mdc', resolved: '/rules/nonexistent', isValid: false }
      ];

      const warnings = linkResolver.generateWarnings(brokenCrossRefs, 'test.mdc');

      expect(warnings[0]).toContain('(and 3 more)');
    });

    it('should handle empty content', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles([]);

      const result = linkResolver.resolveLinks('', 'test.mdc');

      expect(result.content).toBe('');
      expect(result.crossReferences).toHaveLength(0);
    });

    it('should return empty warnings for valid cross-references', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockFiles);

      const validCrossRefs = [
        { original: './main.mdc', resolved: '/rules/main', isValid: true }
      ];

      const warnings = linkResolver.generateWarnings(validCrossRefs, 'test.mdc');

      expect(warnings).toHaveLength(0);
    });
  });

  describe('getResolutionStats', () => {
    it('should calculate statistics correctly for mixed results', () => {
      const linkResolver = new LinkResolver(mockConfig);
      
      const crossReferences = [
        { original: './main.mdc', resolved: '/rules/main', isValid: true },
        { original: './valid.mdc', resolved: '/rules/valid', isValid: true },
        { original: './broken1.mdc', resolved: '/rules/broken1', isValid: false },
        { original: './broken2.mdc', resolved: '/rules/broken2', isValid: false }
      ];

      const stats = linkResolver.getResolutionStats(crossReferences);

      expect(stats).toEqual({
        total: 4,
        valid: 2,
        broken: 2,
        successRate: 50
      });
    });

    it('should handle empty cross-references', () => {
      const linkResolver = new LinkResolver(mockConfig);
      
      const stats = linkResolver.getResolutionStats([]);

      expect(stats).toEqual({
        total: 0,
        valid: 0,
        broken: 0,
        successRate: 100 // Should return 100% for empty array
      });
    });

    it('should handle all valid cross-references', () => {
      const linkResolver = new LinkResolver(mockConfig);
      
      const crossReferences = [
        { original: './main.mdc', resolved: '/rules/main', isValid: true },
        { original: './valid.mdc', resolved: '/rules/valid', isValid: true }
      ];

      const stats = linkResolver.getResolutionStats(crossReferences);

      expect(stats).toEqual({
        total: 2,
        valid: 2,
        broken: 0,
        successRate: 100
      });
    });

    it('should handle all invalid cross-references', () => {
      const linkResolver = new LinkResolver(mockConfig);
      
      const crossReferences = [
        { original: './broken1.mdc', resolved: '/rules/broken1', isValid: false },
        { original: './broken2.mdc', resolved: '/rules/broken2', isValid: false }
      ];

      const stats = linkResolver.getResolutionStats(crossReferences);

      expect(stats).toEqual({
        total: 2,
        valid: 0,
        broken: 2,
        successRate: 0
      });
    });

    it('should round success rate correctly', () => {
      const linkResolver = new LinkResolver(mockConfig);
      
      const crossReferences = [
        { original: './valid1.mdc', resolved: '/rules/valid1', isValid: true },
        { original: './valid2.mdc', resolved: '/rules/valid2', isValid: true },
        { original: './broken.mdc', resolved: '/rules/broken', isValid: false }
      ];

      const stats = linkResolver.getResolutionStats(crossReferences);

      expect(stats).toEqual({
        total: 3,
        valid: 2,
        broken: 1,
        successRate: 66.67 // (2/3) * 100 = 66.666... rounded to 66.67
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle content with no .mdc links', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockFiles);

      const content = 'This content has no .mdc links at all.';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.content).toBe(content);
      expect(result.crossReferences).toHaveLength(0);
    });

    it('should handle malformed .mdc patterns', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockFiles);

      const content = 'Malformed: .mdc and file.mdc and ./.mdc';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.crossReferences).toHaveLength(0);
    });

    it('should handle content with only whitespace', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockFiles);

      const content = '   \n\t  \r\n  ';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.content).toBe(content);
      expect(result.crossReferences).toHaveLength(0);
    });

    it('should handle extremely long file paths', () => {
      const linkResolver = new LinkResolver(mockConfig);
      const longPath = 'very/deep/nested/directory/structure/that/goes/on/for/a/very/long/time/file.mdc';
      linkResolver.setDiscoveredFiles([
        {
          id: longPath,
          filePath: longPath,
          title: 'Long Path File',
          content: '',
          metadata: {},
          permalink: `/rules/${longPath.replace('.mdc', '')}`,
          toc: []
        }
      ]);

      const content = `Link: ./${longPath}`;
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.crossReferences).toHaveLength(1);
      expect(result.crossReferences[0].isValid).toBe(true);
    });

    it('should handle special characters in file paths', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles([
        {
          id: 'special-chars_file@test',
          filePath: 'special-chars_file@test.mdc',
          title: 'Special Chars File',
          content: '',
          metadata: {},
          permalink: '/rules/special-chars_file@test',
          toc: []
        }
      ]);

      const content = 'Link: ./special-chars_file@test.mdc';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.crossReferences).toHaveLength(1);
      expect(result.crossReferences[0].isValid).toBe(true);
    });
  });
}); 