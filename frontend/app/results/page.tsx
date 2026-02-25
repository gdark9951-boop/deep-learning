import { SkeletonLoader } from '../../components/SkeletonLoader';

export default function ResultsPage() {
  return (
    <div className="glass p-6">
      <h2 className="text-neonBlue font-bold mb-4">Results & History</h2>
      <div className="mb-4">قائمة Runs مع إمكانية التصفية والبحث والتصدير.</div>
      <SkeletonLoader width="100%" height={40} />
      <div className="mt-2">نتائج Runs تظهر هنا (Demo Mode)</div>
    </div>
  );
}