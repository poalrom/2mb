import { SidebarGenerator } from './sidebar-generator';
import { RuleContent } from './types';

describe('SidebarGenerator', () => {
  const mockRules: RuleContent[] = [
    {
      id: 'main',
      filePath: 'main.mdc',
      title: 'Main Rule',
      content: '',
      metadata: { sidebarPosition: 1 },
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
      metadata: { sidebarPosition: 2 },
      permalink: '/rules/modes/plan',
      toc: []
    },
    {
      id: 'modes/doc',
      filePath: 'modes/doc.mdc',
      title: 'Doc Mode',
      content: '',
      metadata: {},
      permalink: '/rules/modes/doc',
      toc: []
    },
    {
      id: 'task-levels',
      filePath: 'task-levels.mdc',
      title: 'Task Levels',
      content: '',
      metadata: {},
      permalink: '/rules/task-levels',
      toc: []
    }
  ];

  it('should generate correct sidebar structure', () => {
    const generator = new SidebarGenerator();
    const result = generator.generateSidebar(mockRules);

    expect(Array.isArray(result)).toBe(true);

    // Should have at least the main rule and modes category
    expect(result.length).toBeGreaterThan(1);
  });

  it('should group rules by directory structure', () => {
    const generator = new SidebarGenerator();
    const result = generator.generateSidebar(mockRules);

    // Check if there are any categories
    const categories = result.filter(item => item.type === 'category');
    expect(categories.length).toBeGreaterThan(0);
  });

  it('should handle single-level rules correctly', () => {
    const generator = new SidebarGenerator();
    const result = generator.generateSidebar(mockRules);

    // Find direct rules (not in categories)
    const directRules = result.filter(item => item.type === 'link');

    expect(directRules.length).toBeGreaterThan(0);

    // Should include main and task-levels
    const ruleLabels = directRules.map(rule => rule.label);
    expect(ruleLabels).toContain('Main Rule');
    expect(ruleLabels).toContain('Task Levels');
  });

  it('should preserve custom sidebar positions', () => {
    const generator = new SidebarGenerator();
    const result = generator.generateSidebar(mockRules);

    // Find main rule which has position 1
    const mainRule = result.find(item => item.label === 'Main Rule');
    expect(mainRule?.position).toBe(1);
  });

  it('should handle empty rules array', () => {
    const generator = new SidebarGenerator();
    const result = generator.generateSidebar([]);

    expect(result).toEqual([]);
  });

  it('should handle rules with missing metadata', () => {
    const generator = new SidebarGenerator();
    const ruleWithoutMetadata: RuleContent = {
      id: 'test',
      filePath: 'test.mdc',
      title: 'Test Rule',
      content: '',
      metadata: {},
      permalink: '/rules/test',
      toc: []
    };

    const result = generator.generateSidebar([ruleWithoutMetadata]);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('link');
    expect(result[0].href).toBe('/rules/test');
  });

  it('should handle malformed file paths', () => {
    const generator = new SidebarGenerator();
    const ruleWithBadPath: RuleContent = {
      id: 'bad-path',
      filePath: '',
      title: 'Bad Path Rule',
      content: '',
      metadata: {},
      permalink: '/rules/',
      toc: []
    };

    // Should not crash
    expect(() => generator.generateSidebar([ruleWithBadPath])).not.toThrow();
  });
}); 