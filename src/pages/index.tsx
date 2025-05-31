import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
// Import README.md as an MDX component
import ReadmeContent from '../../README.md';

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <main style={{ padding: '2rem' }}>
        <div className="container">
          <ReadmeContent />
        </div>
      </main>
    </Layout>
  );
}
