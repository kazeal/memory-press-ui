import React from 'react';
import BrandMark from './BrandMark';
import '../styles/theme.css';

// Fallback shown at /ar (no memory id) — this is the installed PWA's
// start_url, so it must never be blank. It just points the user back to
// scanning a memory's QR code.
function ScanPrompt() {
  return (
    <div className="memory-page">
      <div className="memory-card">
        <BrandMark size={56} />
        <p className="memory-empty">Scan a memory's QR code to begin.</p>
      </div>
    </div>
  );
}

export default ScanPrompt;
