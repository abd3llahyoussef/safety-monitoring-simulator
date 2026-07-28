import LiveLineChart from "./components/LiveLineChart";
import { useMachineSimulator } from "./hooks/useMachineSimulator";
import { useEffect } from "react";
import { IncomingSensorData } from "./types/machine";
import "./App.css";

const digitalLabel = (value: number) => (value === 1 ? "Detected" : "Clear");

export default function App() {
  const { data, addMessage } = useMachineSimulator(30);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socket.onmessage = (event) => {
      const message: IncomingSensorData = JSON.parse(event.data);
      console.log("message", message);
      addMessage(message);
    };
    return () => socket.close();
  }, [addMessage]);


  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>Equipment Health &amp; Safety Monitoring</h1>
        <p>
          Edge sensor fusion from two digital sensors — a vibration sensor and a flame sensor — aggregated
          into one health + safety picture.
        </p>
      </header>

      <div className="dashboard__grid">
        <LiveLineChart
          title="Vibration sensor"
          unit=""
          color="#a78bfa"
          points={data.vibrationData}
          yMin={0}
          yMax={1}
          stepped
          formatLatest={(v) => (v === 1 ? "TRIGGERED" : "CLEAR")}
          formatValue={digitalLabel}
        />
        <LiveLineChart
          title="Flame sensor"
          unit=""
          color="#f97316"
          points={data.flameData}
          yMin={0}
          yMax={1}
          stepped
          formatLatest={(v) => (v === 1 ? "FLAME" : "CLEAR")}
          formatValue={digitalLabel}
        />
      </div>
    </div>
  );
}
