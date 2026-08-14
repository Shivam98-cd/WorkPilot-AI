import React from 'react';

const shimmerStyle = {
  background: 'linear-gradient(90deg, #0c0c0f 25%, #0a0a0c 50%, #0c0c0f 75%)',
  backgroundSize: '200% 100%',
  animation: 'loading 1.5s infinite',
};

const Skeleton = ({ width = '100%', height = '200px', radius = '8px', style = {} }) => (
  <div style={{ width, height, borderRadius: radius, ...shimmerStyle, ...style }} />
);

export function SkeletonCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
      <Skeleton height="14px" width="60%" />
      <Skeleton height="12px" width="90%" />
      <Skeleton height="12px" width="75%" />
    </div>
  );
}

export function SkeletonTable({ rows = 3, cols = 1 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12 }}>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} style={{ display: 'flex', gap: 10 }}>
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} height="12px" style={{ flex: 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

const style = `
@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

export default function SkeletonProvider() {
  return (
    <>
      <style>{style}</style>
      <Skeleton />
    </>
  );
}