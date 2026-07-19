import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import CopyableLink from './CopyableLink';
import '../styles/theme.css';

function ShareSidebar({ id }) {
  const url = `${window.location.origin}/view/${id}`;

  return (
    <aside className="memory-share-sidebar">
      <div className="memory-card">
        <h2 className="memory-share-heading">Share this memory</h2>
        <div className="memory-qr">
          <QRCodeCanvas value={url} size={160} />
        </div>
        <CopyableLink url={url} />
      </div>
    </aside>
  );
}

export default ShareSidebar;
