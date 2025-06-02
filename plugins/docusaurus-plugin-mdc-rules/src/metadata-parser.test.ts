import { MetadataParser } from './metadata-parser';

describe('MetadataParser', () => {
  let parser: MetadataParser;

  beforeEach(() => {
    parser = new MetadataParser();
  });

  describe('parseMetadata', () => {
    it('should return empty metadata and full content when no metadata block exists', () => {
      const content = 'This is just regular content without metadata';
      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({});
      expect(result.content).toBe(content);
    });

    it('should return empty metadata when content starts with --- but has no closing ---', () => {
      const content = '---\ntitle: Test\ndescription: A test file';
      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({});
      expect(result.content).toBe(content);
    });

    it('should parse simple key-value pairs', () => {
      const content = `---
title: Test Title
description: A test description
author: John Doe
---
This is the main content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        title: 'Test Title',
        description: 'A test description',
        author: 'John Doe'
      });
      expect(result.content).toBe('This is the main content');
    });

    it('should handle empty values', () => {
      const content = `---
title: Test Title
description:
author: 
---
Content here`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        title: 'Test Title',
        description: '',
        author: ''
      });
      expect(result.content).toBe('Content here');
    });

    it('should handle quoted strings', () => {
      const content = `---
title: "Quoted Title"
description: 'Single quoted description'
mixed: "With: colon inside"
---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        title: 'Quoted Title',
        description: 'Single quoted description',
        mixed: 'With: colon inside'
      });
    });

    it('should handle boolean values', () => {
      const content = `---
published: true
draft: false
enabled: TRUE
disabled: FALSE
---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        published: true,
        draft: false,
        enabled: true,
        disabled: false
      });
    });

    it('should handle null values', () => {
      const content = `---
nullValue: null
tildaValue: ~
emptyValue:
---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        nullValue: null,
        tildaValue: null,
        emptyValue: ''
      });
    });

    it('should handle integer values', () => {
      const content = `---
count: 42
negativeNumber: -17
zero: 0
---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        count: 42,
        negativeNumber: -17,
        zero: 0
      });
    });

    it('should handle float values', () => {
      const content = `---
pi: 3.14159
negative: -2.5
percentage: 0.95
---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        pi: 3.14159,
        negative: -2.5,
        percentage: 0.95
      });
    });

    it('should handle simple comma-separated arrays', () => {
      const content = `---
tags: javascript,typescript,react
categories: web,frontend
---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        tags: ['javascript', 'typescript', 'react'],
        categories: ['web', 'frontend']
      });
    });

    it('should not treat comma-separated values with spaces as arrays', () => {
      const content = `---
description: This is a description, with commas
sentence: Hello, world and universe
---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        description: 'This is a description, with commas',
        sentence: 'Hello, world and universe'
      });
    });

    it('should skip empty lines in metadata', () => {
      const content = `---
title: Test

description: Test description

author: John
---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        title: 'Test',
        description: 'Test description',
        author: 'John'
      });
    });

    it('should handle lines without colons by skipping them', () => {
      const content = `---
title: Test
This line has no colon
description: Test description
Another line without colon
---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        title: 'Test',
        description: 'Test description'
      });
    });

    it('should trim whitespace from content', () => {
      const content = `---
title: Test
---


   Content with leading/trailing whitespace   


`;

      const result = parser.parseMetadata(content);

      expect(result.content).toBe('Content with leading/trailing whitespace');
    });

    it('should handle empty metadata block', () => {
      const content = `---
---
Content only`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({});
      expect(result.content).toBe('Content only');
    });

    it('should handle metadata block with only empty lines', () => {
      const content = `---


---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({});
      expect(result.content).toBe('Content');
    });
  });

  describe('parseWithNormalization', () => {
    it('should normalize globs field to array when string', () => {
      const content = `---
globs: "*.ts"
title: Test
---
Content`;

      const result = parser.parseWithNormalization(content);

      expect(result.metadata).toEqual({
        globs: ['*.ts'],
        title: 'Test',
        alwaysApply: false
      });
    });

    it('should normalize empty globs field to empty array', () => {
      const content = `---
globs:
title: Test
---
Content`;

      const result = parser.parseWithNormalization(content);

      expect(result.metadata).toEqual({
        globs: [],
        title: 'Test',
        alwaysApply: false
      });
    });

    it('should default globs to empty array when not specified', () => {
      const content = `---
title: Test
---
Content`;

      const result = parser.parseWithNormalization(content);

      expect(result.metadata).toEqual({
        title: 'Test',
        globs: [],
        alwaysApply: false
      });
    });

    it('should normalize alwaysApply string to boolean', () => {
      const content = `---
alwaysApply: "true"
title: Test
---
Content`;

      const result = parser.parseWithNormalization(content);

      expect(result.metadata).toEqual({
        alwaysApply: true,
        title: 'Test',
        globs: []
      });
    });

    it('should normalize alwaysApply false string to boolean', () => {
      const content = `---
alwaysApply: "false"
title: Test
---
Content`;

      const result = parser.parseWithNormalization(content);

      expect(result.metadata).toEqual({
        alwaysApply: false,
        title: 'Test',
        globs: []
      });
    });

    it('should default alwaysApply to false when not specified', () => {
      const content = `---
title: Test
---
Content`;

      const result = parser.parseWithNormalization(content);

      expect(result.metadata).toEqual({
        title: 'Test',
        globs: [],
        alwaysApply: false
      });
    });

    it('should preserve existing boolean alwaysApply value', () => {
      const content = `---
alwaysApply: true
title: Test
---
Content`;

      const result = parser.parseWithNormalization(content);

      expect(result.metadata).toEqual({
        alwaysApply: true,
        title: 'Test',
        globs: []
      });
    });

    it('should remove null and undefined values', () => {
      const content = `---
title: Test
nullField: null
emptyField:
validField: value
---
Content`;

      const result = parser.parseWithNormalization(content);

      // nullField should be removed, emptyField should be kept as empty string
      expect(result.metadata).toEqual({
        title: 'Test',
        emptyField: '',
        validField: 'value',
        globs: [],
        alwaysApply: false
      });
    });

    it('should handle complex normalization scenario', () => {
      const content = `---
title: Complex Test
globs: "*.js"
alwaysApply: "true"
tags: react,vue,angular
description: A complex test case
nullValue: null
---
# Main Content
This is the main content.`;

      const result = parser.parseWithNormalization(content);

      expect(result.metadata).toEqual({
        title: 'Complex Test',
        globs: ['*.js'],
        alwaysApply: true,
        tags: ['react', 'vue', 'angular'],
        description: 'A complex test case'
      });
      expect(result.content).toBe('# Main Content\nThis is the main content.');
    });

    it('should handle content with no metadata block', () => {
      const content = 'Just plain content without any metadata';

      const result = parser.parseWithNormalization(content);

      expect(result.metadata).toEqual({
        globs: [],
        alwaysApply: false
      });
      expect(result.content).toBe(content);
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const result = parser.parseMetadata('');

      expect(result.metadata).toEqual({});
      expect(result.content).toBe('');
    });

    it('should handle whitespace-only content', () => {
      const result = parser.parseMetadata('   \n  \t  \n  ');

      expect(result.metadata).toEqual({});
      expect(result.content).toBe('');
    });

    it('should handle content with only opening metadata delimiter', () => {
      const content = '---';
      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({});
      expect(result.content).toBe(content);
    });

    it('should handle malformed key-value pairs gracefully', () => {
      const content = `---
normalKey: normalValue
: valueWithoutKey
keyWithoutValue:
anotherNormal: value
---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        normalKey: 'normalValue',
        keyWithoutValue: '',
        anotherNormal: 'value'
      });
    });

    it('should handle keys with special characters', () => {
      const content = `---
key-with-dashes: value1
key_with_underscores: value2
key.with.dots: value3
key123: value4
---
Content`;

      const result = parser.parseMetadata(content);

      expect(result.metadata).toEqual({
        'key-with-dashes': 'value1',
        'key_with_underscores': 'value2',
        'key.with.dots': 'value3',
        'key123': 'value4'
      });
    });
  });
});
