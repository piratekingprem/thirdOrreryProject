import React, { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useParams } from "react-router-dom";
import * as handpose from '@tensorflow-models/handpose';
import * as THREE from 'three';
import '@tensorflow/tfjs';
import InformationCard from "./InformationCard";
import '../component/OnClickGetTheItem.css';

const lerp = (start, end, t) => start * (1 - t) + end * t;

const Stars = () => {
  const group = useRef();
  const [positions] = useState(() => {
    const temp = [];
    for (let i = 0; i < 5000; i++) {
      const x = THREE.MathUtils.randFloatSpread(2000);
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      temp.push([x, y, z]);
    }
    return temp;
  });

  return (
    <group ref={group}>
      {positions.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}
    </group>
  );
};

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

function Render({ pathOfPlanetModel }) {
  const { scene } = useGLTF(`/${pathOfPlanetModel}.glb`);
  const planetRef = useRef();

  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.01;
    }
  });

  return <primitive ref={planetRef} object={scene} />;
}

export default function OnClickGetTheItem() {
  const { planet } = useParams();
  const [planetModelPath, setPlanetModelPath] = useState("");
  const [generatedText, setGeneratedText] = useState("Loading AI-generated content...");
  const [targetZoomLevel, setTargetZoomLevel] = useState(100);
  const [handPoseDetectionStarted, setHandPoseDetectionStarted] = useState(false);
  const videoRef = useRef(null);
  let model = null;

  useEffect(() => {
    setPlanetModelPath(planet);

    const fetchGeneratedContent = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/v1/get_info/${planet}`);
        const data = await response.text();
        setGeneratedText(data || "AI content could not be generated.");
      } catch (error) {
        console.error("Error fetching AI content:", error);
        setGeneratedText("Error fetching AI content.");
      }
    };

    fetchGeneratedContent();
  }, [planet]);

  useGLTF.preload(`/${planet}.glb`);

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
      requestAnimationFrame(detectHand); // Throttle detection for better performance
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

  return (
    <div style={{ position: 'relative' }}>
      <Canvas>
        <Stars/>
        <Environment preset="sunset" />
        <ambientLight intensity={0.1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <Suspense fallback={null}>
          {planetModelPath && <Render pathOfPlanetModel={planetModelPath} />}
        </Suspense>

        <OrbitControls />
        <ZoomController targetZoomLevel={targetZoomLevel} />
      </Canvas>

      <InformationCard info={generatedText} />

      <video ref={videoRef} style={{ position : 'absolute', width: '150px' }} />
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

      <div>
        <h2>AI-Generated Story:</h2>
        <p>{generatedText}</p>
      </div>
    </div>
  );
}
