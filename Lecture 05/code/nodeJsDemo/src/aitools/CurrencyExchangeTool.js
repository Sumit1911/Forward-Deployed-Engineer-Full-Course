const DEFAULT_FRANKFURTER_BASE_URL = "https://api.frankfurter.dev";

export const currencyExchangeTool = {
  type: "function",
  function: {
    name: "convert_currency",
    description: "Convert an amount from one currency to another using live exchange rates.",
    parameters: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "The source ISO 4217 currency code, for example USD, EUR, GBP, or INR.",
        },
        to: {
          type: "string",
          description: "The target ISO 4217 currency code, for example USD, EUR, GBP, or INR.",
        },
        amount: {
          type: "number",
          description: "The amount to convert.",
        },
      },
      required: ["from", "to", "amount"],
    },
  },
};

function normalizeCurrencyCode(code, name) {
  if (typeof code !== "string" || !code.trim()) {
    throw new Error(`${name} currency code is required`);
  }

  const normalizedCode = code.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalizedCode)) {
    throw new Error(`${name} currency code must be a 3-letter ISO currency code`);
  }

  return normalizedCode;
}

function normalizeAmount(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new Error("Amount must be a finite number");
  }

  if (amount < 0) {
    throw new Error("Amount must be greater than or equal to 0");
  }

  return amount;
}

export async function executeCurrencyExchangeTool({ from, to, amount }) {
  const fromCurrency = normalizeCurrencyCode(from, "From");
  const toCurrency = normalizeCurrencyCode(to, "To");
  const normalizedAmount = normalizeAmount(amount);
  const baseUrl = process.env.FRANKFURTER_BASE_URL || DEFAULT_FRANKFURTER_BASE_URL;
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/v2/rate/${fromCurrency}/${toCurrency}`);

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Currency exchange API request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (typeof data.rate !== "number") {
    throw new Error(`Currency exchange API error: ${data.message || "missing exchange rate"}`);
  }

  const convertedAmount = normalizedAmount * data.rate;

  return {
    from: data.base || fromCurrency,
    to: data.quote || toCurrency,
    amount: normalizedAmount,
    rate: data.rate,
    convertedAmount,
    date: data.date,
  };
}
