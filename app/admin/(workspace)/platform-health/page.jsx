import PlatformHealthPanel from '@/components/admin/PlatformHealthPanel';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Platform health',
};

export default function PlatformHealthPage() {
  return <PlatformHealthPanel />;
}
