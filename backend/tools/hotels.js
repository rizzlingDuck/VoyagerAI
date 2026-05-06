async function searchHotels({ locationName, budgetLevel, checkinDate, checkoutDate }) {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = 'booking-com.p.rapidapi.com';
    
    // ==========================================
    // CALL 1: Get location dest_id
    // ==========================================
    const localeUrl = `https://${rapidApiHost}/v1/hotels/locations?name=${encodeURIComponent(locationName)}&locale=en-gb`;
    const locationRes = await fetch(localeUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': rapidApiHost
      }
    });
    
    const locationsData = await locationRes.json();
    if (!locationsData || !Array.isArray(locationsData) || locationsData.length === 0) {
      return [];
    }
    
    // Extract dest_id from the first valid result (preferably a city)
    const validLocation = locationsData.find(loc => loc.dest_type === 'city') || locationsData[0];
    if (!validLocation || !validLocation.dest_id) return [];
    
    const dest_id = validLocation.dest_id;
    const dest_type = validLocation.dest_type;

    // ==========================================
    // CALL 2: Search Hotels
    // ==========================================
    // Use provided dates, or fallback to next month if missing
    let checkinStr = checkinDate;
    let checkoutStr = checkoutDate;
    
    if (!checkinStr || !checkoutStr) {
      const today = new Date();
      const checkin = new Date(today);
      checkin.setMonth(checkin.getMonth() + 1);
      
      const checkout = new Date(checkin);
      checkout.setDate(checkout.getDate() + 3);
      
      const formatDt = (d) => d.toISOString().split('T')[0];
      checkinStr = formatDt(checkin);
      checkoutStr = formatDt(checkout);
    }

    let orderBy = 'popularity';
    if (budgetLevel === '$') orderBy = 'price';
    else if (budgetLevel === '$$$') orderBy = 'class_descending';

    const searchUrl = `https://${rapidApiHost}/v1/hotels/search?dest_id=${dest_id}&dest_type=${dest_type}&checkin_date=${checkinStr}&checkout_date=${checkoutStr}&room_number=1&adults_number=1&units=metric&currency=USD&locale=en-gb&order_by=${orderBy}`;
    
    const searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': rapidApiHost
      }
    });
    const searchData = await searchRes.json();

    if (!searchData || !searchData.result || !Array.isArray(searchData.result)) {
      return [];
    }

    // ==========================================
    // FORMATTING: Top 3 Hotels
    // ==========================================
    return searchData.result.slice(0, 3).map(hotel => ({
      name: hotel.hotel_name,
      rating: hotel.review_score_word ? `${hotel.review_score} (${hotel.review_score_word})` : hotel.review_score || 'N/A',
      price: hotel.gross_price || hotel.composite_price_breakdown?.gross_amount_per_night?.value || 'N/A',
      currency: hotel.currency_code || hotel.currency || 'USD',
      lat: hotel.latitude,
      lng: hotel.longitude,
      url: hotel.url || null
    }));

  } catch (error) {
    console.error('[Hotels Tool] Error searching hotels:', error.message);
    return [];
  }
}

module.exports = { searchHotels };
