import { useCallback, useRef, useState } from "react";
import type { SensorMessage, IncomingSensorData } from "../types/machine";

const MAX_POINTS = 30; // how many points stay visible per chart before scrolling off

/**
 * Keeps a rolling time-series buffer for each metric in a MachineReading.
 * Call `addMessage` every time a new reading arrives (from MQTT, a
 * WebSocket, an HTTP poll, whatever your real data source is).
 */
export function useMachineSimulator(maxPoints: number = MAX_POINTS) {
  const [data, setData] = useState<SensorMessage>({
    vibrationData: [],
    flameData: [],
  });

  const maxPointsRef = useRef(maxPoints);
  maxPointsRef.current = maxPoints;

  const addMessage = useCallback((message: IncomingSensorData) => {
    const timestamp = Date.now();
    const vibVal = message.vibrationData ?? message.vibrationTriggered;
    const flameVal = message.flameData ?? message.flameDetected;

    setData((prev) => {
      const cap = maxPointsRef.current;
      return {
        vibrationData:
          vibVal !== undefined
            ? [...prev.vibrationData, { timestamp, value: vibVal }].slice(-cap)
            : prev.vibrationData,
        flameData:
          flameVal !== undefined
            ? [...prev.flameData, { timestamp, value: flameVal }].slice(-cap)
            : prev.flameData,
      };
    });
  }, []);

  return { data, addMessage };
}
