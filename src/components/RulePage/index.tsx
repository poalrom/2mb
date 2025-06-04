import { TOCItem } from '@docusaurus/mdx-loader';
import { DocsSidebarProvider } from '@docusaurus/plugin-content-docs/client';
import { Redirect } from '@docusaurus/router';
import { usePluginData } from '@docusaurus/useGlobalData';
import { PluginData, RulePageProps } from '@site/plugins/docusaurus-plugin-mdc-rules/src/types';
import DocRootLayout from '@theme/DocRoot/Layout';
import Layout from '@theme/Layout';
import Mermaid from '@theme/Mermaid';
import TOC from '@theme/TOC';
import TOCCollapsible from '@theme/TOCCollapsible';
import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.css';

// Helper function to extract TOC from markdown content
function extractTOC(content: string): TOCItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: Array<{
    value: string;
    id: string;
    level: number;
  }> = [];

  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const value = match[2].trim();
    const id = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    toc.push({ value, id, level });
  }

  return toc;
}

// Helper function to parse content and extract mermaid diagrams
function parseContentWithMermaid(htmlContent: string): React.ReactNode[] {
  // Split content by mermaid code blocks
  const mermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = mermaidRegex.exec(htmlContent)) !== null) {
    // Add HTML content before the mermaid block
    if (match.index > lastIndex) {
      const htmlPart = htmlContent.slice(lastIndex, match.index);
      if (htmlPart.trim()) {
        parts.push(
          <div
            key={`html-${keyCounter++}`}
            dangerouslySetInnerHTML={{ __html: htmlPart }}
          />
        );
      }
    }

    // Add the mermaid diagram
    const mermaidCode = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    parts.push(
      <Mermaid key={`mermaid-${keyCounter++}`} value={mermaidCode} />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining HTML content
  if (lastIndex < htmlContent.length) {
    const remainingHtml = htmlContent.slice(lastIndex);
    if (remainingHtml.trim()) {
      parts.push(
        <div
          key={`html-${keyCounter++}`}
          dangerouslySetInnerHTML={{ __html: remainingHtml }}
        />
      );
    }
  }

  // If no mermaid diagrams found, return the original HTML
  if (parts.length === 0) {
    parts.push(
      <div
        key="html-only"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  return parts;
}

/**
 * Rule page component for rendering individual .mdc files with Docusaurus docs layout
 * This component integrates with the docusaurus-plugin-mdc-rules plugin
 */
export default function RulePage(props: RulePageProps) {
  if ('to' in props) {
    return <Redirect to={props.to} />;
  }

  const { title, content: htmlContent, metadata } = props;

  // Access plugin data for sidebar configuration
  const pluginData = usePluginData('docusaurus-plugin-mdc-rules', 'docusaurus-plugin-mdc-rules') as PluginData;

  const { sidebar } = pluginData;

  // Generate TOC from markdown content
  const toc = extractTOC(htmlContent);

  // Convert markdown content to HTML for display with mermaid support
  const MDXContentComponent = () => {
    const contentParts = parseContentWithMermaid(htmlContent);
    
    return (
      <div className={clsx('markdown', styles.ruleContent)}>
        {contentParts}
      </div>
    );
  };

  return (
    <Layout>
      <DocsSidebarProvider name="rules" items={sidebar}>
        <DocRootLayout>
          <div className="row">
            <div className={clsx('col', styles.docMainContainer)}>
              <div className={styles.docItemContainer}>
                <div className={styles.tocMobileContainer}>
                  <TOCCollapsible
                    toc={toc}
                  />
                </div>
                {/* Page Header */}
                <header className={styles.docHeader}>
                  <h1 className={styles.docTitle}>{title || 'Unknown Rule'}</h1>
                </header>

                {/* Rule Metadata */}
                <div className={styles.ruleMetadata}>
                  <div className={styles.metadataGrid}>
                    {metadata?.description && (
                      <div className={styles.metadataItem}>
                        <strong>Description:</strong> {metadata.description}
                      </div>
                    )}

                    <div className={styles.metadataItem}>
                      <strong>Source:</strong> <code>{metadata?.sourceFile || 'Unknown'}</code>
                    </div>

                    {metadata?.globs.length > 0 && (
                      <div className={styles.metadataItem}>
                        <strong>File Patterns:</strong> <code>{metadata.globs}</code>
                      </div>
                    )}

                    {metadata?.alwaysApply !== undefined && (
                      <div className={styles.metadataItem}>
                        <strong>Always Apply:</strong>
                        <span className={metadata.alwaysApply ? styles.enabled : styles.disabled}>
                          {metadata.alwaysApply ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}

                    {metadata?.lastModified && (
                      <div className={styles.metadataItem}>
                        <strong>Last Modified:</strong>
                        <time dateTime={metadata.lastModified}>
                          {new Date(metadata.lastModified).toLocaleDateString()}
                        </time>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Content */}
                <article className={styles.docContent}>
                  <MDXContentComponent />
                </article>
              </div>
            </div>
            <div className={clsx('col col--2', styles.tocDesktopContainer)}>
              <TOC
                toc={toc}
              />
            </div>
          </div>
        </DocRootLayout>
      </DocsSidebarProvider>
    </Layout>
  )
} 