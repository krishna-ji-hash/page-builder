/**
 * Convert mysql2-style placeholders to node-postgres ($1, $2, …).
 *
 * Supports:
 * - positional `?`
 * - named `:name` (object params)
 * - `IN (?)` array expansion → `IN ($1,$2,…)`
 * - empty IN array → `IN (NULL)` (never matches ordinary equality)
 *
 * Skips replacements inside:
 * - single/double-quoted string literals
 * - quoted identifiers ("…")
 * - line (`--`) and block (`/* … *\/`) comments
 * - PostgreSQL casts (`::type`)
 * - URL schemes (`://`)
 *
 * Repeated named placeholders reuse the same `$n` and a single values entry.
 *
 * @param {string} sql
 * @param {unknown[] | Record<string, unknown> | undefined | null} params
 * @returns {{ text: string, values: unknown[] }}
 */
export function convertSqlPlaceholders(sql, params) {
  const source = String(sql ?? '');
  if (params == null) {
    return { text: source, values: [] };
  }

  if (Array.isArray(params)) {
    return convertPositional(source, params);
  }

  if (typeof params === 'object') {
    return convertNamed(source, /** @type {Record<string, unknown>} */ (params));
  }

  throw new TypeError('SQL params must be an array, object, null, or undefined');
}

/**
 * @param {string} sql
 * @param {unknown[]} params
 */
function convertPositional(sql, params) {
  let i = 0;
  let paramIndex = 0;
  let out = '';
  /** @type {unknown[]} */
  const values = [];

  while (i < sql.length) {
    const ch = sql[i];

    if (ch === "'" || ch === '"') {
      const { chunk, next } = readQuoted(sql, i);
      out += chunk;
      i = next;
      continue;
    }

    if (ch === '-' && sql[i + 1] === '-') {
      const { chunk, next } = readLineComment(sql, i);
      out += chunk;
      i = next;
      continue;
    }

    if (ch === '/' && sql[i + 1] === '*') {
      const { chunk, next } = readBlockComment(sql, i);
      out += chunk;
      i = next;
      continue;
    }

    if (ch === ':' && sql[i + 1] === ':') {
      out += '::';
      i += 2;
      continue;
    }

    if (ch === ':' && sql[i + 1] === '/') {
      out += ':/';
      i += 2;
      continue;
    }

    if (ch === '?') {
      if (paramIndex >= params.length) {
        throw new Error(
          `Not enough SQL parameters: expected at least ${paramIndex + 1}, got ${params.length}`
        );
      }

      const inList = isInQuestionPlaceholder(sql, i);
      const value = params[paramIndex++];

      if (inList && Array.isArray(value)) {
        if (value.length === 0) {
          out += 'NULL';
        } else {
          const parts = [];
          for (const item of value) {
            values.push(item);
            parts.push(`$${values.length}`);
          }
          out += parts.join(',');
        }
        i += 1;
        continue;
      }

      values.push(value);
      out += `$${values.length}`;
      i += 1;
      continue;
    }

    out += ch;
    i += 1;
  }

  return { text: out, values };
}

/**
 * @param {string} sql
 * @param {Record<string, unknown>} params
 */
function convertNamed(sql, params) {
  let i = 0;
  let out = '';
  /** @type {unknown[]} */
  const values = [];
  /** @type {Map<string, number>} */
  const nameToIndex = new Map();

  while (i < sql.length) {
    const ch = sql[i];

    if (ch === "'" || ch === '"') {
      const { chunk, next } = readQuoted(sql, i);
      out += chunk;
      i = next;
      continue;
    }

    if (ch === '-' && sql[i + 1] === '-') {
      const { chunk, next } = readLineComment(sql, i);
      out += chunk;
      i = next;
      continue;
    }

    if (ch === '/' && sql[i + 1] === '*') {
      const { chunk, next } = readBlockComment(sql, i);
      out += chunk;
      i = next;
      continue;
    }

    // PostgreSQL cast ::type — never a named placeholder
    if (ch === ':' && sql[i + 1] === ':') {
      out += '::';
      i += 2;
      continue;
    }

    // URL schemes like https://
    if (ch === ':' && sql[i + 1] === '/') {
      out += ':/';
      i += 2;
      continue;
    }

    if (ch === ':' && isIdentStart(sql[i + 1])) {
      let j = i + 1;
      while (j < sql.length && isIdentContinue(sql[j])) j += 1;
      const name = sql.slice(i + 1, j);

      if (!(name in params)) {
        throw new Error(`Missing named SQL parameter: ${name}`);
      }

      const value = params[name];
      const inList = isInNamedPlaceholder(sql, i, j);

      if (inList && Array.isArray(value)) {
        if (value.length === 0) {
          out += 'NULL';
        } else {
          const parts = [];
          for (const item of value) {
            values.push(item);
            parts.push(`$${values.length}`);
          }
          out += parts.join(',');
        }
        i = j;
        continue;
      }

      let slot = nameToIndex.get(name);
      if (slot == null) {
        values.push(value);
        slot = values.length;
        nameToIndex.set(name, slot);
      }
      out += `$${slot}`;
      i = j;
      continue;
    }

    if (ch === '?') {
      throw new Error('Positional ? placeholders cannot be mixed with named object params');
    }

    out += ch;
    i += 1;
  }

  return { text: out, values };
}

