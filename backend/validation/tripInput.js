function validateTripInput(body) {
  const { destination, origin, startDate, endDate, days } = body;

  if (!destination || destination.trim().length < 2) {
    return "Please enter a valid destination (at least 2 characters).";
  }

  if (!origin || origin.trim().length < 2) {
    return "Please enter a valid departure city or airport code (at least 2 characters).";
  }

  if (!startDate || !endDate) {
    return "Travel dates are required.";
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Invalid travel dates. Please select valid start and end dates.";
  }

  if (end < start) {
    return "End date must be after start date.";
  }

  const computedDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const numDays = Number(days);
  if (!Number.isInteger(numDays) || numDays < 1 || numDays > 30) {
    return "Trip duration must be between 1 and 30 days.";
  }

  if (numDays !== computedDays) {
    return "Trip duration does not match the selected dates.";
  }

  return null;
}

module.exports = { validateTripInput };
