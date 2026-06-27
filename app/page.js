import PublicHostCatchAllPage, { generateMetadata as catchAllGenerateMetadata } from './[[...slug]]/page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(props) {
  return catchAllGenerateMetadata({
    ...props,
    params: Promise.resolve({ slug: [] }),
  });
}

export default function RootPage(props) {
  return PublicHostCatchAllPage({
    ...props,
    params: Promise.resolve({ slug: [] }),
  });
}
