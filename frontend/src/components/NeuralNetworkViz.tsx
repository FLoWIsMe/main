import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./NeuralNetworkViz.module.css";
import { AIThinkingData } from "../types";

interface NeuralNetworkVizProps {
  aiThinking: AIThinkingData | null;
}

interface ProbabilityData {
  name: string;
  from: number;
  to: number;
}

interface LayerRenderProps {
  layerName: string;
  activations: number[];
}

const NeuralNetworkViz: React.FC<NeuralNetworkVizProps> = ({ aiThinking }) => {
  if (!aiThinking) {
    return (
      <div className={styles.neuralVizContainer}>
        <h3>🧠 AI Neural Network</h3>
        <p>Start the AI demo to see the neural network in action!</p>
      </div>
    );
  }

  const { neural_activations, predicted_move, encoded_state } = aiThinking;

  // Change JSX.Element to React.ReactElement
  const renderNeuronLayer = ({
    layerName,
    activations,
  }: LayerRenderProps): React.ReactElement => {
    const maxActivation = Math.max(...activations.map(Math.abs));

    return (
      <div className={styles.layer} key={layerName}>
        <h4>{layerName.replace("_", " ").toUpperCase()}</h4>
        <div className={styles.neurons}>
          {activations.map((activation, index) => {
            const intensity = Math.abs(activation) / (maxActivation || 1);
            const hue = activation >= 0 ? 120 : 0; // Green for positive, red for negative
            const backgroundColor = `hsla(${hue}, 70%, 50%, ${intensity})`;

            return (
              <div
                key={index}
                className={styles.neuron}
                style={{ backgroundColor }}
                title={`Neuron ${index + 1}: ${activation.toFixed(3)}`}
              >
                {activation.toFixed(2)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const probabilityData: ProbabilityData[] = [
    {
      name: "Tower 1",
      from: predicted_move.from_probabilities[0],
      to: predicted_move.to_probabilities[0],
    },
    {
      name: "Tower 2",
      from: predicted_move.from_probabilities[1],
      to: predicted_move.to_probabilities[1],
    },
    {
      name: "Tower 3",
      from: predicted_move.from_probabilities[2],
      to: predicted_move.to_probabilities[2],
    },
  ];

  const customTooltipFormatter = (value: any): string => {
    return `${(Number(value) * 100).toFixed(1)}%`;
  };

  return (
    <div className={styles.neuralVizContainer}>
      <h3>🧠 AI Neural Network Visualization</h3>

      <div className={styles.networkStructure}>
        {Object.entries(neural_activations).map(([layerName, activations]) => {
          if (Array.isArray(activations)) {
            return renderNeuronLayer({ layerName, activations });
          }
          return null;
        })}
      </div>

      <div className={styles.moveAnalysis}>
        <h4>Move Decision Analysis</h4>
        <div className={styles.predictionDetails}>
          <div className={styles.predictedMove}>
            <strong>Predicted Move:</strong> Tower {predicted_move.from_tower} →
            Tower {predicted_move.to_tower}
            <br />
            <strong>Confidence:</strong>{" "}
            {(predicted_move.confidence * 100).toFixed(1)}%
          </div>
        </div>

        <div className={styles.probabilityChart}>
          <h5>Tower Selection Probabilities</h5>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={probabilityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={customTooltipFormatter} />
              <Bar dataKey="from" fill="#ff9800" name="From Tower" />
              <Bar dataKey="to" fill="#4caf50" name="To Tower" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.gameStateEncoding}>
        <h4>Game State Encoding</h4>
        <p>How the AI sees the current game state:</p>
        <div className={styles.encodedVector}>
          {encoded_state.map((value, index) => (
            <span
              key={index}
              className={`${styles.encodedBit} ${
                value > 0 ? styles.active : ""
              }`}
              title={`Position ${index + 1}: ${value}`}
            >
              {value.toFixed(0)}
            </span>
          ))}
        </div>
        <div className={styles.encodingLegend}>
          <small>
            Positions 1-4: Tower 1 (A,B,C,D) | Positions 5-8: Tower 2 (A,B,C,D)
            | Positions 9-12: Tower 3 (A,B,C,D)
          </small>
        </div>
      </div>
    </div>
  );
};

export default NeuralNetworkViz;
