export interface NeuralNetworkConfig {
  inputSize: number;
  hiddenSizes: number[];
  outputSize: number;
}

export class NeuralNetwork {
  private inputSize: number;
  private hiddenSizes: number[];
  private outputSize: number;
  private weights1: number[][];
  private biases1: number[];
  private weights2: number[][];
  private biases2: number[];

  constructor(config: NeuralNetworkConfig) {
    this.inputSize = config.inputSize;
    this.hiddenSizes = config.hiddenSizes;
    this.outputSize = config.outputSize;
    this.weights1 = this.createMatrix(this.inputSize, this.hiddenSizes[0]);
    this.biases1 = new Array(this.hiddenSizes[0]).fill(0);
    this.weights2 = this.createMatrix(this.hiddenSizes[0], this.outputSize);
    this.biases2 = new Array(this.outputSize).fill(0);
    this.initializeWeights();
  }

  private createMatrix(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () => Array(cols).fill(0));
  }

  private initializeWeights() {
    const scale1 = Math.sqrt(2 / this.inputSize);
    for (let i = 0; i < this.weights1.length; i++) {
      for (let j = 0; j < this.weights1[i].length; j++) {
        this.weights1[i][j] = (Math.random() - 0.5) * 2 * scale1;
      }
    }
    const scale2 = Math.sqrt(2 / this.hiddenSizes[0]);
    for (let i = 0; i < this.weights2.length; i++) {
      for (let j = 0; j < this.weights2[i].length; j++) {
        this.weights2[i][j] = (Math.random() - 0.5) * 2 * scale2;
      }
    }
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private reluDeriv(x: number): number {
    return x > 0 ? 1 : 0;
  }

  private tanh(x: number): number {
    return Math.tanh(x);
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  forward(inputs: number[]): number[] {
    const hidden = new Array(this.hiddenSizes[0]).fill(0);
    for (let j = 0; j < this.hiddenSizes[0]; j++) {
      let sum = this.biases1[j];
      for (let i = 0; i < this.inputSize; i++) {
        sum += inputs[i] * this.weights1[i][j];
      }
      hidden[j] = this.relu(sum);
    }

    const outputs = new Array(this.outputSize).fill(0);
    for (let j = 0; j < this.outputSize; j++) {
      let sum = this.biases2[j];
      for (let i = 0; i < this.hiddenSizes[0]; i++) {
        sum += hidden[i] * this.weights2[i][j];
      }
      outputs[j] = this.tanh(sum);
    }
    return outputs;
  }

  train(inputs: number[], targets: number[], learningRate: number) {
    const hidden: number[] = new Array(this.hiddenSizes[0]).fill(0);
    for (let j = 0; j < this.hiddenSizes[0]; j++) {
      let sum = this.biases1[j];
      for (let i = 0; i < this.inputSize; i++) {
        sum += inputs[i] * this.weights1[i][j];
      }
      hidden[j] = this.relu(sum);
    }

    const outputs: number[] = new Array(this.outputSize).fill(0);
    for (let j = 0; j < this.outputSize; j++) {
      let sum = this.biases2[j];
      for (let i = 0; i < this.hiddenSizes[0]; i++) {
        sum += hidden[i] * this.weights2[i][j];
      }
      outputs[j] = this.tanh(sum);
    }

    const outputErrors = new Array(this.outputSize).fill(0);
    for (let i = 0; i < this.outputSize; i++) {
      outputErrors[i] = (targets[i] - outputs[i]) * (1 - outputs[i] * outputs[i]);
    }

    const hiddenErrors = new Array(this.hiddenSizes[0]).fill(0);
    for (let j = 0; j < this.hiddenSizes[0]; j++) {
      let errorSum = 0;
      for (let i = 0; i < this.outputSize; i++) {
        errorSum += outputErrors[i] * this.weights2[j][i];
      }
      hiddenErrors[j] = errorSum * this.reluDeriv(hidden[j]);
    }

    for (let j = 0; j < this.outputSize; j++) {
      this.biases2[j] += learningRate * outputErrors[j];
      for (let i = 0; i < this.hiddenSizes[0]; i++) {
        this.weights2[i][j] += learningRate * outputErrors[j] * hidden[i];
      }
    }

    for (let j = 0; j < this.hiddenSizes[0]; j++) {
      this.biases1[j] += learningRate * hiddenErrors[j];
      for (let i = 0; i < this.inputSize; i++) {
        this.weights1[i][j] += learningRate * hiddenErrors[j] * inputs[i];
      }
    }
  }

  toJSON(): object {
    return {
      inputSize: this.inputSize,
      hiddenSizes: this.hiddenSizes,
      outputSize: this.outputSize,
      weights1: this.weights1,
      biases1: this.biases1,
      weights2: this.weights2,
      biases2: this.biases2,
    };
  }

  static fromJSON(data: {
    inputSize: number;
    hiddenSizes: number[];
    outputSize: number;
    weights1: number[][];
    biases1: number[];
    weights2: number[][];
    biases2: number[];
  }): NeuralNetwork {
    const nn = new NeuralNetwork({
      inputSize: data.inputSize,
      hiddenSizes: data.hiddenSizes,
      outputSize: data.outputSize,
    });
    (nn as any).weights1 = data.weights1;
    (nn as any).biases1 = data.biases1;
    (nn as any).weights2 = data.weights2;
    (nn as any).biases2 = data.biases2;
    return nn;
  }
}