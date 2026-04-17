async function getCoordinates(locationName) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VoyagerAI_Portfolio_Project/1.0'
      }
    });
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const lat = data[0].lat;
      const lon = data[0].lon;
      return [parseFloat(lat), parseFloat(lon)];
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding Error:", error);
    return null;
  }
}

module.exports = { getCoordinates };
