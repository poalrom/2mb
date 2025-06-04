import { TOCItem } from '@docusaurus/mdx-loader';
import { DocsSidebarProvider } from '@docusaurus/plugin-content-docs/client';
import { Redirect } from '@docusaurus/router';
import { usePluginData } from '@docusaurus/useGlobalData';
import { PluginData, RulePageProps } from '@site/plugins/docusaurus-plugin-mdc-rules/src/types';
import DocRootLayout from '@theme/DocRoot/Layout';
import Layout from '@theme/Layout';
import TOC from '@theme/TOC';
import TOCCollapsible from '@theme/TOCCollapsible';
import clsx from 'clsx';
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

/**
 * Rule page component for rendering individual .mdc files with Docusaurus docs layout
 * This component integrates with the docusaurus-plugin-mdc-rules plugin
 */
export default function RulePage(props: RulePageProps) {
  if ('to' in props) {
    return <Redirect to={props.to} />;
  }

  const { id, title, content: markdownContent, metadata, permalink } = props;

  // Access plugin data for sidebar configuration
  const pluginData = usePluginData('docusaurus-plugin-mdc-rules', 'docusaurus-plugin-mdc-rules') as PluginData;

  const { sidebar } = pluginData;

  // Generate TOC from markdown content
  const toc = extractTOC(markdownContent);

  // Convert markdown content to HTML for display
  const MDXContentComponent = () => {
    return (
      <div
        className={clsx('markdown', styles.ruleContent)}
        dangerouslySetInnerHTML={{ __html: markdownContent }}
      />
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