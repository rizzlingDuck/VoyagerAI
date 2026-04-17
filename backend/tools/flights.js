async function findFlights(originCode, destCode, departureDate, returnDate) {
  try {
    let url = `https://google-flights2.p.rapidapi.com/api/v1/searchFlights?departure_id=${originCode}&arrival_id=${destCode}&outbound_date=${departureDate}&currency=USD&adults=1`;
    if (returnDate) url += `&return_date=${returnDate}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'google-flights2.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    });

    const jsonData = await response.json();

    // API returns: { data: { itineraries: { topFlights: [...] } } }
    const topFlights = jsonData.data?.itineraries?.topFlights || [];

    return topFlights.slice(0, 3).map(flight => ({
      airline: flight.flights?.[0]?.airline || 'Unknown Airline',
      price: flight.price || null,
      currency: 'USD'
    }));
  } catch (error) {
    console.error('Error fetching flights:', error);
    return [];
  }
}

module.exports = { findFlights };
