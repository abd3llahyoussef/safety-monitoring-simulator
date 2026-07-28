import type { HealthState } from "../types/machine";

const STATUS_COLOR: Record<HealthState["status"], string> = {
  Healthy: "#22c55e",
  Warning: "#f59e0b",
  Critical: "#ef4444",
};

const SAFETY_COLOR: Record<HealthState["safety"], string> = {
  Safe: "#22c55e",
  Hazard: "#ef4444",
};

export default function HealthStatusCard({ score, status, rulHours, safety }: HealthState) {
  const color = STATUS_COLOR[status];
  const safetyColor = SAFETY_COLOR[safety];
  const isHazard = safety === "Hazard";

  return (
    <div className={`health-card${isHazard ? " health-card--hazard" : ""}`}>
      {isHazard && <div className="health-card__hazard-banner">🔥 HAZARD — FLAME DETECTED</div>}

      <div className="health-card__row">
        <div>
          <span className="health-card__label">Equipment health (mechanical)</span>
          <div className="health-card__score" style={{ color }}>
            {score}%
          </div>
        </div>
        <span className="health-card__badge" style={{ background: `${color}22`, color }}>
          {status}
        </span>
      </div>

      <div className="health-card__bar">
        <div className="health-card__bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>

      <div className="health-card__rul">
        <span className="health-card__label">Predicted remaining useful life</span>
        <span className="health-card__rul-value">
          {rulHours === null ? "Calculating…" : `~${rulHours} sim-hours`}
        </span>
      </div>

      <div className="health-card__safety-row">
        <span className="health-card__label">Safety (flame sensor)</span>
        <span className="health-card__badge" style={{ background: `${safetyColor}22`, color: safetyColor }}>
          {safety}
        </span>
      </div>

      <p className="health-card__note">
        Health/RUL come from a fused vibration-trip rate + wear model; safety is an independent
        channel from the flame sensor. In a real deployment both would be trained/tuned models —
        this is the socket where they'd plug in.
      </p>
    </div>
  );
}
