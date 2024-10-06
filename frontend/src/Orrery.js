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
  for (let i = 0; i < 74; i++) {
    const angle = (i / 54) * Math.PI * 2;
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
        <div className='planet-label' style={{ fontSize: '1em', cursor: 'pointer' }} onClick={onClick}>
          {name}
        </div>
      </Html>
    </mesh>
  );
};


const PlanetModel = ({ gltfUrl, distance, speed, size, onClick, name }) => {
  const { scene } = useGLTF(gltfUrl); // Load GLTF model
  const ref = useRef();
  const angle = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (ref.current) {
      // Orbit around the Sun
      angle.current += delta * speed;
      ref.current.position.x = distance * Math.cos(angle.current);
      ref.current.position.z = distance * Math.sin(angle.current);
      
      // Rotate around its own axis
      ref.current.rotation.y += 0.01; // Adjust the rotation speed as needed
    }
  });

  return (
    <group ref={ref} onClick={onClick}>
      <primitive object={scene} scale={size} />
      {/* Add ambient light for a glowing effect */}
      <ambientLight intensity={0.5} color="white" />
      <Html position={[0, size * 5, 0]}>
        <div className='planet-label' style={{  fontSize: '1em', cursor: 'pointer'  }} onClick={onClick}>
          {name}
        </div>
      </Html>
    </group>
  );
};




const Sun = () => {
  const { scene } = useGLTF('/sun.glb');

  return <primitive object={scene} scale={0.1} />;
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
  const [targetZoomLevel, setTargetZoomLevel] = useState(100);
  const [handPoseDetectionStarted, setHandPoseDetectionStarted] = useState(false);
  const videoRef = useRef(null);
  let model = null;

  const planets = [
    { name: 'Mercury', distance: 0.3 * 20, size: 0.005, speed: 0.03, gltfUrl: '/mercury.glb' },
    { name: 'Venus', distance: 0.7 * 20, size: 0.1, speed: 0.02, gltfUrl: '/venus.glb' },
    { name: 'Earth', distance: 1 * 20, size: 0.4, speed: 0.01, gltfUrl: './Earth.glb' },
    { name: 'Mars', distance: 1.52 * 20, size: 0.15, speed: 0.008, gltfUrl: '/Mars.glb' },
    { name: 'Jupiter', distance: 5.2 * 20, size: 0.05, speed: 0.005, gltfUrl: '/jupiter.glb' },
    { name: 'Saturn', distance: 9.5 * 20, size: 0.04, speed: 0.004, gltfUrl: '/saturn.glb' },
    { name: 'Uranus', distance: 19.2 * 20, size: 0.03, speed: 0.003, gltfUrl: '/uranus.glb' },
    { name: 'Neptune', distance: 30.0 * 20, size: 0.03, speed: 0.002, gltfUrl: '/neptune.glb' },
  ];


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

      <div style={{ width: showPanel ? '70%' : '100%' }}>n
        <Canvas
          camera={{ position: [0, 50, 150], fov: 50 }}
          style={{ background: 'black', height: '100vh' }}
        >
          <ZoomController zoomLevel={zoomLevel} />
          <ambientLight intensity={0.3} />
          <Stars />
          <Sun />
          {planets.map((planet) => (
            <>
              <PlanetModel
                key={planet.name}
                name={planet.name}
                distance={planet.distance}
                size={planet.size}
                speed={planet.speed}
                gltfUrl={planet.gltfUrl}
                onClick={() => handleObjectClick(planet)}
              />
              <OrbitPath distance={planet.distance} onClick={() => handleObjectClick(planet)} />
            </>
          ))}


          {neoData.map((neo) => (
            <Dot
              key={neo.name}
              name={neo.name}
              color={neo.color}
              distance={neo.distance}
              size={neo.size}
              speed={neo.speed}
              onClick={() => handleObjectClick(neo, true)}
            />
          ))}

          

          <OrbitControls />
        </Canvas>
      </div>

      <video ref={videoRef} style={{ position: 'absolute', width: '150px', bottom: '20px', left: '20px' }} />
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
            fontSize: '16px',
          }}
          onClick={startHandposeDetection}
        >
          Start Handpose Detection
        </button>
      )}
    </div>
  );
};

export default Orrery;