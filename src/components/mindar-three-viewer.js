import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import Edumarker from '../threedAssets/edu.mind';
import Edulogo from "../threedAssets/educativelogo.glb";
import Rain from "../threedAssets/rain.mind";
import RainVid from "../threedAssets/rain.mp4";
import kzwedding from "../threedAssets/kzwedding.mind";
import weddingVid from "../threedAssets/kz.mp4";
import targets from "../threedAssets/targets.mind";
import sega from "../threedAssets/sega.glb";

// Dynamic configuration
const targetConfigs = [
  {
    targetIndex: 0,
    mindFile: Rain,
    videoSrc: RainVid,
    aspectRatio: { width: 1, height: 0.56 },
  },
  {
    targetIndex: 1,
    mindFile: kzwedding,
    videoSrc: weddingVid,
    aspectRatio: { width: 1, height: 0.56 },
  },
];

const ARComponent = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // const mindarThree = new MindARThree({
    //   container: containerRef.current,
    //   imageTargetSrc: targets,
    // });
    // const { renderer, scene, camera } = mindarThree;

    // // Dynamically create anchors for each target
    // const videos = [];
    // targetConfigs.forEach((config) => {
    //   const anchor = mindarThree.addAnchor(config.targetIndex);

    //   const video = document.createElement("video");
    //   video.src = config.videoSrc;
    //   video.loop = true;
    //   video.muted = true;
    //   video.playsInline = true;
    //   videos.push(video);

    //   const texture = new THREE.VideoTexture(video);
    //   const geometry = new THREE.PlaneGeometry(
    //     config.aspectRatio.width,
    //     config.aspectRatio.height,
    //   );
    //   const material = new THREE.MeshBasicMaterial({ map: texture });
    //   const plane = new THREE.Mesh(geometry, material);

    //   anchor.group.add(plane);

    //   anchor.onTargetFound = () => video.play();
    //   anchor.onTargetLost = () => video.pause();
    // });

    // mindarThree.start();
    // renderer.setAnimationLoop(() => {
    //   renderer.render(scene, camera);
    // });

    // return () => {
    //   videos.forEach((video) => {
    //     video.pause();
    //     video.src = "";
    //   });
    //   renderer.setAnimationLoop(null);
    //   mindarThree.stop();
    // };
    const mindarThree = new MindARThree({
      container: containerRef.current,
      imageTargetSrc: Rain,
    });
    const { renderer, scene, camera } = mindarThree;
    const anchor = mindarThree.addAnchor(0);
    let avatar = null;
    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(sega, (gltf) => {
      avatar = gltf.scene;
      avatar.scale.set(1.5, 1.5, 1.5);
      avatar.rotation.set(0, 0, 0);

      // Add rotation animation
      // avatar.rotation.x = Math.PI / 4;
      anchor.group.add(avatar);

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0x0000ff, 2);
      scene.add(ambientLight);

      // Add point light
      const pointLight = new THREE.PointLight(0x0000ff, 8);
      pointLight.position.set(0, 1, 0);
      anchor.group.add(pointLight);
    });

    mindarThree.start();
    renderer.setAnimationLoop(() => {
      if (avatar) {
        avatar.rotation.y += 0.02; // Adjust speed by changing this value
      }
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      mindarThree.stop();
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }} ref={containerRef}></div>
  );
};

export default ARComponent;
