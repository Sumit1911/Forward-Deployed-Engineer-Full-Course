export const calculatorTool = {
  type: "function",
  function: {
    name: "calculator",
    description: "Perform basic arithmetic calculations.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["add", "subtract", "multiply", "divide", "power", "mod"],
          description: "The arithmetic operation to perform.",
        },
        a: {
          type: "number",
          description: "The first number.",
        },
        b: {
          type: "number",
          description: "The second number.",
        },
      },
      required: ["operation", "a", "b"],
    },
  },
};

const operationAliases = {
  addition: "add",
  plus: "add",
  subtraction: "subtract",
  minus: "subtract",
  multiplication: "multiply",
  times: "multiply",
  division: "divide",
  power: "power",
  exponent: "power",
  modulo: "mod",
  modulus: "mod",
  mode: "mod",
  remainder: "mod",
};

function normalizeOperation(operation) {
  if (typeof operation !== "string") {
    throw new Error("Operation must be a string");
  }

  const normalized = operation.trim().toLowerCase();
  return operationAliases[normalized] || normalized;
}

function assertNumber(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
}

export function calculate({ operation, a, b }) {
  const normalizedOperation = normalizeOperation(operation);

  assertNumber(a, "a");
  assertNumber(b, "b");

  switch (normalizedOperation) {
    case "add":
      return a + b;
    case "subtract":
      return a - b;
    case "multiply":
      return a * b;
    case "divide":
      if (b === 0) {
        throw new Error("Cannot divide by zero");
      }
      return a / b;
    case "power":
      return a ** b;
    case "mod":
      if (b === 0) {
        throw new Error("Cannot calculate modulo by zero");
      }
      return a % b;
    default:
      throw new Error(`Unsupported calculator operation: ${operation}`);
  }
}

export async function executeCalculatorTool(args) {
  return {
    operation: normalizeOperation(args.operation),
    result: calculate(args),
  };
}
