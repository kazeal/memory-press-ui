import React from 'react';
import '../styles/theme.css';

export function SkeletonLine({ width = '100%', height = 12 }) {
  return <div className="skeleton skeleton-line" style={{ width, height }} />;
}

// Placeholder shaped like a row in the admin memory list.
export function SkeletonListItem() {
  return (
    <div className="memory-list-item">
      <div className="skeleton memory-list-thumb" />
      <div className="memory-list-info">
        <SkeletonLine width="55%" height={14} />
        <SkeletonLine width="30%" />
      </div>
    </div>
  );
}
