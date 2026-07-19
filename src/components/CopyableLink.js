import React, { useState } from 'react';

function CopyableLink({ url }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API needs a secure context; the readonly input is the fallback
    }
  };

  return (
    <div className="memory-share-link">
      <input
        className="memory-input"
        type="text"
        value={url}
        readOnly
        onFocus={(e) => e.target.select()}
      />
      <button type="button" className="memory-button memory-share-copy" onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

export default CopyableLink;
