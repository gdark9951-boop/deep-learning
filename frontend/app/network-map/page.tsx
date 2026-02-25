import { SkeletonLoader } from '../../components/SkeletonLoader';

export default function NetworkMapPage() {
  return (
    <div className="glass p-6">
      <h2 className="text-neonBlue font-bold mb-4">Network Map</h2>
      <div className="mb-4">خريطة الاتصالات الشبكية مع تفاعل وزووم.</div>
      <SkeletonLoader width="100%" height={40} />
      <div className="mt-2">خريطة الشبكة تظهر هنا (Demo Mode)</div>
    </div>
  );
}