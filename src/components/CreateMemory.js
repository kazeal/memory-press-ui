import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { assetPaths, mindPath, compileMindBuffer, uploadAsset } from '../lib/arTargets';
import { friendlyError } from '../lib/errors';
import MemoryShare from './MemoryShare';
import BrandMark from './BrandMark';
import '../styles/theme.css';

function CreateMemory() {
  const [title, setTitle] = useState('');
  const [pairs, setPairs] = useState([{ imageFile: null, videoFile: null }]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [createdId, setCreatedId] = useState(null);

  const updatePair = (index, patch) => {
    setPairs((prev) => prev.map((pair, i) => (i === index ? { ...pair, ...patch } : pair)));
  };

  const addPair = () => {
    setPairs((prev) => [...prev, { imageFile: null, videoFile: null }]);
  };

  const removePair = (index) => {
    setPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit =
    title.trim() !== '' &&
    pairs.length > 0 &&
    pairs.every((p) => p.imageFile && p.videoFile) &&
    progress === null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setProgress(0);

    try {
      const mindBuffer = await compileMindBuffer(
        pairs.map((p) => p.imageFile),
        (percent) => setProgress(percent)
      );

      const id = crypto.randomUUID();
      const mindUrl = await uploadAsset(mindPath(id), mindBuffer, 'application/octet-stream');

      const pairsData = [];
      for (let i = 0; i < pairs.length; i++) {
        const { imageFile, videoFile } = pairs[i];
        const { imagePath, videoPath } = assetPaths(id, i);
        const imageUrl = await uploadAsset(imagePath, imageFile, imageFile.type);
        const videoUrl = await uploadAsset(videoPath, videoFile, videoFile.type);
        pairsData.push({ target_index: i, image_url: imageUrl, video_url: videoUrl });
      }

      // created_by stamps itself via the column default (auth.uid()); the
      // email is denormalized here for display since the client can't
      // resolve auth user ids to emails.
      const { data: userData } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from('ar_targets').insert({
        id,
        title,
        mind_url: mindUrl,
        pairs: pairsData,
        created_by_email: userData?.user?.email ?? null,
      });
      if (insertError) throw insertError;

      setProgress(null);
      setCreatedId(id);
    } catch (err) {
      setError(friendlyError(err, 'Could not create this memory. Please try again shortly.'));
      setProgress(null);
    }
  };

  if (createdId) {
    return (
      <div className="memory-page">
        <div className="memory-card">
          <BrandMark />
          <MemoryShare id={createdId} heading="Your AR memory is ready" />
        </div>
      </div>
    );
  }

  return (
    <div className="memory-page">
      <div className="memory-card">
        <Link to="/admin" className="memory-back">← Back</Link>
        <BrandMark />
        <h1 className="memory-title">Create a memory</h1>
        <form onSubmit={handleSubmit}>
          <div className="memory-field">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              className="memory-input"
              type="text"
              placeholder="e.g. Kaz & Zane's wedding"
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
                  <input
                    className="memory-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => updatePair(index, { imageFile: e.target.files[0] })}
                  />
                </div>
                <div className="memory-field">
                  <label>Video (plays over the photo)</label>
                  <input
                    className="memory-file"
                    type="file"
                    accept="video/*"
                    onChange={(e) => updatePair(index, { videoFile: e.target.files[0] })}
                  />
                </div>
              </div>
            </div>
          ))}

          <button type="button" className="memory-link memory-add-pair" onClick={addPair}>
            + Add another pair
          </button>

          <button className="memory-button" type="submit" disabled={!canSubmit}>
            Create AR link
          </button>
        </form>
        {progress !== null && (
          <>
            <div className="memory-progress">
              <div className="memory-progress-bar" style={{ width: `${Math.round(progress)}%` }} />
            </div>
            <p className="memory-progress-label">Compiling target… {Math.round(progress)}%</p>
          </>
        )}
        {error && <p className="memory-error">{error}</p>}
      </div>
    </div>
  );
}

export default CreateMemory;
