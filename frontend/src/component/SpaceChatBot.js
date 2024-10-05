import React, { useState } from 'react';
import axios from 'axios';

const SpaceChatBot = () => {
  const [response, setResponse] = useState(''); // To store bot's response
  const [input, setInput] = useState('');

  // Space-related responses with full information
  const getSpaceResponse = async (query) => {
    let response = '';
    try {
      const res = await axios.get(`https://api.le-systeme-solaire.net/rest/bodies/${query.toLowerCase()}`);
      if (res.data) {
        const {
          englishName,
          isPlanet,
          mass,
          gravity,
          meanRadius,
          moons,
          density,
          escape,
          axialTilt,
          semimajorAxis,
          equaRadius,
          polarRadius,
          sideralOrbit,
          sideralRotation,
        } = res.data;
        response = `Information about ${englishName}:
        - Is it a planet? ${isPlanet ? 'Yes' : 'No'}
        - Mass: ${mass ? `${mass.massValue} x 10^${mass.massExponent} kg` : 'N/A'}
        - Gravity: ${gravity || 'N/A'} m/s²
        - Mean Radius: ${meanRadius || 'N/A'} km
        - Number of Moons: ${moons ? moons.length : 'N/A'}
        - Density: ${density || 'N/A'} g/cm³
        - Escape Velocity: ${escape || 'N/A'} m/s
        - Axial Tilt: ${axialTilt || 'N/A'}°
        - Semi-Major Axis: ${semimajorAxis || 'N/A'} km
        - Equatorial Radius: ${equaRadius || 'N/A'} km
        - Polar Radius: ${polarRadius || 'N/A'} km
        - Sideral Orbit (Orbital Period): ${sideralOrbit || 'N/A'} days
        - Sideral Rotation (Day Length): ${sideralRotation || 'N/A'} hours
        `;
      }
    } catch (error) {
      response = "I couldn't find that information. Please try another space object or concept.";
    }
    return response;
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    // Get bot response and update state
    const botResponse = await getSpaceResponse(input);
    setResponse(botResponse);
    
    // Clear the input
    setInput('');
  };

  return (
    <div style={styles.container}>
      <h2>Space Information Search</h2>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search for a planet, moon..."
          style={styles.input}
        />
        <button onClick={handleSend} style={styles.button}>
          Search
        </button>
      </div>
      {/* Display the bot response */}
      {response && <div style={styles.responseBox}>{response}</div>}
    </div>
  );
};

// Styles for the component
const styles = {
  container: {
    width: '400px',
    margin: '20px auto',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    backgroundColor: '#f7f7f7',
    textAlign: 'center',
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  input: {
    flexGrow: 1,
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    marginRight: '10px',
  },
  button: {
    padding: '10px 15px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007BFF',
    color: '#fff',
    cursor: 'pointer',
  },
  responseBox: {
    marginTop: '15px',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#f1f1f1',
    textAlign: 'left',
    color: '#333',
    border: '1px solid #ddd',
  },
};

export default SpaceChatBot;
