import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { normalizePairs } from '../lib/arTargets';
import { friendlyError } from '../lib/errors';
import BrandMark from './BrandMark';
import { SkeletonListItem } from './Skeleton';
import '../styles/theme.css';

// Shows "Updated <date>" only when meaningfully later than creation
// (the trigger bumps updated_at on every update, including the insert-adjacent ones).
function updatedLabel(target) {
  if (!target.updated_at) return '';
  const created = new Date(target.created_at).getTime();
  const updated = new Date(target.updated_at).getTime();
  if (updated - created < 60 * 1000) return '';
  return ` · Updated ${new Date(target.updated_at).toLocaleDateString()}`;
}

function AdminList() {
  const navigate = useNavigate();
  const [targets, setTargets] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('ar_targets')
      .select('id, title, image_url, video_url, pairs, created_at, updated_at, created_by_email')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          setError(friendlyError(fetchError, 'Could not load memories. Please try again shortly.'));
        } else {
          setTargets(data);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="memory-page">
      <div className="memory-card memory-card--wide">
        <BrandMark />
        <h1 className="memory-title">Memories</h1>
        <div className="memory-field" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Link to="/admin/upload" className="memory-link">
            + New memory
          </Link>
          <button type="button" className="memory-link memory-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
        {error && <p className="memory-error">{error}</p>}
        {!targets && !error && (
          <div className="memory-list">
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </div>
        )}
        {targets && targets.length === 0 && (
          <p className="memory-empty">No memories yet.</p>
        )}
        {targets && targets.length > 0 && (
          <div className="memory-list">
            {targets.map((target) => {
              const pairs = normalizePairs(target);
              const thumbUrl = pairs[0]?.image_url;
              return (
                <div className="memory-list-item" key={target.id}>
                  {thumbUrl ? (
                    <img className="memory-list-thumb" src={thumbUrl} alt="" />
                  ) : (
                    <div className="memory-list-thumb" />
                  )}
                  <div className="memory-list-info">
                    <p className="memory-list-title">{target.title || 'Untitled'}</p>
                    <p className="memory-list-date">
                      {new Date(target.created_at).toLocaleDateString()}
                      {pairs.length > 1 ? ` · ${pairs.length} targets` : ''}
                      {updatedLabel(target)}
                      {target.created_by_email ? ` · ${target.created_by_email}` : ''}
                    </p>
                  </div>
                  <div className="memory-list-actions">
                    <Link className="memory-link" to={`/view/${target.id}`}>
                      View
                    </Link>
                    <Link className="memory-link" to={`/admin/edit/${target.id}`}>
                      Edit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminList;
