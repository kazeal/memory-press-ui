import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { assetPaths, mindPath, compileMindBuffer, uploadAsset, normalizePairs } from '../lib/arTargets';
import { friendlyError } from '../lib/errors';
import ShareSidebar from './ShareSidebar';
import BrandMark from './BrandMark';
import { SkeletonLine } from './Skeleton';
import '../styles/theme.css';

function EditMemory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [pairs, setPairs] = useState(null);
  const [progress, setProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [audit, setAudit] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('ar_targets')
      .select('id, title, image_url, video_url, pairs, updated_at, created_by_email')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          friendlyError(fetchError, null);
          setNotFound(true);
          return;
        }
        setAudit({ updatedAt: data.updated_at, createdByEmail: data.created_by_email });
        setTitle(data.title || '');
        setPairs(
          normalizePairs(data).map((p) => ({
            imageUrl: p.image_url,
            videoUrl: p.video_url,
            newImageFile: null,
            newVideoFile: null,
          }))
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const updatePair = (index, patch) => {
    setPairs((prev) => prev.map((pair, i) => (i === index ? { ...pair, ...patch } : pair)));
  };

  const addPair = () => {
    setPairs((prev) => [...prev, { imageUrl: null, videoUrl: null, newImageFile: null, newVideoFile: null }]);
  };

  const removePair = (index) => {
    setPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const canSave =
    title.trim() !== '' &&
    pairs &&
    pairs.length > 0 &&
    pairs.every((p) => (p.newImageFile || p.imageUrl) && (p.newVideoFile || p.videoUrl)) &&
    !saving;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('ar_targets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (deleteError) throw deleteError;
      navigate('/admin');
    } catch (err) {
      setError(friendlyError(err, 'Could not delete this memory. Please try again shortly.'));
      setDeleting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(null);
    setProgress(0);

    try {
      const imageSources = pairs.map((p) => p.newImageFile || p.imageUrl);
      const mindBuffer = await compileMindBuffer(imageSources, (percent) => setProgress(percent));
      const mindUrl = await uploadAsset(mindPath(id), mindBuffer, 'application/octet-stream', { upsert: true });

      const pairsData = [];
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const { imagePath, videoPath } = assetPaths(id, i);
        const imageUrl = pair.newImageFile
          ? await uploadAsset(imagePath, pair.newImageFile, pair.newImageFile.type, { upsert: true })
          : pair.imageUrl;
        const videoUrl = pair.newVideoFile
          ? await uploadAsset(videoPath, pair.newVideoFile, pair.newVideoFile.type, { upsert: true })
          : pair.videoUrl;
        pairsData.push({ target_index: i, image_url: imageUrl, video_url: videoUrl });
      }

      const { error: updateError } = await supabase
        .from('ar_targets')
        .update({ title, mind_url: mindUrl, pairs: pairsData })
        .eq('id', id);
      if (updateError) throw updateError;

      setSaved(true);
    } catch (err) {
      setError(friendlyError(err, 'Could not save these changes. Please try again shortly.'));
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  if (notFound) {
    return (
      <div className="memory-page">
        <div className="memory-card">
          <p className="memory-empty">Memory not found.</p>
        </div>
      </div>
    );
  }

  if (!pairs) {
    return (
      <div className="memory-page">
        <div className="memory-card">
          <SkeletonLine width="45%" height={22} />
          <div style={{ height: 20 }} />
          <SkeletonLine width="25%" />
          <SkeletonLine height={40} />
          <div style={{ height: 20 }} />
          <SkeletonLine width="35%" />
          <SkeletonLine height={120} />
        </div>
      </div>
    );
  }

  return (
    <div className="memory-page memory-page--edit">
      <div className="memory-card">
        <Link to="/admin" className="memory-back">← Back</Link>
        <BrandMark />
        <h1 className="memory-title">Edit memory</h1>
        {audit && (
          <p className="memory-audit">
            {audit.updatedAt && `Last updated ${new Date(audit.updatedAt).toLocaleString()}`}
            {audit.createdByEmail && ` · Created by ${audit.createdByEmail}`}
          </p>
        )}
        <form onSubmit={handleSave}>
          <div className="memory-field">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              className="memory-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {pairs.map((pair, index) => (
            <div className="memory-pair" key={index}>
              <div className="memory-pair-header">
                <span>Pair {index + 1}</span>
                {pairs.length > 1 && (
                  <button
                    type="button"
                    className="memory-pair-remove"
                    onClick={() => removePair(index)}
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="memory-pair-fields">
                <div className="memory-field">
                  <label>Photo (the AR target)</label>
                  {pair.imageUrl ? (
                    <img className="memory-preview" src={pair.imageUrl} alt="Current target" />
                  ) : (
                    <div className="memory-placeholder">No preview available</div>
                  )}
                  <input
                    className="memory-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => updatePair(index, { newImageFile: e.target.files[0] })}
                  />
                </div>

                <div className="memory-field">
                  <label>Video (plays over the photo)</label>
                  {pair.videoUrl && <video className="memory-preview" src={pair.videoUrl} controls />}
                  <input
                    className="memory-file"
                    type="file"
                    accept="video/*"
                    onChange={(e) => updatePair(index, { newVideoFile: e.target.files[0] })}
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="memory-link memory-add-pair" onClick={addPair}>
            + Add another pair
          </button>

          <div className="memory-button-row">
            <button className="memory-button" type="submit" disabled={!canSave}>
              Save changes
            </button>
            <Link to="/admin" className="memory-button memory-button-secondary" style={{ textAlign: 'center' }}>
              Cancel
            </Link>
          </div>
        </form>
        {progress !== null && (
          <>
            <div className="memory-progress">
              <div className="memory-progress-bar" style={{ width: `${Math.round(progress)}%` }} />
            </div>
            <p className="memory-progress-label">Compiling target… {Math.round(progress)}%</p>
          </>
        )}
        {saved && <p className="memory-saved">Changes saved ✓</p>}
        {error && <p className="memory-error">{error}</p>}

        <div className="memory-delete">
          {!confirmingDelete ? (
            <button
              type="button"
              className="memory-delete-btn"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete memory
            </button>
          ) : (
            <div className="memory-delete-confirm">
              <p>Delete this memory? Its QR link will stop working.</p>
              <div className="memory-button-row">
                <button
                  type="button"
                  className="memory-button memory-button-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  className="memory-button memory-button-secondary"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ShareSidebar id={id} />
    </div>
  );
}

export default EditMemory;
