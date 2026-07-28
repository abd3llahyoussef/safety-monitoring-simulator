export interface SensorControlsPanelProps {
  onInjectFault: () => void;
  onInjectFlame: () => void;
  onReset: () => void;
}

/**
 * Manual triggers for the simulated sensors - stands in for physically
 * knocking the vibration switch or holding a lighter near the flame sensor
 * during a demo.
 */
export default function SensorControlsPanel({ onInjectFault, onInjectFlame, onReset }: SensorControlsPanelProps) {
  return (
    <div className="sensor-panel">
      <h3>Simulate sensor events</h3>
      <p>Trigger events manually to see the fused health + safety status react in real time.</p>
      <div className="sensor-panel__actions">
        <button onClick={onInjectFault} type="button">
          Inject vibration fault
        </button>
        <button className="sensor-panel__hazard" onClick={onInjectFlame} type="button">
          Simulate flame detected
        </button>
        <button onClick={onReset} type="button">
          Reset wear
        </button>
      </div>
    </div>
  );
}
