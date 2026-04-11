import { saveAs } from "file-saver";
import { NeuralNetwork } from "./NeuralNetwork";

export const NN_INPUT_SIZE = 16;
export const NN_OUTPUT_SIZE = 3;
export const NN_HIDDEN_SIZE = 32;

let sharedNetwork: NeuralNetwork | null = null;
const OPFS_KEY = "tennis-nn";

async function getOPFSDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (!navigator.storage?.getDirectory) return null;
    return await navigator.storage.getDirectory();
  } catch {
    return null;
  }
}

async function saveToOPFS(data: string): Promise<boolean> {
  try {
    const dir = await getOPFSDirectory();
    if (!dir) return false;
    const fileHandle = await dir.getFileHandle(OPFS_KEY, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

async function loadFromOPFS(): Promise<string | null> {
  try {
    const dir = await getOPFSDirectory();
    if (!dir) return null;
    const fileHandle = await dir.getFileHandle(OPFS_KEY);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

export async function initNetworkFromOPFS(): Promise<void> {
  const data = await loadFromOPFS();
  if (data) {
    try {
      const parsed = JSON.parse(data);
      const nn = NeuralNetwork.fromJSON(parsed);
      setSharedNetwork(nn);
    } catch {
      // No valid saved network, use default
    }
  }
}

export async function autoSaveNetwork(): Promise<void> {
  if (!sharedNetwork) return;
  const data = JSON.stringify(sharedNetwork.toJSON());
  await saveToOPFS(data);
}

export function getSharedNetwork(): NeuralNetwork {
  if (!sharedNetwork) {
    sharedNetwork = new NeuralNetwork({
      inputSize: NN_INPUT_SIZE,
      hiddenSizes: [NN_HIDDEN_SIZE],
      outputSize: NN_OUTPUT_SIZE,
    });
  }
  return sharedNetwork;
}

export function setSharedNetwork(nn: NeuralNetwork) {
  sharedNetwork = nn;
}

export function saveNetworkToFile() {
  if (!sharedNetwork) return;
  const data = JSON.stringify(sharedNetwork.toJSON());
  const blob = new Blob([data], { type: "application/json" });
  saveAs(blob, "tennis-nn.json");
  saveToOPFS(data);
}

export function loadNetworkFromFile(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      const nn = NeuralNetwork.fromJSON(data);
      setSharedNetwork(nn);
    } catch (err) {
      console.error("Failed to load neural network:", err);
    }
  };
  reader.readAsText(file);
}

export interface TrainingSample {
  input: number[];
  target: number[];
}

const trainingBuffer: TrainingSample[] = [];
const MAX_BUFFER_SIZE = 10000;

export function addTrainingSample(input: number[], target: number[]) {
  if (trainingBuffer.length >= MAX_BUFFER_SIZE) {
    trainingBuffer.shift();
  }
  trainingBuffer.push({ input: [...input], target: [...target] });
}

let trainCallCount = 0;

export function trainNetwork(learningRate: number, batchSize: number) {
  if (!sharedNetwork || trainingBuffer.length < batchSize) return;
  
  for (let i = 0; i < batchSize; i++) {
    const idx = Math.floor(Math.random() * trainingBuffer.length);
    const sample = trainingBuffer[idx];
    sharedNetwork.train(sample.input, sample.target, learningRate);
  }
  
  trainCallCount++;
  if (trainCallCount >= 600) {
    trainCallCount = 0;
    autoSaveNetwork();
  }
}

export function getTrainingBufferSize(): number {
  return trainingBuffer.length;
}

export function extractInputs(
  playerX: number,
  playerY: number,
  playerZ: number,
  ballX: number,
  ballY: number,
  ballZ: number,
  ballVelX: number,
  ballVelY: number,
  ballVelZ: number,
  playerType: number,
  gravityY: number
): number[] {
  const ballComing = playerType === 0 ? ballVelZ < 0 : ballVelZ > 0;
  const ballOnMySide = playerType === 0 ? ballZ < 0 : ballZ > 0;
  
  return [
    playerX / 10,
    playerY / 5,
    playerZ / 12,
    ballX / 10,
    ballY / 5,
    ballZ / 12,
    ballVelX / 15,
    ballVelY / 15,
    ballVelZ / 15,
    gravityY / 20,
    ballComing ? 1 : 0,
    ballOnMySide ? 1 : 0,
    playerType,
    playerX > 0 ? 1 : -1,
    ballY > playerY + 1 ? 1 : 0,
    Math.abs(ballZ - playerZ),
  ];
}