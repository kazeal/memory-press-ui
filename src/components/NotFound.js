import React from 'react';
import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';
import '../styles/theme.css';

function NotFound() {
  return (
    <div className="memory-page memory-page--center">
      <div className="memory-card">
        <BrandMark />
        <h1 className="memory-title">Page not found</h1>
        <p className="memory-empty" style={{ marginBottom: 20 }}>
          This link doesn't lead anywhere. If you're trying to view a memory,
          scan its QR code.
        </p>
        <Link to="/view" className="memory-button" style={{ textAlign: 'center' }}>
          Go to Memory Press
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
