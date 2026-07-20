import * as THREE from 'three';
import React, { useEffect, useRef } from 'react';
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js';

const ARMemoryViewer = ({ mindUrl, pairs, onCameraError, muted = true }) => {
  const containerRef = useRef(null);
  const videosRef = useRef([]);
  const mutedRef = useRef(muted);

  // Apply mute changes to the live video elements without remounting the
  // AR scene (a remount would restart the camera).
  useEffect(() => {
    mutedRef.current = muted;
    videosRef.current.forEach((video) => {
      video.muted = muted;
    });
  }, [muted]);

  useEffect(() => {
    if (!mindUrl || !pairs || pairs.length === 0) return;

    const mindarThree = new MindARThree({
      container: containerRef.current,
      imageTargetSrc: mindUrl,
      uiScanning: 'no',
    });
    const { renderer, scene, camera } = mindarThree;

    const videos = [];
    const cleanupFns = [];
    const entries = [];

    pairs.forEach((pair) => {
      const anchor = mindarThree.addAnchor(pair.targetIndex);

      const video = document.createElement('video');
      video.src = pair.videoUrl;
      video.loop = true;
      video.muted = mutedRef.current;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      videos.push(video);
      entries.push({ anchor, video });

      const onLoadedMetadata = () => {
        const aspect = video.videoWidth / video.videoHeight;
        const geometry = new THREE.PlaneGeometry(1, 1 / aspect);
        const texture = new THREE.VideoTexture(video);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const plane = new THREE.Mesh(geometry, material);
        anchor.group.add(plane);
      };
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      cleanupFns.push(() => video.removeEventListener('loadedmetadata', onLoadedMetadata));

      anchor.onTargetFound = () => {
        // Only one target tracks at a time (maxTrack 1), but mind-ar can drop
        // the "lost" event for the previous target during a handoff, leaving
        // its plane frozen mid-air. Enforce single-active ourselves: hide and
        // pause every other anchor whenever a target is found.
        entries.forEach((other) => {
          if (other.anchor !== anchor) {
            other.video.pause();
            other.anchor.group.visible = false;
          }
        });
        video.play().catch(() => {
          // Autoplay can be rejected (e.g. iOS Low Power Mode) — the target
          // still shows the first frame, so fail quietly.
        });
      };
      anchor.onTargetLost = () => {
        video.pause();
        anchor.group.visible = false;
      };
    });

    let cancelled = false;
    mindarThree
      .start()
      .then(() => {
        if (cancelled) return;
        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
        });
      })
      .catch(() => {
        // mind-ar rejects start() when getUserMedia fails — almost always a
        // denied camera permission. Its loading overlay (appended to
        // document.body, z-index 2, covering the viewport) is only hidden on
        // successful start, so hide it here or it blocks all clicks.
        mindarThree.ui.hideLoading();
        if (!cancelled && onCameraError) onCameraError();
      });

    videosRef.current = videos;

    return () => {
      cancelled = true;
      videosRef.current = [];
      videos.forEach((video) => {
        video.pause();
        video.src = '';
      });
      cleanupFns.forEach((fn) => fn());
      renderer.setAnimationLoop(null);
      try {
        mindarThree.stop();
      } catch {
        // stop() throws if start() never got a camera stream — nothing to stop.
      }
      // mind-ar appends its overlays to document.body (not our container), so
      // unmounting this component doesn't remove them. Remove them explicitly
      // or they accumulate — and a stuck one swallows clicks page-wide.
      const { ui } = mindarThree;
      [ui.loadingModal, ui.compatibilityModal, ui.scanningMask].forEach((el) => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, [mindUrl, pairs, onCameraError]);

  return (
    <div style={{ width: '100%', height: '100%' }} ref={containerRef}></div>
  );
};

export default ARMemoryViewer;
