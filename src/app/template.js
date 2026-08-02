import PageTransition from '@/components/animations/PageTransition';

export default function Template({ children }) {
  return <PageTransition>{children}</PageTransition>;
}
