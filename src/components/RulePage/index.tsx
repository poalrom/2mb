import { Redirect } from '@docusaurus/router';
import { RulePageProps } from '@site/plugins/docusaurus-plugin-mdc-rules/src/types';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * Rule page component for rendering individual .mdc files
 * This component is used by the docusaurus-plugin-mdc-rules plugin
 */
export default function RulePage(props: RulePageProps) {
  if ('to' in props) {
    return <Redirect to={props.to} />;
  }

  const { id, title, content: markdownContent, metadata, permalink } = props;

  // Convert markdown content to MDX-compatible format
  const MDXContentComponent = () => {
    return (
      <div 
        className={clsx('markdown', styles.ruleContent)}
        dangerouslySetInnerHTML={{ __html: markdownContent }}
      />
    );
  };

  return (
    <Layout
      title={title || 'Rule'}
      description={metadata?.description || `Rule: ${title || 'Unknown'}`}
    >
      <div className="container margin-vert--lg">
        <div className="row">
          <aside className="col col--3">
            <div className={styles.metadata}>
              <h4>Rule Information</h4>
              <div className={styles.metadataItem}>
                <strong>Source File:</strong>
                <br />
                <code>{metadata?.sourceFile || 'Unknown'}</code>
              </div>
              
              {metadata?.description && (
                <div className={styles.metadataItem}>
                  <strong>Description:</strong>
                  <br />
                  {metadata.description}
                </div>
              )}
              
              {metadata?.globs && (
                <div className={styles.metadataItem}>
                  <strong>File Patterns:</strong>
                  <br />
                  <code>{metadata.globs}</code>
                </div>
              )}
              
              {metadata?.alwaysApply !== undefined && (
                <div className={styles.metadataItem}>
                  <strong>Always Apply:</strong>
                  <br />
                  <span className={metadata.alwaysApply ? styles.enabled : styles.disabled}>
                    {metadata.alwaysApply ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              
              {metadata?.lastModified && (
                <div className={styles.metadataItem}>
                  <strong>Last Modified:</strong>
                  <br />
                  <time dateTime={metadata.lastModified}>
                    {new Date(metadata.lastModified).toLocaleDateString()}
                  </time>
                </div>
              )}
            </div>
          </aside>
          
          <main className="col col--9">
            <div className={styles.ruleHeader}>
              <h1 className={styles.ruleTitle}>{title || 'Unknown Rule'}</h1>
              <div className={styles.rulePath}>
                <span className={styles.label}>Rule Path:</span>
                <code>{permalink || 'Unknown'}</code>
              </div>
            </div>
            
            <article className={styles.ruleArticle}>
              <MDXContentComponent />
            </article>
          </main>
        </div>
      </div>
    </Layout>
  );
} 