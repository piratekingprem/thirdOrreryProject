import React, { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useParams } from "react-router-dom";
import * as handpose from '@tensorflow-models/handpose';
import '@tensorflow/tfjs';
import InformationCard from "./InformationCard";
import '../component/OnClickGetTheItem.css';

// Helper function for smooth transitions using linear interpolation (lerp)
const lerp = (start, end, t) => {
  return start * (1 - t) + end * t;
};

// ZoomController with smooth zoom transition
const ZoomController = ({ targetZoomLevel }) => {
  const { camera } = useThree();
  const [currentZoomLevel, setCurrentZoomLevel] = useState(camera.position.y);

  useEffect(() => {
    const handleZoom = () => {
      // Interpolate smoothly between the current zoom level and the target zoom level
      const newZoomLevel = lerp(currentZoomLevel, targetZoomLevel, 0.1);
      camera.position.y = newZoomLevel;
      setCurrentZoomLevel(newZoomLevel);
    };
    handleZoom();
  }, [targetZoomLevel, currentZoomLevel, camera]);

  return null;
};

function Render({ pathOfPlanetModel }) {
  const { scene } = useGLTF(`/${pathOfPlanetModel}.glb`);

  // Use useRef to store the reference to the scene and rotate it
  const planetRef = useRef();

  // Use useFrame to rotate the planet on every frame
  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.01; // Rotate around the Y-axis
    }
  });

  return <primitive ref={planetRef} object={scene} />;
}

export default function OnClickGetTheItem() {
  const { planet } = useParams();
  const [planetModelPath, setPlanetModelPath] = useState("");
  const [generatedText, setGeneratedText] = useState("Loading AI-generated content...");
  const [targetZoomLevel, setTargetZoomLevel] = useState(100); // Initial zoom level
  const [handPoseDetectionStarted, setHandPoseDetectionStarted] = useState(false); // Track if handpose detection has started
  const videoRef = useRef(null);
  let model = null;

  useEffect(() => {
    setPlanetModelPath(planet);

    // Fetch generated content from the backend
    const fetchGeneratedContent = async () => {
      try {
        const response = await fetch(`https://third-orrery-project-backend-mau0v6vo1-piratekingprems-projects.vercel.app/api/v1/get_info/${planet}`);
        const text = await response.text();
        setGeneratedText(text || "AI content could not be generated.");
      } catch (error) {
        console.error("Error fetching AI content:", error);
        setGeneratedText("Error fetching AI content.");
      }
    };

    fetchGeneratedContent();
  }, [planet]);

  useGLTF.preload(`/${planet}.glb`);

  // Load Handpose Model and Setup Camera for Hand Tracking
  const loadHandposeModel = async () => {
    model = await handpose.load();
    detectHand();
  };

  const detectHand = async () => {
    const video = videoRef.current;
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

    requestAnimationFrame(detectHand);
  };

  // Zoom control based on hand distance
  const controlZoom = (distance) => {
    const zoomSpeed = 10; // Control how fast zoom happens
    const minZoom = 500;  // Minimum zoom level (closer)
    const maxZoom = 100; // Maximum zoom level (further away)

    // Adjust zoom level based on hand distance, with dynamic limits
    if (distance < 50) {
      setTargetZoomLevel((prev) => Math.max(prev - zoomSpeed, minZoom)); // Zoom in
    } else if (distance > 100) {
      setTargetZoomLevel((prev) => Math.min(prev + zoomSpeed, maxZoom)); // Zoom out
    }
  };

  // Setup Camera and Load Handpose Model after button click
  const startHandposeDetection = async () => {
    setHandPoseDetectionStarted(true); // Mark handpose detection as started
    const video = videoRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
    await loadHandposeModel();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 3D Scene */}
      <Canvas>
        <Environment preset="sunset" />
        <ambientLight intensity={0.1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <Suspense fallback={null}>
          {planetModelPath && <Render pathOfPlanetModel={planetModelPath} />}
        </Suspense>

        <OrbitControls />
        <ZoomController targetZoomLevel={targetZoomLevel} />
      </Canvas>

      {/* Information Card - overlaying the canvas */}
      <InformationCard info={generatedText} />

      {/* Handpose Detection */}
      <video ref={videoRef} style={{ position : 'absolute' }} />
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

      {/* Display the AI-generated text separately if needed */}
      <div>
        <h2>AI-Generated Story:</h2>
        <p>{generatedText}</p>
      </div>
    </div>
  );
}
