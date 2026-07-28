# Equipment Health & Safety Monitor (Sensor Fusion Edition)

Vite + React + TypeScript + Chart.js. Two digital sensors — a **vibration
switch** and a **flame sensor**, each reporting 0/1 — fused at the edge into
one equipment-health + safety picture. No motor, no analog channel: this is
a focused sensor-fusion demo.

## Why this is more than "predictive maintenance"

Combining a mechanical signal (vibration) with a safety signal (flame) turns
this into two things at once:

1. **Predictive maintenance**: is the equipment wearing out? (vibration)
2. **Safety monitoring**: is there an active hazard right now? (flame)

That combination — multiple sensor types, aggregated and interpreted
together on one dashboard — is a real, named pattern in Industrial IoT:

### Sensor fusion / edge aggregation

In a real deployment, an ESP32 (or similar MCU) at the machine reads the
vibration switch and flame sensor on digital GPIO pins, **combines them into
one structured payload locally, and only then sends it upstream**
(MQTT/HTTP) — instead of shipping two raw, disconnected values. That local
combination step is *edge aggregation*, and using multiple sensors together
to reach one more-reliable conclusion than any single sensor could give
alone is *sensor fusion*. Two concrete examples of it in this codebase:

- **The digital vibration signal is debounced/aggregated before use.** A
  single vibration switch read of `1` is noisy — it could be a one-off
  knock. `useMachineSimulator.ts` keeps a rolling window of the last
  `VIBRATION_EVENT_WINDOW` (10) raw 0/1 reads and computes a **trip rate**
  (e.g. "60% of the last 10 ticks were triggered"). Wear accumulation and
  the mechanical health status are driven by that fused rate, not the raw
  per-tick sample — exactly the kind of denoising an edge node would do
  before deciding anything.
- **Two independent channels feed one dashboard, but are judged
  separately.** Mechanical health (vibration trip rate) and safety (flame)
  are computed as two independent statuses (`HealthState.status` vs.
  `HealthState.safety`) and only combined visually — a flame event overrides
  the UI with a pulsing hazard banner regardless of what the mechanical
  health score says. This mirrors how a real safety system keeps a
  SIL-rated interlock decision separate from a predictive-maintenance
  score, even though both show up on the same HMI.

## Run it

```bash
npm install
npm run dev
```

No hardware needed — `useMachineSimulator` generates the data on its own, so
you'll see baseline activity immediately. Use the two buttons to trigger
events on demand:

- **"Inject vibration fault"** — simulates bearing wear: trip probability
  rises, so the trip rate, health %, and predicted RUL all react.
- **"Simulate flame detected"** — forces the flame sensor to `1` for a few
  ticks (like a sensor's debounce window) and raises the hazard banner.

## What's simulated, and how

- **Vibration switch (digital, 0/1)**: each tick has a probability of
  tripping that rises with accumulated wear. Rendered as a step chart, since
  it's a digital signal, not a continuous one.
- **Flame sensor (digital, 0/1)**: normally clear; "Simulate flame detected"
  forces it to `1` for a few ticks. Also rendered as a step chart.
- **Wear / health / RUL**: wear accumulates at a small constant baseline
  rate, boosted by the fused vibration trip rate. Health % = `(1 - wear) *
  100`. RUL is a linear projection of remaining wear headroom over the
  current wear rate — the socket where a trained RUL model would go in a
  real system.
- **Safety**: entirely independent of wear/health — driven only by the raw
  flame reading, since a fire doesn't need "confirming" the way a vibration
  blip does.

## File map

- `src/types/machine.ts` — `DigitalState`, `MachineReading`, fused-window constants, `HealthState` (mechanical status + safety)
- `src/hooks/useMachineSimulator.ts` — wear + digital sensor simulation and edge-style aggregation
- `src/components/LiveLineChart.tsx` — standalone chart; `stepped` + `formatLatest`/`formatValue` props render digital 0/1 signals as clean step waves
- `src/components/SensorControlsPanel.tsx` — manual triggers to simulate a vibration fault or a flame event
- `src/components/HealthStatusCard.tsx` — mechanical health %, RUL, and an independent safety badge with a pulsing hazard banner
- `src/App.tsx` — wires it all together, shows the fused trip-rate footnote

## Swapping in real sensors

Replace the body of the `setInterval` callback in `useMachineSimulator.ts`
with real reads, keeping the same output shape:

```ts
{
  vibrationTriggered: 0 | 1; // digital GPIO from a vibration switch (e.g. SW-420)
  flameDetected: 0 | 1;      // digital GPIO from a flame sensor module
}
```

On the ESP32 side, do the aggregation (rolling trip-rate window) locally
before publishing over MQTT/WebSocket — that's the "edge" part of edge
aggregation. The frontend's `vibrationEventRate` logic can move server-side
or on-device once you're past the prototyping stage.
