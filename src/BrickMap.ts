const MAX_BRICK_MAP_STORAGE = 1_000_000;

type BrickMapNode = number;

const UNDEFINED_NODE = 0;
const MIN_X_MIN_Y_MIN_Z_NODE_OFFSET = 0;
const MIN_X_MIN_Y_MAX_Z_NODE_OFFSET = 1;
const MIN_X_MAX_Y_MIN_Z_NODE_OFFSET = 2;
const MIN_X_MAX_Y_MAX_Z_NODE_OFFSET = 3;
const MAX_X_MIN_Y_MIN_Z_NODE_OFFSET = 4;
const MAX_X_MIN_Y_MAX_Z_NODE_OFFSET = 5;
const MAX_X_MAX_Y_MIN_Z_NODE_OFFSET = 6;
const MAX_X_MAX_Y_MAX_Z_NODE_OFFSET = 7;
const NODE_SIZE = 8; // size in Uint32s

let ROOT_BRICK_NODE: BrickMapNode = 0;

export class BrickMap {
  storage: Uint32Array = new Uint32Array(MAX_BRICK_MAP_STORAGE);
  freeIndex: number = NODE_SIZE;

  constructor() {
    // root node
    this.setMinXminYMinZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMinXminYMaxZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMinXmaxYMinZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMinXmaxYMaxZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMaxXminYMinZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMaxXminYMaxZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMaxXmaxYMinZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMaxXmaxYMaxZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
  }

  minXminYMinZNode(n: BrickMapNode): BrickMapNode | undefined {
    let idx = this.storage[n + MIN_X_MIN_Y_MIN_Z_NODE_OFFSET];
    return idx == UNDEFINED_NODE ? undefined : idx;
  }

  minXminYMaxZNode(n: BrickMapNode): BrickMapNode | undefined {
    let idx = this.storage[n + MIN_X_MIN_Y_MAX_Z_NODE_OFFSET];
    return idx == UNDEFINED_NODE ? undefined : idx;
  }

  minXmaxYMinZNode(n: BrickMapNode): BrickMapNode | undefined {
    let idx = this.storage[n + MIN_X_MAX_Y_MIN_Z_NODE_OFFSET];
    return idx == UNDEFINED_NODE ? undefined : idx;
  }

  minXmaxYMaxZNode(n: BrickMapNode): BrickMapNode | undefined {
    let idx = this.storage[n + MIN_X_MAX_Y_MAX_Z_NODE_OFFSET];
    return idx == UNDEFINED_NODE ? undefined : idx;
  }

  maxXminYMinZNode(n: BrickMapNode): BrickMapNode | undefined {
    let idx = this.storage[n + MAX_X_MIN_Y_MIN_Z_NODE_OFFSET];
    return idx == UNDEFINED_NODE ? undefined : idx;
  }

  maxXminYMaxZNode(n: BrickMapNode): BrickMapNode | undefined {
    let idx = this.storage[n + MAX_X_MIN_Y_MAX_Z_NODE_OFFSET];
    return idx == UNDEFINED_NODE ? undefined : idx;
  }

  maxXmaxYMinZNode(n: BrickMapNode): BrickMapNode | undefined {
    let idx = this.storage[n + MAX_X_MAX_Y_MIN_Z_NODE_OFFSET];
    return idx == UNDEFINED_NODE ? undefined : idx;
  }

  maxXmaxYMaxZNode(n: BrickMapNode): BrickMapNode | undefined {
    let idx = this.storage[n + MAX_X_MAX_Y_MAX_Z_NODE_OFFSET];
    return idx == UNDEFINED_NODE ? undefined : idx;
  }

  setMinXminYMinZNode(n: BrickMapNode, idx: BrickMapNode | undefined) {
    this.storage[n + MIN_X_MIN_Y_MIN_Z_NODE_OFFSET] = idx ?? UNDEFINED_NODE;
  }

  setMinXminYMaxZNode(n: BrickMapNode, idx: BrickMapNode | undefined) {
    this.storage[n + MIN_X_MIN_Y_MAX_Z_NODE_OFFSET] = idx ?? UNDEFINED_NODE;
  }

  setMinXmaxYMinZNode(n: BrickMapNode, idx: BrickMapNode | undefined) {
    this.storage[n + MIN_X_MAX_Y_MIN_Z_NODE_OFFSET] = idx ?? UNDEFINED_NODE;
  }

  setMinXmaxYMaxZNode(n: BrickMapNode, idx: BrickMapNode | undefined) {
    this.storage[n + MIN_X_MAX_Y_MAX_Z_NODE_OFFSET] = idx ?? UNDEFINED_NODE;
  }

  setMaxXminYMinZNode(n: BrickMapNode, idx: BrickMapNode | undefined) {
    this.storage[n + MAX_X_MIN_Y_MIN_Z_NODE_OFFSET] = idx ?? UNDEFINED_NODE;
  }

  setMaxXminYMaxZNode(n: BrickMapNode, idx: BrickMapNode | undefined) {
    this.storage[n + MAX_X_MIN_Y_MAX_Z_NODE_OFFSET] = idx ?? UNDEFINED_NODE;
  }

  setMaxXmaxYMinZNode(n: BrickMapNode, idx: BrickMapNode | undefined) {
    this.storage[n + MAX_X_MAX_Y_MIN_Z_NODE_OFFSET] = idx ?? UNDEFINED_NODE;
  }

  setMaxXmaxYMaxZNode(n: BrickMapNode, idx: BrickMapNode | undefined) {
    this.storage[n + MAX_X_MAX_Y_MAX_Z_NODE_OFFSET] = idx ?? UNDEFINED_NODE;
  }
}
