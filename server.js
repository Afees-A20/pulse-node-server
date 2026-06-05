require("dotenv").config();


// ENV VALIDATION

const CONTROL_PASSWORD = process.env.CONTROL_PASSWORD;

if (!CONTROL_PASSWORD) {
  throw new Error("CONTROL_PASSWORD missing in .env file");
}

// CORE IMPORTS

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const telemetryRoutes = require("./routes/telemetryRoutes");
const alarmRoutes = require("./routes/alarmRoutes");

const validateBreakerAction = require("./validators/breakerValidator");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");

const scadaLogger = require("./utils/scadaLogger");
const generateTelemetry = require("./simulator");
const Alarm = require("./models/Alarm");
const connectDB = require("./config/db");


// APP INIT

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.set("io", io);


// STATE

let systemState = {
  breakerStatus: "Closed",
};

const activeAlarms = {};
let isShuttingDown = false;


// MIDDLEWARE
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(helmet());

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { message: "Too many requests, slow down." },
}));

app.use(express.json());
app.use(requestLogger);


// SWAGGER

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// ROUTES

app.use("/api/telemetry", telemetryRoutes);
app.use("/api/alarms", alarmRoutes);


// ROOT

app.get("/", (req, res) => {
  res.json({ message: "PulseNode Backend Running" });
});


// BREAKER CONTROL

app.post("/control/breaker", validateBreakerAction, (req, res) => {
  const { action, password } = req.body;

  if (password !== CONTROL_PASSWORD) {
    return res.status(401).json({
      message: "Invalid control password",
    });
  }

  systemState.breakerStatus =
    action === "OPEN" ? "Open" : "Closed";

  scadaLogger("BREAKER_STATE_CHANGE", {
    action,
    newState: systemState.breakerStatus,
  });

  io.emit("systemState", systemState);

  res.json({
    message: "Breaker updated",
    state: systemState,
  });
});

// SOCKET

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});


// SCADA LOOP

const scadaInterval = setInterval(() => {
  const data = generateTelemetry(systemState);

  scadaLogger("TELEMETRY_GENERATED", {
    breakerStatus: systemState.breakerStatus,
  });

  io.emit("telemetry", data);
  io.emit("systemState", systemState);

  const temperature = parseFloat(data.transformerTemp || 0);
  const load = parseFloat(data.powerLoad || 0);

  if (temperature > 75) {
    triggerAlarm("TEMP_HIGH", {
      message: "Transformer Temperature High",
      severity: "Critical",
    });
  }

  if (temperature < 70) {
    clearAlarm("TEMP_HIGH");
  }

  if (load > 90) {
    triggerAlarm("LOAD_HIGH", {
      message: "System Load High",
      severity: "Warning",
    });
  }

  if (load < 85) {
    clearAlarm("LOAD_HIGH");
  }
}, 2000);


// ALARM ENGINE

function triggerAlarm(key, payload) {
  if (activeAlarms[key]) return;

  activeAlarms[key] = true;

  scadaLogger("ALARM_TRIGGERED", {
    key,
    severity: payload.severity,
  });

  Alarm.create({
    ...payload,
    key,
    acknowledged: false,
    createdAt: new Date(),
  })
    .then((saved) => io.emit("alarm:new", saved))
    .catch((err) => console.error(err));
}

function clearAlarm(key) {
  if (!activeAlarms[key]) return;

  activeAlarms[key] = false;

  scadaLogger("ALARM_CLEARED", { key });
}


// ERROR HANDLER

app.use(errorHandler);


// DB + SERVER START

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`SCADA server running on port ${PORT}`);
  });
});


// GRACEFUL SHUTDOWN

process.on("SIGINT", async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("Shutting down SCADA system...");

  clearInterval(scadaInterval);

  io.close();

  server.close(async () => {
    try {
      const mongoose = require("mongoose");
      await mongoose.connection.close();
    } catch (err) {
      console.error("Mongo shutdown error:", err);
    }

    console.log("Server closed cleanly");
    process.exit(0);
  });
});