import { LinkResolver } from './link-resolver';
import { PluginConfig, RuleContent } from './types';

describe('LinkResolver', () => {
  const mockConfig: PluginConfig = {
    sourceDir: '.cursor/rules',
    targetPath: 'rules',
    includeMetadata: true,
    crossReferenceBase: '/rules',
    mainRule: 'main',
    component: '@site/src/components/RulePage/index.tsx'
  };

  const mockRules: RuleContent[] = [
    {
      filePath: 'main.mdc',
      title: 'Main Rule',
      content: '',
      metadata: {},
      permalink: '/rules/main'
    },
    {
      filePath: 'modes/implement.mdc',
      title: 'Implement Mode',
      content: '',
      metadata: {},
      permalink: '/rules/modes/implement'
    },
    {
      filePath: 'modes/plan.mdc',
      title: 'Plan Mode',
      content: '',
      metadata: {},
      permalink: '/rules/modes/plan'
    },
    {
      filePath: 'adr-structure.mdc',
      title: 'ADR Structure',
      content: '',
      metadata: {},
      permalink: '/rules/adr-structure'
    }
  ];

  beforeEach(() => {
    // Clear console.error spy between tests
    jest.clearAllMocks();
  });

  describe('resolveLinks', () => {
    it('should resolve relative .mdc links correctly', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockRules);

      const content = 'See [main rule](./main.mdc) and [implement mode](./modes/implement.mdc).';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.content).toContain('[main rule](/rules/main)');
      expect(result.content).toContain('[implement mode](/rules/modes/implement)');
    });

    it('should detect cross-references correctly', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockRules);

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
      linkResolver.setDiscoveredFiles(mockRules);

      const content = 'External link: [Google](https://google.com) and [relative](./file.txt)';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.content).toBe(content);
      expect(result.crossReferences).toHaveLength(0);
    });

    it('should handle multiple links in one content block', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockRules);

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
      const mockRules: RuleContent[] = [
        {
          filePath: 'main.mdc',
          title: 'Main Rule',
          content: '',
          metadata: {},
          permalink: '/rules/main'
        }
      ];
      linkResolver.setDiscoveredFiles(mockRules);

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
          filePath: 'implement.mdc',
          title: 'Implement',
          content: '',
          metadata: {},
          permalink: '/rules/implement'
        },
        {
          filePath: 'implementation-guide.mdc',
          title: 'Implementation Guide',
          content: '',
          metadata: {},
          permalink: '/rules/implementation-guide'
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
        filePath: `rule${i}.mdc`,
        title: `Rule ${i}`,
        content: '',
        metadata: {},
        permalink: `/rules/rule${i}`
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
      linkResolver.setDiscoveredFiles(mockRules);

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
      linkResolver.setDiscoveredFiles(mockRules);

      const content = 'This content has no .mdc links at all.';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.content).toBe(content);
      expect(result.crossReferences).toHaveLength(0);
    });

    it('should handle malformed .mdc patterns', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockRules);

      const content = 'Malformed: .mdc and file.mdc and ./.mdc';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.crossReferences).toHaveLength(0);
    });

    it('should handle content with only whitespace', () => {
      const linkResolver = new LinkResolver(mockConfig);
      linkResolver.setDiscoveredFiles(mockRules);

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
          filePath: longPath,
          title: 'Long Path File',
          content: '',
          metadata: {},
          permalink: `/rules/${longPath.replace('.mdc', '')}`
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
          filePath: 'special-chars_file@test.mdc',
          title: 'Special Chars File',
          content: '',
          metadata: {},
          permalink: '/rules/special-chars_file@test'
        }
      ]);

      const content = 'Link: ./special-chars_file@test.mdc';
      const result = linkResolver.resolveLinks(content, 'test.mdc');

      expect(result.crossReferences).toHaveLength(1);
      expect(result.crossReferences[0].isValid).toBe(true);
    });
  });
}); 