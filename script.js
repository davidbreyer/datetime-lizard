const sourceInput = document.querySelector("#sourceInput");
const sourceFormat = document.querySelector("#sourceFormat");
const displayZone = document.querySelector("#displayZone");
const includeMilliseconds = document.querySelector("#includeMilliseconds");
const useTwentyFourHour = document.querySelector("#useTwentyFourHour");
const nowUtcButton = document.querySelector("#nowUtcButton");
const nowLocalButton = document.querySelector("#nowLocalButton");
const convertButton = document.querySelector("#convertButton");
const copyButton = document.querySelector("#copyButton");
const saveButton = document.querySelector("#saveButton");
const clearButton = document.querySelector("#clearButton");
const outputRows = document.querySelector("#outputRows");
const sqlRows = document.querySelector("#sqlRows");
const csharpRows = document.querySelector("#csharpRows");
const status = document.querySelector("#status");
const stats = document.querySelector("#stats");
const inputMeta = document.querySelector("#inputMeta");
const resultCount = document.querySelector("#resultCount");
const sqlCount = document.querySelector("#sqlCount");
const csharpCount = document.querySelector("#csharpCount");
const releaseStamp = document.querySelector("#releaseStamp");
const mathDirection = document.querySelector("#mathDirection");
const daysInput = document.querySelector("#daysInput");
const hoursInput = document.querySelector("#hoursInput");
const minutesInput = document.querySelector("#minutesInput");
const applyMathButton = document.querySelector("#applyMathButton");

const appRelease = "20260614-1003";
const dotnetEpochTicks = 621355968000000000n;
const ticksPerMillisecond = 10000n;
let currentRows = [];
let currentSqlRows = [];
let currentCsharpRows = [];
let currentDate = new Date();

sourceInput.value = new Date().toISOString();
renderReleaseStamp();
convertInput();

nowUtcButton.addEventListener("click", () => setDateInput(new Date(), "utc"));
nowLocalButton.addEventListener("click", () => setDateInput(new Date(), "local"));
convertButton.addEventListener("click", convertInput);
copyButton.addEventListener("click", copyReport);
saveButton.addEventListener("click", saveReport);
clearButton.addEventListener("click", clearAll);
applyMathButton.addEventListener("click", applyDateMath);
sourceInput.addEventListener("input", () => {
  updateCounts();
  setStatus("Ready", "idle");
});

[sourceFormat, displayZone, includeMilliseconds, useTwentyFourHour].forEach((control) => {
  control.addEventListener("change", convertInput);
});

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => setSample(button.dataset.sample));
});

function setDateInput(date, mode) {
  currentDate = date;
  sourceFormat.value = "iso";
  sourceInput.value = mode === "local" ? formatLocalInput(date) : date.toISOString();
  convertInput();
}

function setSample(kind) {
  const date = new Date();

  if (kind === "unix-seconds") {
    sourceInput.value = String(Math.floor(date.getTime() / 1000));
    sourceFormat.value = "unix-seconds";
  } else if (kind === "unix-milliseconds") {
    sourceInput.value = String(date.getTime());
    sourceFormat.value = "unix-milliseconds";
  } else if (kind === "dotnet-ticks") {
    sourceInput.value = String(unixMillisecondsToTicks(date.getTime()));
    sourceFormat.value = "dotnet-ticks";
  } else {
    sourceInput.value = date.toISOString();
    sourceFormat.value = "iso";
  }

  convertInput();
}

function convertInput() {
  try {
    const parsed = parseInput(sourceInput.value, sourceFormat.value);
    currentDate = parsed.date;
    currentRows = buildRows(currentDate, parsed.source);
    currentSqlRows = buildSqlRows(currentDate);
    currentCsharpRows = buildCsharpRows(currentDate);
    renderRows();
    renderSnippetRows(sqlRows, sqlCount, currentSqlRows);
    renderSnippetRows(csharpRows, csharpCount, currentCsharpRows);
    updateCounts();
    setStatus(`Converted ${parsed.source}`, "valid");
  } catch (error) {
    currentRows = [];
    currentSqlRows = [];
    currentCsharpRows = [];
    renderRows();
    renderSnippetRows(sqlRows, sqlCount, currentSqlRows);
    renderSnippetRows(csharpRows, csharpCount, currentCsharpRows);
    updateCounts();
    setStatus(error.message, "error");
  }
}

function parseInput(input, format) {
  const value = input.trim();

  if (!value) {
    throw new Error("Enter a date, Unix timestamp, or .NET ticks value");
  }

  const selected = format === "auto" ? detectFormat(value) : format;
  let date;

  if (selected === "unix-seconds") {
    date = new Date(Number(value) * 1000);
  } else if (selected === "unix-milliseconds") {
    date = new Date(Number(value));
  } else if (selected === "dotnet-ticks") {
    date = new Date(Number((BigInt(value) - dotnetEpochTicks) / ticksPerMillisecond));
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error("Could not parse that value");
  }

  return {
    date,
    source: sourceName(selected)
  };
}

