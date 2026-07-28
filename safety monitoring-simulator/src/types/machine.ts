/** A single point on a time-series chart. */
export interface TimeSeriesPoint {
  timestamp: number; // ms since epoch, used for the x-axis
  value: number;
}

/** A digital sensor reading: 0 = inactive/clear, 1 = triggered/detected. */
export type DigitalState = 0 | 1;

/**
 * One reading from the (simulated) edge node. In a real deployment this is
 * the exact payload an ESP32 would publish after reading two digital GPIO
 * sensors (vibration switch, flame sensor), fusing them locally, and only
 * then sending the result upstream.
 */
export interface MachineReading {
  vibrationTriggered: DigitalState; // digital vibration switch (e.g. SW-420): 1 = shock/vibration over its mechanical threshold
  flameDetected: DigitalState; // digital flame sensor (e.g. IR flame module): 1 = flame/IR signature detected

}

export type HealthStatus = "Healthy" | "Warning" | "Critical";
export type SafetyStatus = "Safe" | "Hazard";

export interface HealthState {
  score: number; // 0-100, 100 = brand new
  status: HealthStatus; // mechanical/wear status, derived entirely from the fused vibration-event rate
  /** Estimated remaining useful life in hours, based on current wear rate. Null = not enough data yet. */
  rulHours: number | null;
  safety: SafetyStatus; // independent safety channel, driven entirely by the flame sensor
}

/**
 * A single digital vibration sample is noisy (one knock shouldn't mean
 * "failing"), so the edge node aggregates it over a short rolling window
 * before deciding mechanical status. This "trigger rate" (fraction of
 * recent ticks that read 1) is the fused signal that actually drives wear
 * accumulation and the health status/alarms below.
 */
export const VIBRATION_EVENT_WINDOW = 10; // ticks
export const VIBRATION_WARNING_RATE = 0.3; // >=30% of the window triggered
export const VIBRATION_CRITICAL_RATE = 0.6; // >=60% of the window triggered


export interface SensorMessage {
  vibrationData: TimeSeriesPoint[];
  flameData: TimeSeriesPoint[];
}

export interface IncomingSensorData {
  vibrationData?: number;
  flameData?: number;
  vibrationTriggered?: DigitalState;
  flameDetected?: DigitalState;
}

