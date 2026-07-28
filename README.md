# IoT DC Motor Health & Safety Monitoring System ⚡🔥

An end-to-end **Industrial IoT (IIoT) Equipment Monitoring & Sensor Fusion System** designed to track machine condition (bearing wear/vibration) and detect safety hazards (fire/flame) in real time. 

The project features a **two-tier micro-controller architecture (Arduino + ESP8266)** communicating over **UART**, uploading encrypted telemetry over **TLS to a cloud MQTT broker (HiveMQ)**, backed by a **Node.js/Express WebSocket server** and a **React + TypeScript + Chart.js HMI Dashboard**.

---

## 📑 Table of Contents
- [Architecture & System Flow](#-architecture--system-flow)
- [Key Features](#-key-features)
- [Hardware & Circuit Wiring](#-hardware--circuit-wiring)
- [Project Structure](#-project-structure)
- [Software Components](#-software-components)
  - [1. Arduino Firmware (Flame Sensor Node)](#1-arduino-firmware-flame-sensor-node)
  - [2. ESP8266 Firmware (Edge Gateway & Vibration Node)](#2-esp8266-firmware-edge-gateway--vibration-node)
  - [3. Backend Web Service (Node.js + WebSockets + MQTT + PostgreSQL)](#3-backend-web-service-nodejs--websockets--mqtt--postgresql)
  - [4. Frontend Dashboard (React + Vite + Chart.js)](#4-frontend-dashboard-react--vite--chartjs)
- [MQTT Telemetry Schema](#-mqtt-telemetry-schema)
- [Installation & Getting Started](#-installation--getting-started)
- [Sensor Fusion & Predictive Maintenance Logic](#-sensor-fusion--predictive-maintenance-logic)
- [License & Credits](#-license--credits)

---

## 🏗️ Architecture & System Flow

The system employs **Edge Aggregation & Sensor Fusion** to isolate safety-critical hazard alarms from predictive maintenance scoring:

```
  ┌─────────────────┐
  │  Flame Sensor   │
  └────────┬────────┘
           │ (Digital D7)
           ▼
  ┌─────────────────┐      UART Serial      ┌───────────────────┐      MQTT / TLS 8883     ┌───────────────────┐
  │   Arduino Node  │ ────────────────────> │  ESP8266 Gateway  │ ───────────────────────> │   HiveMQ Cloud    │
  │ (Flame Reader)  │  (SoftwareSerial)     │(Vibration Reader) │    (BearSSL Encrypted)   │    MQTT Broker    │
  └─────────────────┘                       └─────────┬─────────┘                          └─────────┬─────────┘
                                                      │                                              │
                                             ┌────────┴─────────┐                                    │ Subscriptions
                                             │ Vibration Sensor │                                    │ (flameData &
                                             └──────────────────┘                                    │  vibrationData)
                                                (Digital D7)                                         ▼
                                                                                           ┌───────────────────┐
                                                                                           │  Backend Service  │
                                                                                           │ (Node.js/Express) │
                                                                                           └─────────┬─────────┘
                                                                                                     │ WebSockets
                                                                                                     ▼
                                                                                           ┌───────────────────┐
                                                                                           │  React Dashboard  │
                                                                                           │  (HMI Simulator)  │
                                                                                           └───────────────────┘
```

1. **Sensor Data Collection**:
   - **Arduino** continuously polls the **Flame Sensor**.
   - **ESP8266** continuously polls the **Vibration Sensor** (digital vibration switch).
2. **Inter-Chip Communication**:
   - Arduino sends flame telemetry to ESP8266 over SoftwareSerial UART (`FlameData:<0|1>`) at 115200 baud.
3. **Secure MQTT Ingestion**:
   - ESP8266 syncs time via NTP, validates TLS SSL certificates via LittleFS BearSSL certificate store, and securely connects to **HiveMQ Cloud MQTT Broker** on port `8883`.
   - ESP8266 formats both Flame and Vibration readings into JSON payloads and publishes them to dedicated MQTT topics (`flameData` and `vibrationData`).
4. **Real-time Pipeline**:
   - The backend service connects to HiveMQ Cloud, ingests MQTT packets, persists reading history into PostgreSQL, and broadcasts telemetry to active frontend UI clients via **WebSockets**.
5. **Interactive HMI Dashboard**:
   - The React dashboard renders digital step charts, tracks rolling vibration trip rates, projects **Remaining Useful Life (RUL)**, and triggers pulsing emergency hazard banners upon flame detection.

---

## ✨ Key Features

- ⚡ **Multi-MCU Tiered Hardware Architecture**: Distributes sensing responsibilities between low-cost MCU nodes (Arduino) and Wi-Fi edge gateways (ESP8266) over UART.
- 🔒 **Enterprise-Grade TLS Security**: Hardware-level MQTT encryption over TLS (port 8883) using BearSSL and certificate validation.
- 🧠 **Edge Aggregation & Sensor Fusion**: Denoises raw vibration pulses into a rolling window trip rate for accurate wear rate estimation, while keeping flame detection on a zero-latency priority path.
- 📡 **Real-time WebSocket Streaming**: Zero-latency dashboard updates without web polling overhead.
- 📊 **Step-Line Digital Waveform Rendering**: Visualizes binary `0/1` sensor transitions cleanly using Chart.js step-line interpolation.
- 🚨 **Independent Safety Interlock**: SIL-inspired design where flame alerts override the UI immediately regardless of mechanical health scores.

---

## 🔌 Hardware & Circuit Wiring

### Components Required
1. **Arduino UNO / Nano / Pro Mini** (1x)
2. **ESP8266 NodeMCU / WeMos D1 Mini** (1x)
3. **Digital Flame Sensor Module** (IR Flame Detector) (1x)
4. **Digital Vibration Sensor Switch** (SW-420 or similar) (1x)
5. Jumper Wires & Breadboard

### Pin Interconnection Table

| Component / Node | Pin Name | Connected To | Notes |
| :--- | :--- | :--- | :--- |
| **Flame Sensor** | OUT | Arduino Pin `D7` | Digital reading (`0` = Safe, `1` = Flame Detected) |
| **Flame Sensor** | VCC / GND | 5V / GND | Power supply |
| **Vibration Sensor** | OUT | ESP8266 Pin `D7` | Digital vibration pulse detection |
| **Vibration Sensor**| VCC / GND | 3.3V or 5V / GND | Power supply |
| **Arduino** | Pin `3` (TX) | ESP8266 Pin `D5` (RX) | UART SoftwareSerial line (115200 baud) |
| **Arduino** | Pin `2` (RX) | ESP8266 Pin `D6` (TX) | UART SoftwareSerial line (115200 baud) |
| **Arduino & ESP** | GND | Common GND | **Essential**: Shared ground reference for UART |

> ⚠️ **Note**: If using a 5V Arduino with 3.3V ESP8266 RX lines, a logic level converter or resistor voltage divider (e.g. 1kΩ / 2kΩ) on the Arduino TX -> ESP RX line is recommended for long-term stability.

---

## 📁 Project Structure

```
.
├── DC_motor/
│   ├── arduinoCode/
│   │   └── arduinoCode.ino         # Arduino C++ sketch for Flame Sensor & UART transmission
│   └── esp8266Code/
│       └── esp8266Code.ino       # ESP8266 C++ sketch for Vibration, TLS, & MQTT publishing
├── safety monitoring-simulator/    # React + Vite + TypeScript Frontend Application
│   ├── src/
│   │   ├── components/             # Live Charts, Sensor Controls, & Health Cards
│   │   ├── hooks/                  # Machine simulation & sensor fusion hooks
│   │   ├── types/                  # Machine state definitions & types
│   │   └── App.tsx                 # Main HMI dashboard UI layout
│   ├── package.json
│   └── vite.config.ts
├── safety monitoring-simulator-backend/ # Node.js + Express + MQTT + WebSocket Backend Service
│   ├── src/
│   │   ├── client.ts               # PostgreSQL database client connection
│   │   └── server.ts               # Express API, MQTT subscriber, & WebSocket broadcaster
│   ├── .env                        # Server & MQTT configuration parameters
│   └── package.json
└── README.md                       # Main Project Documentation
```

---

## 🛠️ Software Components

### 1. Arduino Firmware (`DC_motor/arduinoCode/arduinoCode.ino`)
- Uses `SoftwareSerial` on pins 2 (RX) and 3 (TX).
- Polls `flamePin` (D7) every second.
- Transmits data across UART with format:
  ```text
  FlameData:1\n
  ```

### 2. ESP8266 Firmware (`DC_motor/esp8266Code/esp8266Code.ino`)
- Configures `SoftwareSerial` on pins `D5` (RX) and `D6` (TX) to listen to the Arduino node.
- Reads `vibrationPin` (`D7`).
- Mounts `LittleFS` filesystem to access SSL CA root certificates (`/certs.idx`, `/certs.ar`).
- Synchronizes system clock via NTP (`pool.ntp.org`).
- Connects securely to **HiveMQ Cloud MQTT Broker** (`port 8883`).
- Constructs JSON telemetry strings and publishes to MQTT topics `flameData` and `vibrationData`.

### 3. Backend Web Service (`safety monitoring-simulator-backend/`)
- Built with **Node.js, Express, TypeScript, `mqtt`, `ws`, and `pg`**.
- Subscribes to `flameData` and `vibrationData` MQTT topics.
- Forwards incoming payload frames directly to connected web clients via WebSockets (`ws`).
- Exposes REST endpoint (`GET /`) to query historical sensor logs from PostgreSQL database.

### 4. Frontend Dashboard (`safety monitoring-simulator/`)
- Built with **React 18, Vite, TypeScript, and Chart.js**.
- Employs custom step-line rendering for digital waveforms (`0/1` binary outputs).
- Includes an interactive fault injection suite to test system reaction under simulated mechanical breakdown or fire emergencies.

---

## 📡 MQTT Telemetry Schema

The ESP8266 publishes structured JSON packets over SSL/TLS:

### 1. Vibration Data (`vibrationData`)
```json
{
  "vibrationData": 1
}
```

### 2. Flame Data (`flameData`)
```json
{
  "flameData": 0
}
```

---

## 🚀 Installation & Getting Started

### Prerequisites
- **Arduino IDE** (with ESP8266 Board Manager installed)
- **Node.js** (v18+ recommended)
- **PostgreSQL** database instance (optional, for log persistence)

### 1. Flash Arduino Firmware
1. Open [`DC_motor/arduinoCode/arduinoCode.ino`](file:///c:/Users/User/Desktop/Arduino/DC%20motor%20monitoring%20system/DC_motor/arduinoCode/arduinoCode.ino) in Arduino IDE.
2. Select your Arduino board (e.g. Arduino Uno) and correct COM port.
3. Upload code.

### 2. Flash ESP8266 Firmware
1. Install required Arduino libraries: `ESP8266WiFi`, `PubSubClient`, `ArduinoJson`, `Time`, `CertStoreBearSSL`.
2. Open [`DC_motor/esp8266Code/esp8266Code.ino`](file:///c:/Users/User/Desktop/Arduino/DC%20motor%20monitoring%20system/DC_motor/esp8266Code/esp8266Code.ino).
3. Update Wi-Fi Credentials (`ssid`, `pass`) and MQTT broker parameters if using custom credentials.
4. Upload certificates to ESP8266 LittleFS filesystem using the LittleFS Upload plugin.
5. Select your ESP8266 board (e.g. NodeMCU 1.0) and upload code.

### 3. Run Backend Server
```bash
cd "safety monitoring-simulator-backend"

# Install dependencies
npm install

# Configure environment variables in .env
# Start development server
npm run dev
```

### 4. Run Frontend Dashboard
```bash
cd "safety monitoring-simulator"

# Install dependencies
npm install

# Start local development server
npm run dev
```
Open your browser at `http://localhost:5173` to access the live dashboard.

---

## 🔬 Sensor Fusion & Predictive Maintenance Logic

| Metric | Calculation Method | Purpose |
| :--- | :--- | :--- |
| **Vibration Trip Rate** | Sliding window calculation across last $N=10$ digital samples | Filters out single mechanical bumps/noise; measures continuous vibration frequency. |
| **Equipment Wear Rate** | Baseline wear accumulation + Weighted Trip Rate ($\text{Rate}_{\text{vib}}$) | Models bearing wear degradation over time. |
| **Health Index (%)** | $(1 - \text{Accumulated Wear}) \times 100\%$ | Provides human-readable condition percentage for HMI operators. |
| **Remaining Useful Life (RUL)** | Projected time until $\text{Wear} = 100\%$ based on current wear velocity | Enables proactive maintenance scheduling before catastrophic failure occurs. |
| **Safety Alarm** | Instant digital evaluation ($\text{Flame} = 1$) | Triggers zero-delay safety trip and hazard alert banner. |

---

## 📜 License & Credits

- Developed for **IoT Industrial Monitoring & Predictive Maintenance Systems**.
- Open-Source under the [MIT License](LICENSE).
