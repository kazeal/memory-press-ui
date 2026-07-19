import React from 'react';
import '../styles/theme.css';

// Brand lockup: the Memory Press sun/maypole mark, optionally with the wordmark.
// The logo lives in public/assets/exports and is referenced by URL (not imported).
function BrandMark({ showName = true, size = 40 }) {
  return (
    <div className="brand-mark">
      <img
        className="brand-mark-icon"
        src={`${process.env.PUBLIC_URL}/assets/exports/memory-press-icon-color.svg`}
        alt="Memory Press"
        width={size}
        height={size}
      />
      {showName && <span className="brand-mark-name">Memory Press</span>}
    </div>
  );
}

export default BrandMark;
