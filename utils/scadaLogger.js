function scadaLogger(event, payload = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...payload,
  };

  // Keep console for bootcamp visibility
  console.log("[SCADA EVENT]", JSON.stringify(logEntry, null, 2));

  return logEntry;
}

module.exports = scadaLogger;