function detectFormat(value) {
  if (/^-?\d+$/.test(value)) {
    if (value.length >= 17) {
      return "dotnet-ticks";
    }

    if (Math.abs(Number(value)) > 9999999999) {
      return "unix-milliseconds";
    }

    return "unix-seconds";
  }

  return "iso";
}

function sourceName(format) {
  return {
    iso: "ISO/date string",
    "unix-seconds": "Unix seconds",
    "unix-milliseconds": "Unix milliseconds",
    "dotnet-ticks": ".NET ticks"
  }[format] || "auto-detected input";
}

function buildRows(date, source) {
  const rows = [
    makeRow("Source", source),
    makeRow("UTC ISO", formatIso(date)),
    makeRow("Local ISO", formatLocalIso(date)),
    makeRow("Unix Seconds", String(Math.floor(date.getTime() / 1000))),
    makeRow("Unix Milliseconds", String(date.getTime())),
    makeRow(".NET Ticks", String(unixMillisecondsToTicks(date.getTime()))),
    makeRow("RFC 1123", date.toUTCString()),
    makeRow("Date Only", formatLocalDate(date)),
    makeRow("Time Only", formatLocalTime(date)),
    makeRow("Relative", formatRelative(date))
  ];

  if (displayZone.value === "utc") {
    return rows;
  }

  return [
    rows[0],
    rows[2],
    rows[1],
    ...rows.slice(3)
  ];
}

function makeRow(label, value) {
  return { label, value };
}

function renderRows() {
  outputRows.textContent = "";

  if (!currentRows.length) {
    const empty = document.createElement("div");
    empty.className = "output-row";
    empty.append(makeSpan("output-label", "Status"), makeSpan("output-value", "No converted values yet."), document.createElement("span"));
    outputRows.append(empty);
  } else {
    const fragment = document.createDocumentFragment();

    currentRows.forEach((row) => {
      const element = document.createElement("div");
      const copyButton = document.createElement("button");
      element.className = "output-row";
      copyButton.className = "copy-row";
      copyButton.type = "button";
      copyButton.textContent = "Copy";
      copyButton.addEventListener("click", () => copyText(row.value, `Copied ${row.label}`));
      element.append(makeSpan("output-label", row.label), makeSpan("output-value", row.value), copyButton);
      fragment.append(element);
    });

    outputRows.append(fragment);
  }

  resultCount.textContent = `${currentRows.length} ${currentRows.length === 1 ? "value" : "values"}`;
}

function renderSnippetRows(container, counter, rows) {
  container.textContent = "";

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "output-row snippet-row";
    empty.append(makeSpan("output-label", "Status"), makeSpan("output-value", "No snippets yet."), document.createElement("span"));
    container.append(empty);
  } else {
    const fragment = document.createDocumentFragment();

    rows.forEach((row) => {
      const element = document.createElement("div");
      const copyButton = document.createElement("button");
      element.className = "output-row snippet-row";
      copyButton.className = "copy-row";
      copyButton.type = "button";
      copyButton.textContent = "Copy";
      copyButton.addEventListener("click", () => copyText(row.value, `Copied ${row.label}`));
      element.append(makeSpan("output-label", row.label), makeSpan("output-value", row.value), copyButton);
      fragment.append(element);
    });

    container.append(fragment);
  }

  counter.textContent = `${rows.length} ${rows.length === 1 ? "snippet" : "snippets"}`;
}

function makeSpan(className, text) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function formatIso(date) {
  return includeMilliseconds.checked ? date.toISOString() : date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function formatLocalIso(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const offset = `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
  const milliseconds = includeMilliseconds.checked ? `.${String(date.getMilliseconds()).padStart(3, "0")}` : "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${milliseconds}${offset}`;
}

function formatLocalInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatLocalDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatLocalTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: includeMilliseconds.checked ? 3 : undefined,
    hour12: !useTwentyFourHour.checked
  }).format(date);
}

