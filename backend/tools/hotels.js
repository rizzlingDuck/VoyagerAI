const { ToolError, fetchJson } = require("../utils/http");

async function searchHotels({ locationName, budgetLevel, checkinDate, checkoutDate, signal }) {
  if (!process.env.RAPIDAPI_KEY) {
    throw new ToolError("RAPIDAPI_KEY is required for hotel search", {
      tool: "searchHotels",
      retryable: false,
    });
  }

  const rapidApiHost = "booking-com.p.rapidapi.com";
  const headers = {
    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
    "x-rapidapi-host": rapidApiHost,
  };

  const locationParams = new URLSearchParams({
    name: locationName,
    locale: "en-gb",
  });
  const locationsData = await fetchJson(
    `https://${rapidApiHost}/v1/hotels/locations?${locationParams.toString()}`,
    {
      tool: "searchHotels.locations",
      timeoutMs: 12000,
      signal,
      method: "GET",
      headers,
    }
  );

  if (!Array.isArray(locationsData) || locationsData.length === 0) {
    return [];
  }

  const validLocation = locationsData.find((loc) => loc.dest_type === "city") || locationsData[0];
  if (!validLocation?.dest_id) return [];

  const dates = normalizeHotelDates(checkinDate, checkoutDate);
  const numNights = Math.max(
    Math.ceil((new Date(dates.checkoutDate) - new Date(dates.checkinDate)) / (1000 * 60 * 60 * 24)),
    1
  );

  let orderBy = "popularity";
  if (budgetLevel === "$") orderBy = "price";
  else if (budgetLevel === "$$$") orderBy = "class_descending";

  const searchParams = new URLSearchParams({
    dest_id: validLocation.dest_id,
    dest_type: validLocation.dest_type,
    checkin_date: dates.checkinDate,
    checkout_date: dates.checkoutDate,
    room_number: "1",
    adults_number: "1",
    units: "metric",
    currency: "USD",
    locale: "en-gb",
    order_by: orderBy,
  });

  const searchData = await fetchJson(
    `https://${rapidApiHost}/v1/hotels/search?${searchParams.toString()}`,
    {
      tool: "searchHotels.search",
      timeoutMs: 15000,
      signal,
      method: "GET",
      headers,
    }
  );

  if (!Array.isArray(searchData?.result)) {
    return [];
  }

  return searchData.result.slice(0, 3).map((hotel) => {
    const totalStay = parseFloat(hotel.gross_price) || null;
    const perNightFromApi = parseFloat(
      hotel.composite_price_breakdown?.gross_amount_per_night?.value
    ) || null;
    const pricePerNight = perNightFromApi || (totalStay ? Math.round(totalStay / numNights) : null);
    const priceTotal = totalStay || (perNightFromApi ? Math.round(perNightFromApi * numNights) : null);

    return {
      name: hotel.hotel_name,
      rating: hotel.review_score_word
        ? `${hotel.review_score} (${hotel.review_score_word})`
        : hotel.review_score || "N/A",
      pricePerNight: pricePerNight || "N/A",
      priceTotal: priceTotal || "N/A",
      currency: hotel.currency_code || hotel.currency || "USD",
      lat: parseFloat(hotel.latitude),
      lng: parseFloat(hotel.longitude),
      url: hotel.url || null,
    };
  });
}

function normalizeHotelDates(checkinDate, checkoutDate) {
  if (checkinDate && checkoutDate) {
    return { checkinDate, checkoutDate };
  }

  const today = new Date();
  const checkin = new Date(today);
  checkin.setMonth(checkin.getMonth() + 1);

  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 3);

  return {
    checkinDate: formatDate(checkin),
    checkoutDate: formatDate(checkout),
  };
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

module.exports = { searchHotels };
