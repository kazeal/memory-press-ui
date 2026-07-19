import React from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import CopyableLink from './CopyableLink';
import '../styles/theme.css';

function MemoryShare({ id, heading }) {
  const url = `${window.location.origin}/view/${id}`;

  return (
    <>
      <h1 className="memory-title">{heading}</h1>
      <div className="memory-qr">
        <QRCodeCanvas value={url} size={200} />
      </div>
      <CopyableLink url={url} />
      <div className="memory-button-row">
        <Link
          to={`/view/${id}`}
          className="memory-button memory-button-secondary"
          style={{ textAlign: 'center' }}
        >
          View memory
        </Link>
        <Link
          to="/admin"
          className="memory-button memory-button-secondary"
          style={{ textAlign: 'center' }}
        >
          Back to memories
        </Link>
      </div>
    </>
  );
}

export default MemoryShare;
