import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as handpose from '@tensorflow-models/handpose';
import '@tensorflow/tfjs';
import './Orrey.css';
import { useNavigate } from 'react-router-dom';

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

const OrbitPath = ({ distance, onClick }) => {
  const points = [];
  for (let i = 0; i < 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance));
  }
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <line onClick={onClick}>
      <bufferGeometry attach="geometry" {...lineGeometry} />
      <lineBasicMaterial attach="material" color="white" />
    </line>
  );
};

const Dot = ({ name, color, distance, size, speed, onClick }) => {
  const ref = useRef();
  const angle = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (ref.current) {
      angle.current += delta * speed;
      ref.current.position.x = distance * Math.cos(angle.current);
      ref.current.position.z = distance * Math.sin(angle.current);
    }
  });

  return (
    <mesh ref={ref} onClick={onClick}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} />
      <Html position={[0, size + 2, 0]}>
        <div style={{ color: 'white', fontSize: '1em', cursor: 'pointer' }} onClick={onClick}>
          {name}
        </div>
      </Html>
    </mesh>
  );
};

const Sun = () => {
  const { scene } = useGLTF('/sun.glb'); // Load the sun model

  return <primitive object={scene} scale={0.05} />; // Scale the sun as needed
};

// ZoomController that controls camera zoom based on hand distance
const ZoomController = ({ zoomLevel }) => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.y = zoomLevel;
  }, [zoomLevel, camera]);

  return null;
};

const Orrery = () => {
  const [selectedObject, setSelectedObject] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [neoData, setNeoData] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(100); // Initialize zoom level
  const [handPoseDetectionStarted, setHandPoseDetectionStarted] = useState(false); // State to track if handpose detection has started

  const videoRef = useRef(null);
  let model = null;

  const planets = [
    { name: 'Mercury', color: 'gray', distance: 0.3 * 10, size: 0.1, speed: 0.03 },
    { name: 'Venus', color: 'yellow', distance: 0.7 * 10, size: 0.1, speed: 0.02 },
    { name: 'Earth', color: 'blue', distance: 1 * 10, size: 0.1, speed: 0.01 },
    { name: 'Mars', color: 'red', distance: 1.52 * 10, size: 0.1, speed: 0.008 },
    { name: 'Jupiter', color: 'orange', distance: 5.2 * 10, size: 0.1, speed: 0.005 },
    { name: 'Saturn', color: 'goldenrod', distance: 9.5 * 10, size: 0.1, speed: 0.004 },
    { name: 'Uranus', color: 'lightblue', distance: 19.2 * 10, size: 0.1, speed: 0.003 },
    { name: 'Neptune', color: 'darkblue', distance: 30.0 * 10, size: 0.1, speed: 0.002 },
  ];

  // Fetch NEO data from the NASA API
  useEffect(() => {
    const fetchNEOData = async () => {
      try {
        const response = await fetch(
          `https://api.nasa.gov/neo/rest/v1/feed?start_date=2024-09-22&end_date=2024-09-23&api_key=ew5wSSkycJDyRhyeznBX6JkaRTRWmImwioGODrTA`
        );
        const data = await response.json();
        const neos = data.near_earth_objects['2024-09-22'];

        const formattedNEOs = neos.map((neo) => ({
          name: neo.name,
          size: 0.2,
          color: 'red',
          distance: Math.random() * 100 + 60,
          speed: Math.random() * 0.01 + 0.005,
          info: `Diameter: ${neo.estimated_diameter.kilometers.estimated_diameter_max} km, 
                 Velocity: ${neo.close_approach_data[0].relative_velocity.kilometers_per_hour} km/h`,
        }));

        setNeoData(formattedNEOs);
      } catch (error) {
        console.error('Error fetching NEO data:', error);
      }
    };

    fetchNEOData();
  }, []);

  const handleObjectClick = (object, isNeo = false) => {
    setSelectedObject(object);
    setShowPanel(true);

    if (isNeo) {
      navigate(`/neo/${object.name}`); // Redirect to NEO page if it's a NEO
    } else {
      navigate(`/planet/${object.name}`); // Redirect to planet page for planets
    }
  };


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

  const controlZoom = (distance) => {
    if (distance < 50) {
      setZoomLevel((prev) => Math.max(prev - 1, 100)); // Zoom in
    } else if (distance > 100) {
      setZoomLevel((prev) => Math.min(prev + 1, 100)); // Zoom out
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
  let navigate = useNavigate();
  return (
    <div style={{ display: 'flex' }}>
      {showPanel && (
        <div style={{ width: '30%', padding: '20px', color: 'white', background: '#1a1a1a' }}>
          {selectedObject ? (
            <div>
              <h1>{selectedObject.name}</h1>
              <p>{selectedObject.info || 'No additional information available'}</p>
            </div>
          ) : (
            <div>
              <h2>Select a planet or NEO</h2>
            </div>
          )}
        </div>
      )}

      <div style={{ width: showPanel ? '70%' : '100%' }}>
        <Canvas
          camera={{ position: [0, 100, zoomLevel], fov: 75 }}
          style={{ background: 'black', height: '100vh' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls />
          <Stars />
          <Sun />
          {planets.map((planet) => (
            <group key={planet.name}>
              <OrbitPath distance={planet.distance} />
              <Dot
                name={planet.name}
                color={planet.color}
                distance={planet.distance}
                size={planet.size}
                speed={planet.speed}
                onClick={() => handleObjectClick(planet)}
              />
            </group>
          ))}
          {neoData.map((neo) => (
            <group key={neo.name}>
              {/* <OrbitPath distance={neo.distance} /> */}
              <Dot
                name={neo.name}
                color={neo.color}
                distance={neo.distance}
                size={neo.size}
                speed={neo.speed}
                onClick={() => handleObjectClick(neo, true)}  // Set isNeo as true
              />
            </group>
          ))}

          <ZoomController zoomLevel={zoomLevel} />
        </Canvas>

        <video ref={videoRef} style={{ display: 'none' }} />

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
    </div>
  );
};

export default Orrery;
