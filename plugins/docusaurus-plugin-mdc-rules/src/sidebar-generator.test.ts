import { SidebarGenerator } from './sidebar-generator';
import { RuleContent } from './types';

describe('SidebarGenerator', () => {
  const mockRules: RuleContent[] = [
    {
      filePath: 'main.mdc',
      title: 'Main Rule',
      content: '',
      metadata: { sidebarPosition: 1 },
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
      metadata: { sidebarPosition: 2 },
      permalink: '/rules/modes/plan'
    },
    {
      filePath: 'modes/doc.mdc',
      title: 'Doc Mode',
      content: '',
      metadata: {},
      permalink: '/rules/modes/doc'
    },
    {
      filePath: 'task-levels.mdc',
      title: 'Task Levels',
      content: '',
      metadata: {},
      permalink: '/rules/task-levels'
    }
  ];

  it('should generate correct sidebar structure', () => {
    const generator = new SidebarGenerator();
    const result = generator.generateSidebar(mockRules);

    expect(result).toHaveProperty('rules');
    expect(Array.isArray(result.rules)).toBe(true);

    // Should have at least the main rule and modes category
    expect(result.rules.length).toBeGreaterThan(1);
  });

  it('should group rules by directory structure', () => {
    const generator = new SidebarGenerator();
    const result = generator.generateSidebar(mockRules);

    // Check if there are any categories
    const categories = result.rules.filter(item => item.type === 'category');
    expect(categories.length).toBeGreaterThan(0);
  });

  it('should handle single-level rules correctly', () => {
    const generator = new SidebarGenerator();
    const result = generator.generateSidebar(mockRules);

    // Find direct rules (not in categories)
    const directRules = result.rules.filter(item => item.type === 'doc');

    expect(directRules.length).toBeGreaterThan(0);

    // Should include main and task-levels
    const ruleIds = directRules.map(rule => rule.id);
    expect(ruleIds).toContain('main');
    expect(ruleIds).toContain('task-levels');
  });

  it('should preserve custom sidebar positions', () => {
    const generator = new SidebarGenerator();
    const result = generator.generateSidebar(mockRules);

    // Find main rule which has position 1
    const mainRule = result.rules.find(item => item.id === 'main');
    expect(mainRule?.position).toBe(1);
  });

  it('should create proper rule IDs from file paths', () => {
    const generator = new SidebarGenerator();
    const result = generator.generateSidebar(mockRules);

    // Flatten all items to check IDs
    const allItems: any[] = [];
    const collectItems = (items: any[]) => {
      for (const item of items) {
        if (item.type === 'doc') {
          allItems.push(item);
        } else if (item.items) {
          collectItems(item.items);
        }
      }
    };

    collectItems(result.rules);

    const ids = allItems.map(item => item.id);
    expect(ids).toContain('main');
    expect(ids).toContain('modes/implement');
    expect(ids).toContain('modes/plan');
    expect(ids).toContain('modes/doc');
    expect(ids).toContain('task-levels');
  });

  it('should handle empty rules array', () => {
    const generator = new SidebarGenerator();
    const result = generator.generateSidebar([]);

    expect(result).toEqual({ rules: [] });
  });

  it('should handle rules with missing metadata', () => {
    const generator = new SidebarGenerator();
    const ruleWithoutMetadata: RuleContent = {
      filePath: 'test.mdc',
      title: 'Test Rule',
      content: '',
      metadata: {},
      permalink: '/rules/test'
    };

    const result = generator.generateSidebar([ruleWithoutMetadata]);

    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].type).toBe('doc');
    expect(result.rules[0].id).toBe('test');
  });

  it('should handle malformed file paths', () => {
    const generator = new SidebarGenerator();
    const ruleWithBadPath: RuleContent = {
      filePath: '',
      title: 'Bad Path Rule',
      content: '',
      metadata: {},
      permalink: '/rules/'
    };

    // Should not crash
    expect(() => generator.generateSidebar([ruleWithBadPath])).not.toThrow();
  });
}); 