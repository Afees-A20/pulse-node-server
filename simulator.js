function generateTelemetry(systemState) {
  return {
    transformerTemp: Math.floor(Math.random() * 20) + 60,
    powerLoad: Math.floor(Math.random() * 40) + 50,
    breakerStatus: systemState.breakerStatus,
  };
}

module.exports = generateTelemetry;