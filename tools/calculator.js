/**
 * 計算機工具 - 安全的數學表達式計算
 */

function parseNumber(expr, index) {
  let start = index;

  while (index < expr.length && /[0-9.]/.test(expr[index])) {
    index += 1;
  }

  const numberText = expr.slice(start, index);
  if (!numberText || numberText.split(".").length > 2) {
    throw new Error("Unsafe expression: invalid number");
  }

  return { value: Number(numberText), index };
}

function parsePrimary(expr, index) {
  while (index < expr.length && /\s/.test(expr[index])) {
    index += 1;
  }

  const char = expr[index];

  if (char === "(") {
    const result = parseExpression(expr, index + 1);
    if (expr[result.index] !== ")") {
      throw new Error("Unsafe expression: missing closing parenthesis");
    }
    return { value: result.value, index: result.index + 1 };
  }

  if (char === "+" || char === "-") {
    const sign = char === "-" ? -1 : 1;
    const result = parsePrimary(expr, index + 1);
    return { value: sign * result.value, index: result.index };
  }

  if (/[0-9]/.test(char)) {
    return parseNumber(expr, index);
  }

  throw new Error("Unsafe expression: invalid token");
}

function parseTerm(expr, index) {
  let result = parsePrimary(expr, index);

  while (true) {
    while (result.index < expr.length && /\s/.test(expr[result.index])) {
      result.index += 1;
    }

    const operator = expr[result.index];
    if (operator !== "*" && operator !== "/" && operator !== "%") {
      return result;
    }

    const rhs = parsePrimary(expr, result.index + 1);
    if (operator === "*") {
      result.value *= rhs.value;
    } else if (operator === "/") {
      if (rhs.value === 0) {
        throw new Error("Division by zero is not allowed");
      }
      result.value /= rhs.value;
    } else {
      if (rhs.value === 0) {
        throw new Error("Modulo by zero is not allowed");
      }
      result.value %= rhs.value;
    }

    result.index = rhs.index;
  }
}

function parseExpression(expr, index) {
  let result = parseTerm(expr, index);

  while (true) {
    while (result.index < expr.length && /\s/.test(expr[result.index])) {
      result.index += 1;
    }

    const operator = expr[result.index];
    if (operator !== "+" && operator !== "-") {
      return result;
    }

    const rhs = parseTerm(expr, result.index + 1);
    if (operator === "+") {
      result.value += rhs.value;
    } else {
      result.value -= rhs.value;
    }
    result.index = rhs.index;
  }
}

/**
 * 計算數學表達式
 * @param {Object} params - 參數物件
 * @param {string} params.expression - 要計算的數學表達式
 * @returns {number} 計算結果
 */
export function calculate({ expression }) {
  if (typeof expression !== "string") {
    throw new Error("Unsafe expression: expression must be a string");
  }

  const trimmed = expression.trim();
  if (!trimmed) {
    throw new Error("Unsafe expression: empty input");
  }

  if (!/^[0-9+\-*/%().\s]+$/.test(trimmed)) {
    throw new Error("Unsafe expression: only numbers and arithmetic operators are allowed");
  }

  const result = parseExpression(trimmed, 0);

  while (result.index < trimmed.length && /\s/.test(trimmed[result.index])) {
    result.index += 1;
  }

  if (result.index !== trimmed.length) {
    throw new Error("Unsafe expression: unexpected token");
  }

  return Number(result.value.toFixed(10));
}
