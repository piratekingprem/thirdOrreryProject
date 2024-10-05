import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './NeoPage.css'; // Assuming we follow your CSS structure

const NeoPage = () => {
  const { name } = useParams(); // Extract the NEO's name from the route params
  const [neoDetails, setNeoDetails] = useState(null);

  useEffect(() => {
    // Assuming we have access to the NEO data from the main API response
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

  if (!neoDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="neo-page">
      <h1>{neoDetails.name}</h1>
      <p><strong>Diameter:</strong> {neoDetails.diameter} km</p>
      <p><strong>Velocity:</strong> {neoDetails.velocity} km/h</p>
      <p><strong>Miss Distance:</strong> {neoDetails.missDistance} km</p>
      <p><strong>Potentially Hazardous:</strong> {neoDetails.hazard ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default NeoPage;
