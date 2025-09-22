// Server component that exports metadata and renders the client component
import { generateMetadata } from './metadata';
import ContestDetailPage from './ContestClient';

// Export the metadata generation for server-side rendering
export { generateMetadata };

// Server component wrapper that renders the client component
export default function ContestPage() {
  return <ContestDetailPage />;
}