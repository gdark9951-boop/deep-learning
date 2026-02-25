export const SkeletonLoader = ({ width = '100%', height = 24 }: { width?: string, height?: number }) => (
  <div className="animate-pulse bg-gray-700 rounded" style={{ width, height }} />
);