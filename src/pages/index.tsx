import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import MainPage from '../../docs/main.md';

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <main style={{ padding: '2rem' }}>
        <div className="container">
          <MainPage />
        </div>
      </main>
    </Layout>
  );
}