/**
 * True when `?` at index is the sole token inside `IN ( ? )`.
 * @param {string} sql
 * @param {number} qIndex
 */
function isInQuestionPlaceholder(sql, qIndex) {
  let k = qIndex - 1;
  while (k >= 0 && /\s/.test(sql[k])) k -= 1;
  if (k < 0 || sql[k] !== '(') return false;
  let j = qIndex + 1;
  while (j < sql.length && /\s/.test(sql[j])) j += 1;
  if (j >= sql.length || sql[j] !== ')') return false;

  let before = k - 1;
  while (before >= 0 && /\s/.test(sql[before])) before -= 1;
  let wEnd = before + 1;
  let wStart = wEnd - 1;
  while (wStart >= 0 && /[A-Za-z]/.test(sql[wStart])) wStart -= 1;
  wStart += 1;
  return sql.slice(wStart, wEnd).toUpperCase() === 'IN';
}

/**
 * @param {string} sql
 * @param {number} colonIndex
 * @param {number} nameEnd
 */
function isInNamedPlaceholder(sql, colonIndex, nameEnd) {
  let k = colonIndex - 1;
  while (k >= 0 && /\s/.test(sql[k])) k -= 1;
  if (k < 0 || sql[k] !== '(') return false;
  let j = nameEnd;
  while (j < sql.length && /\s/.test(sql[j])) j += 1;
  if (j >= sql.length || sql[j] !== ')') return false;

  let before = k - 1;
  while (before >= 0 && /\s/.test(sql[before])) before -= 1;
  let wEnd = before + 1;
  let wStart = wEnd - 1;
  while (wStart >= 0 && /[A-Za-z]/.test(sql[wStart])) wStart -= 1;
  wStart += 1;
  return sql.slice(wStart, wEnd).toUpperCase() === 'IN';
}

/** @param {string} sql @param {number} start */
function readQuoted(sql, start) {
  const quote = sql[start];
  let i = start + 1;
  let out = quote;
  while (i < sql.length) {
    const ch = sql[i];
    out += ch;
    if (ch === quote) {
      // SQL escaped quote '' or ""
      if (sql[i + 1] === quote) {
        out += quote;
        i += 2;
        continue;
      }
      return { chunk: out, next: i + 1 };
    }
    // backslash-escape (non-standard but safe to skip one char)
    if (ch === '\\' && i + 1 < sql.length) {
      out += sql[i + 1];
      i += 2;
      continue;
    }
    i += 1;
  }
  return { chunk: out, next: i };
}

/** @param {string} sql @param {number} start */
function readLineComment(sql, start) {
  let i = start;
  while (i < sql.length && sql[i] !== '\n') i += 1;
  return { chunk: sql.slice(start, i), next: i };
}

/** @param {string} sql @param {number} start */
function readBlockComment(sql, start) {
  let i = start + 2;
  while (i < sql.length - 1) {
    if (sql[i] === '*' && sql[i + 1] === '/') {
      return { chunk: sql.slice(start, i + 2), next: i + 2 };
    }
    i += 1;
  }
  return { chunk: sql.slice(start), next: sql.length };
}

/** @param {string | undefined} ch */
function isIdentStart(ch) {
  return Boolean(ch && /[A-Za-z_]/.test(ch));
}

/** @param {string | undefined} ch */
function isIdentContinue(ch) {
  return Boolean(ch && /[A-Za-z0-9_]/.test(ch));
}
