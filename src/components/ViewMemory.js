import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { normalizePairs } from '../lib/arTargets';
import ARMemoryViewer from './ARMemoryViewer';
import { SkeletonLine } from './Skeleton';
import '../styles/theme.css';
import './startAR.css';

function ViewMemory() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [pairs, setPairs] = useState(null);
  const [mindUrl, setMindUrl] = useState(null);
  const [error, setError] = useState(null);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [hardBlocked, setHardBlocked] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);
  const [muted, setMuted] = useState(true);

  const handleCameraError = useCallback(() => setCameraDenied(true), []);

  // Returns 'granted' | 'prompt' | 'denied', or null where the Permissions API
  // can't answer for the camera (e.g. Firefox).
  const queryCameraPermission = async () => {
    try {
      return await navigator.permissions.query({ name: 'camera' });
    } catch {
      return null;
    }
  };

  const retryCamera = useCallback(async () => {
    const status = await queryCameraPermission();
    if (status && status.state === 'denied') {
      // The browser remembers the block and auto-denies without showing a
      // prompt — remounting would just flash and fail. Point at settings.
      setHardBlocked(true);
      return;
    }
    setHardBlocked(false);
    setCameraDenied(false);
    // Remounting the viewer re-runs mind-ar's getUserMedia, which re-prompts
    // for permission.
    setViewerKey((k) => k + 1);
  }, []);

  // While on the denied card, watch the permission: distinguish "still ask-able"
  // from hard-blocked, and auto-resume the moment the user unblocks the site.
  useEffect(() => {
    if (!cameraDenied) return;
    let status = null;
    let disposed = false;
    (async () => {
      status = await queryCameraPermission();
      if (!status || disposed) return;
      setHardBlocked(status.state === 'denied');
      status.onchange = () => {
        if (disposed) return;
        setHardBlocked(status.state === 'denied');
        if (status.state === 'granted') retryCamera();
      };
    })();
    return () => {
      disposed = true;
      if (status) status.onchange = null;
    };
  }, [cameraDenied, retryCamera]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('ar_targets')
      // No deleted_at filter here: the "anon read live" RLS policy already
      // hides deleted rows, and anon has no column grant on deleted_at — so
      // filtering on it client-side would be rejected outright.
      .select('title, mind_url, image_url, video_url, pairs')
      .eq('id', id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          setError('Memory not found');
          return;
        }
        setTitle(data.title || '');
        setMindUrl(data.mind_url);
        setPairs(normalizePairs(data));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Memoized so toggling sound doesn't hand ARMemoryViewer a new array
  // identity — that would re-run its effect and rebuild the whole AR scene,
  // leaving a frozen frame while the camera restarts.
  const viewerPairs = useMemo(
    () =>
      (pairs || []).map((p) => ({ targetIndex: p.target_index, videoUrl: p.video_url })),
    [pairs]
  );

  if (error) {
    return (
      <div className="memory-page">
        <div className="memory-card">
          <p className="memory-empty">{error}</p>
        </div>
      </div>
    );
  }

  if (!pairs) {
    return (
      <div className="memory-page">
        <div className="memory-card">
          <SkeletonLine width="55%" height={22} />
          <div style={{ height: 20 }} />
          <SkeletonLine />
          <SkeletonLine width="70%" />
        </div>
      </div>
    );
  }

  if (cameraDenied) {
    return (
      <div className="memory-page">
        <div className="memory-card">
          {title && <h1 className="memory-title">{title}</h1>}
          <p className="memory-error">
            Camera access was blocked, so this memory can't be viewed. This
            experience needs your camera to spot the photo it comes to life on.
          </p>
          {hardBlocked ? (
            <>
              <p className="memory-empty" style={{ marginBottom: 16, fontSize: 14 }}>
                Your browser has the camera blocked for this site, so it won't
                show a permission prompt again. Tap the camera or lock icon in
                the address bar, allow the camera, and this page will resume
                automatically.
              </p>
              <button className="memory-button memory-button-secondary" onClick={retryCamera}>
                Check again
              </button>
            </>
          ) : (
            <>
              <button className="memory-button" onClick={retryCamera}>
                Allow camera access
              </button>
              <p className="memory-empty" style={{ marginTop: 16, fontSize: 13 }}>
                If no permission prompt appears, enable the camera for this site
                in your browser's settings, then try again.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ar-fullscreen">
      <ARMemoryViewer
        key={viewerKey}
        mindUrl={mindUrl}
        pairs={viewerPairs}
        onCameraError={handleCameraError}
        muted={muted}
      />
      <button
        className="ar-sound-toggle"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? 'Unmute video sound' : 'Mute video sound'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}

export default ViewMemory;
