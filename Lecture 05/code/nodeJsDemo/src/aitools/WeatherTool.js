const DEFAULT_OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

export const weatherTool = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Get the current weather for a city using an external weather API.",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "The city name, for example Delhi, Mumbai, London, or New York.",
        },
        units: {
          type: "string",
          enum: ["metric", "imperial", "standard"],
          description: "Temperature units. Use metric for Celsius, imperial for Fahrenheit, or standard for Kelvin.",
        },
      },
      required: ["city"],
    },
  },
};

function normalizeCity(city) {
  if (typeof city !== "string" || !city.trim()) {
    throw new Error("City is required");
  }

  return city.trim();
}

function normalizeUnits(units = "metric") {
  if (!["metric", "imperial", "standard"].includes(units)) {
    throw new Error("Units must be metric, imperial, or standard");
  }

  return units;
}

function getTemperatureUnit(units) {
  if (units === "imperial") {
    return "F";
  }

  if (units === "standard") {
    return "K";
  }

  return "C";
}

export async function executeWeatherTool({ city, units = "metric" }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is required");
    console.error("OPENWEATHER_API_KEY is required");
  }

  const normalizedCity = normalizeCity(city);
  const normalizedUnits = normalizeUnits(units);
  const url = new URL(process.env.OPENWEATHER_BASE_URL || DEFAULT_OPENWEATHER_BASE_URL);

  url.searchParams.set("q", normalizedCity);
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", normalizedUnits);

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Weather API request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const condition = data.weather?.[0]?.description || "unknown";

  return {
    city: data.name || normalizedCity,
    country: data.sys?.country,
    condition,
    temperature: data.main?.temp,
    feelsLike: data.main?.feels_like,
    humidity: data.main?.humidity,
    windSpeed: data.wind?.speed,
    units: normalizedUnits,
    temperatureUnit: getTemperatureUnit(normalizedUnits),
  };
}