function formatRelative(date) {
  const diff = date.getTime() - Date.now();
  const absolute = Math.abs(diff);
  const direction = diff >= 0 ? "from now" : "ago";
  const days = Math.floor(absolute / 86400000);
  const hours = Math.floor((absolute % 86400000) / 3600000);
  const minutes = Math.floor((absolute % 3600000) / 60000);

  if (days > 0) {
    return `${days}d ${hours}h ${direction}`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${direction}`;
  }

  return `${minutes}m ${direction}`;
}

function buildSqlRows(date) {
  const utc = formatSqlDateTime2Utc(date);
  const local = formatLocalIso(date);
  const dateOnly = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  const timeOnly = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${includeMilliseconds.checked ? `.${String(date.getMilliseconds()).padStart(3, "0")}` : ""}`;

  return [
    makeRow("datetime2 UTC", `CONVERT(datetime2(3), '${utc}', 126)`),
    makeRow("datetimeoffset", `CONVERT(datetimeoffset(3), '${local}', 126)`),
    makeRow("WHERE >= UTC", `WHERE [CreatedUtc] >= CONVERT(datetime2(3), '${utc}', 126)`),
    makeRow("BETWEEN day", `WHERE [CreatedUtc] >= CONVERT(date, '${dateOnly}') AND [CreatedUtc] < DATEADD(day, 1, CONVERT(date, '${dateOnly}'))`),
    makeRow("date literal", `CONVERT(date, '${dateOnly}')`),
    makeRow("time literal", `CONVERT(time(3), '${timeOnly}')`)
  ];
}

function buildCsharpRows(date) {
  const utcIso = formatIso(date);
  const unixMilliseconds = date.getTime();

  return [
    makeRow("DateTimeOffset", `DateTimeOffset.Parse("${utcIso}", CultureInfo.InvariantCulture)`),
    makeRow("Unix ms", `DateTimeOffset.FromUnixTimeMilliseconds(${unixMilliseconds})`),
    makeRow("UTC DateTime", `DateTime.Parse("${utcIso}", CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal)`),
    makeRow("LINQ >= DTO", `.Where(x => x.CreatedUtc >= DateTimeOffset.Parse("${utcIso}", CultureInfo.InvariantCulture))`),
    makeRow("LINQ date range", `.Where(x => x.CreatedUtc >= DateTimeOffset.Parse("${utcIso}", CultureInfo.InvariantCulture) && x.CreatedUtc < DateTimeOffset.Parse("${formatIso(new Date(date.getTime() + 86400000))}", CultureInfo.InvariantCulture))`),
    makeRow("Ticks", `new DateTime(${unixMillisecondsToTicks(date.getTime())}L, DateTimeKind.Utc)`)
  ];
}

function formatSqlDateTime2Utc(date) {
  const milliseconds = includeMilliseconds.checked ? `.${String(date.getUTCMilliseconds()).padStart(3, "0")}` : "";
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}${milliseconds}`;
}

function unixMillisecondsToTicks(milliseconds) {
  return dotnetEpochTicks + BigInt(milliseconds) * ticksPerMillisecond;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function applyDateMath() {
  const sign = mathDirection.value === "add" ? 1 : -1;
  const delta = (
    Number(daysInput.value || 0) * 86400000 +
    Number(hoursInput.value || 0) * 3600000 +
    Number(minutesInput.value || 0) * 60000
  ) * sign;

  if (!currentDate || Number.isNaN(currentDate.getTime())) {
    convertInput();
  }

  const next = new Date(currentDate.getTime() + delta);
  sourceInput.value = next.toISOString();
  sourceFormat.value = "iso";
  convertInput();
}

async function copyReport() {
  await copyText(JSON.stringify(buildReport(), null, 2), "Copied DateTime report");
}

function saveReport() {
  const blob = new Blob([JSON.stringify(buildReport(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "datetime-lizard-report.json";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Saved DateTime report", "valid");
}

function buildReport() {
  return {
    app: "DateTime Lizard",
    release: appRelease,
    input: sourceInput.value,
    options: {
      sourceFormat: sourceFormat.value,
      displayZone: displayZone.value,
      includeMilliseconds: includeMilliseconds.checked,
      useTwentyFourHour: useTwentyFourHour.checked
    },
    rows: currentRows,
    sqlSnippets: currentSqlRows,
    csharpSnippets: currentCsharpRows
  };
}

async function copyText(text, message) {
  try {
    if (!navigator.clipboard) {
      throw new Error("Clipboard API unavailable");
    }

    await navigator.clipboard.writeText(text);
    setStatus(message, "valid");
  } catch {
    if (copyTextFallback(text)) {
      setStatus(message, "valid");
    } else {
      setStatus("Could not copy", "error");
    }
  }
}

function copyTextFallback(text) {
  const scratch = document.createElement("textarea");
  scratch.value = text;
  scratch.setAttribute("readonly", "");
  scratch.style.position = "fixed";
  scratch.style.inset = "0 auto auto 0";
  scratch.style.opacity = "0";
  document.body.append(scratch);
  scratch.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    scratch.remove();
  }
}

function clearAll() {
  sourceInput.value = "";
  currentRows = [];
  currentSqlRows = [];
  currentCsharpRows = [];
  renderRows();
  renderSnippetRows(sqlRows, sqlCount, currentSqlRows);
  renderSnippetRows(csharpRows, csharpCount, currentCsharpRows);
  updateCounts();
  setStatus("Ready", "idle");
}

function setStatus(message, type) {
  status.textContent = message;
  status.className = `status-pill status-${type}`;
}

function updateCounts() {
  inputMeta.textContent = `${sourceInput.value.length} chars`;
  stats.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local timezone detected by your browser";
}

function renderReleaseStamp() {
  releaseStamp.textContent = `Version: ${appRelease}`;
}
