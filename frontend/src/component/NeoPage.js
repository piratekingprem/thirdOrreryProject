import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import { useParams } from 'react-router-dom';
import * as handpose from '@tensorflow-models/handpose';
import '@tensorflow/tfjs';
import './NeoPage.css'; // Assuming we follow your CSS structure

const lerp = (start, end, t) => start * (1 - t) + end * t;

const ZoomController = ({ targetZoomLevel }) => {
  const { camera } = useThree();
  const [currentZoomLevel, setCurrentZoomLevel] = useState(camera.position.y);

  useEffect(() => {
    const handleZoom = () => {
      const newZoomLevel = lerp(currentZoomLevel, targetZoomLevel, 0.1);
      camera.position.y = newZoomLevel;
      setCurrentZoomLevel(newZoomLevel);
    };
    handleZoom();
  }, [targetZoomLevel, currentZoomLevel, camera]);

  return null;
};

const RenderAsteroid = ({ pathOfAsteroidModel }) => {
  const { scene } = useGLTF(`/${pathOfAsteroidModel}.glb`);
  const asteroidRef = useRef();

  useFrame(() => {
    if (asteroidRef.current) {
      asteroidRef.current.rotation.y += 0.01;
    }
  });

  return <primitive ref={asteroidRef} object={scene} />;
};

const NeoPage = () => {
  const { name } = useParams(); // Extract the NEO's name from the route params
  const [neoDetails, setNeoDetails] = useState(null);
  const [targetZoomLevel, setTargetZoomLevel] = useState(100);
  const [handPoseDetectionStarted, setHandPoseDetectionStarted] = useState(false);
  const videoRef = useRef(null);
  let model = null;

  useEffect(() => {
    const fetchNeoDetails = async () => {
      try {
        const response = await fetch(
          `https://api.nasa.gov/neo/rest/v1/feed?start_date=2024-09-22&end_date=2024-09-23&api_key=ew5wSSkycJDyRhyeznBX6JkaRTRWmImwioGODrTA`
        );
        const data = await response.json();
        const neos = data.near_earth_objects['2024-09-22'];
        const selectedNeo = neos.find((neo) => neo.name === name); // Find NEO by name

        if (selectedNeo) {
          setNeoDetails({
            name: selectedNeo.name,
            diameter: selectedNeo.estimated_diameter.kilometers.estimated_diameter_max,
            velocity: selectedNeo.close_approach_data[0].relative_velocity.kilometers_per_hour,
            missDistance: selectedNeo.close_approach_data[0].miss_distance.kilometers,
            hazard: selectedNeo.is_potentially_hazardous_asteroid,
          });
        }
      } catch (error) {
        console.error('Error fetching NEO details:', error);
      }
    };

    fetchNeoDetails();
  }, [name]);

  useGLTF.preload('/asteroid.glb'); // Preload the asteroid model

  const loadHandposeModel = async () => {
    model = await handpose.load();
    detectHand();
  };

  const detectHand = async () => {
    const video = videoRef.current;
    if (!video || !model) return;

    const predictions = await model.estimateHands(video);

    if (predictions.length > 0) {
      const landmarks = predictions[0].landmarks;
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];

      const distance = Math.sqrt(
        Math.pow(thumbTip[0] - indexTip[0], 2) +
        Math.pow(thumbTip[1] - indexTip[1], 2) +
        Math.pow(thumbTip[2] - indexTip[2], 2)
      );

      controlZoom(distance);
    }

    setTimeout(() => {
      requestAnimationFrame(detectHand);
    }, 100); // Adjust this delay to control the gesture detection interval
  };

  const controlZoom = (distance) => {
    const zoomSpeed = 5; // Faster zoom
    const minZoom = 20;
    const maxZoom = 100;

    if (distance < 50) {
      setTargetZoomLevel((prev) => Math.max(prev - zoomSpeed, minZoom));
    } else if (distance > 100) {
      setTargetZoomLevel((prev) => Math.min(prev + zoomSpeed, maxZoom));
    }
  };

  const startHandposeDetection = async () => {
    setHandPoseDetectionStarted(true);
    const video = videoRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    video.srcObject = stream;
    video.play();
    await loadHandposeModel();
  };

  if (!neoDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      <Canvas>
        <Environment preset="sunset" />
        <ambientLight intensity={0.1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <Suspense fallback={null}>
          <RenderAsteroid pathOfAsteroidModel="asteroid" />
        </Suspense>

        <OrbitControls />
        <ZoomController targetZoomLevel={targetZoomLevel} />
      </Canvas>

      <div className="information-card">
        <h1>{neoDetails.name}</h1>
        <p><strong>Diameter:</strong> {neoDetails.diameter} km</p>
        <p><strong>Velocity:</strong> {neoDetails.velocity} km/h</p>
        <p><strong>Miss Distance:</strong> {neoDetails.missDistance} km</p>
        <p><strong>Potentially Hazardous:</strong> {neoDetails.hazard ? 'Yes' : 'No'}</p>
      </div>

      <video ref={videoRef} style={{ position: 'absolute', width: '150px' }} />
      {!handPoseDetectionStarted && (
        <button
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '10px 20px',
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
          onClick={startHandposeDetection}
        >
          Start Handpose Detection
        </button>
      )}
    </div>
  );
};

export default NeoPage;
