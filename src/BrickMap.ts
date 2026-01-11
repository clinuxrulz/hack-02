const MAX_BRICK_MAP_STORAGE = 1_000_000;

type BrickMapNode = number;

const UNDEFINED_NODE = 0;
const PARENT_NODE_OFFSET = 0;
const MIN_X_MIN_Y_MIN_Z_NODE_OFFSET = 1;
const MIN_X_MIN_Y_MAX_Z_NODE_OFFSET = 2;
const MIN_X_MAX_Y_MIN_Z_NODE_OFFSET = 3;
const MIN_X_MAX_Y_MAX_Z_NODE_OFFSET = 4;
const MAX_X_MIN_Y_MIN_Z_NODE_OFFSET = 5;
const MAX_X_MIN_Y_MAX_Z_NODE_OFFSET = 6;
const MAX_X_MAX_Y_MIN_Z_NODE_OFFSET = 7;
const MAX_X_MAX_Y_MAX_Z_NODE_OFFSET = 8;
const NODE_SIZE = 9; // size in Uint32s

let ROOT_BRICK_NODE: BrickMapNode = 0;

export class BrickMap {
  storage: Uint32Array = new Uint32Array(MAX_BRICK_MAP_STORAGE);
  freeIndex: number = NODE_SIZE;

  constructor() {
    // root node
    this.setParentNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMinXminYMinZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMinXminYMaxZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMinXmaxYMinZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMinXmaxYMaxZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMaxXminYMinZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMaxXminYMaxZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMaxXmaxYMinZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
    this.setMaxXmaxYMaxZNode(ROOT_BRICK_NODE, UNDEFINED_NODE);
  }

  allocNode(): BrickMapNode {
    let node: BrickMapNode = this.freeIndex;
    this.freeIndex += NODE_SIZE;
    this.setParentNode(node, UNDEFINED_NODE);
    this.setMinXminYMinZNode(node, UNDEFINED_NODE);
    this.setMinXminYMaxZNode(node, UNDEFINED_NODE);
    this.setMinXmaxYMinZNode(node, UNDEFINED_NODE);
    this.setMinXmaxYMaxZNode(node, UNDEFINED_NODE);
    this.setMaxXminYMinZNode(node, UNDEFINED_NODE);
    this.setMaxXminYMaxZNode(node, UNDEFINED_NODE);
    this.setMaxXmaxYMinZNode(node, UNDEFINED_NODE);
    this.setMaxXmaxYMaxZNode(node, UNDEFINED_NODE);
    return node;
  }

  freeNode(n: BrickMapNode) {
    let nParent = this.parentNode(n);
    if (nParent != undefined) {
      if (this.minXminYMinZNode(nParent) === n) {
        this.setMinXminYMinZNode(nParent, undefined);
      }
      if (this.minXminYMaxZNode(nParent) === n) {
        this.setMinXminYMaxZNode(nParent, undefined);
      }
      if (this.minXmaxYMinZNode(nParent) === n) {
        this.setMinXmaxYMinZNode(nParent, undefined);
      }
      if (this.minXmaxYMaxZNode(nParent) === n) {
        this.setMinXmaxYMaxZNode(nParent, undefined);
      }
      if (this.maxXminYMinZNode(nParent) === n) {
        this.setMaxXminYMinZNode(nParent, undefined);
      }
      if (this.maxXminYMaxZNode(nParent) === n) {
        this.setMaxXminYMaxZNode(nParent, undefined);
      }
      if (this.maxXmaxYMinZNode(nParent) === n) {
        this.setMaxXmaxYMinZNode(nParent, undefined);
      }
      if (this.maxXmaxYMaxZNode(nParent) === n) {
        this.setMaxXmaxYMaxZNode(nParent, undefined);
      }
    }
    {
      let child = this.minXminYMinZNode(n);
      if (child != undefined) {
        this.freeNode(child);
      }
    }
    {
      let child = this.minXminYMaxZNode(n);
      if (child != undefined) {
        this.freeNode(child);
      }
    }
    {
      let child = this.minXmaxYMinZNode(n);
      if (child != undefined) {
        this.freeNode(child);
      }
    }
    {
      let child = this.minXmaxYMaxZNode(n);
      if (child != undefined) {
        this.freeNode(child);
      }
    }
    {
      let child = this.maxXminYMinZNode(n);
      if (child != undefined) {
        this.freeNode(child);
      }
    }
    {
      let child = this.maxXminYMaxZNode(n);
      if (child != undefined) {
        this.freeNode(child);
      }
    }
    {
      let child = this.maxXmaxYMinZNode(n);
      if (child != undefined) {
        this.freeNode(child);
      }
    }
    {
      let child = this.maxXmaxYMaxZNode(n);
      if (child != undefined) {
        this.freeNode(child);
      }
    }
    let lastNode = this.freeIndex - NODE_SIZE;
    let lastNodeParent = this.parentNode(lastNode);
    this.setParentNode(n, lastNodeParent);
    this.setMinXminYMinZNode(n, this.minXminYMinZNode(lastNode));
    this.setMinXminYMaxZNode(n, this.minXminYMaxZNode(lastNode));
    this.setMinXmaxYMinZNode(n, this.minXmaxYMinZNode(lastNode));
    this.setMinXmaxYMaxZNode(n, this.minXmaxYMaxZNode(lastNode));
    this.setMaxXminYMinZNode(n, this.maxXminYMinZNode(lastNode));
    this.setMaxXminYMaxZNode(n, this.maxXminYMaxZNode(lastNode));
    this.setMaxXmaxYMinZNode(n, this.maxXmaxYMinZNode(lastNode));
    this.setMaxXmaxYMaxZNode(n, this.maxXmaxYMaxZNode(lastNode));
    if (lastNodeParent != undefined) {
      if (this.minXminYMinZNode(lastNodeParent) === lastNode) {
        this.setMinXminYMinZNode(lastNodeParent, n);
      }
      if (this.minXminYMaxZNode(lastNodeParent) === lastNode) {
        this.setMinXminYMaxZNode(lastNodeParent, n);
      }
      if (this.minXmaxYMinZNode(lastNodeParent) === lastNode) {
        this.setMinXmaxYMinZNode(lastNodeParent, n);
      }
      if (this.minXmaxYMaxZNode(lastNodeParent) === lastNode) {
        this.setMinXmaxYMaxZNode(lastNodeParent, n);
      }
      if (this.maxXminYMinZNode(lastNodeParent) === lastNode) {
        this.setMaxXminYMinZNode(lastNodeParent, n);
      }
      if (this.maxXminYMaxZNode(lastNodeParent) === lastNode) {
        this.setMaxXminYMaxZNode(lastNodeParent, n);
      }
      if (this.maxXmaxYMinZNode(lastNodeParent) === lastNode) {
        this.setMaxXmaxYMinZNode(lastNodeParent, n);
      }
      if (this.maxXmaxYMaxZNode(lastNodeParent) === lastNode) {
        this.setMaxXmaxYMaxZNode(lastNodeParent, n);
      }
    }
    this.freeIndex -= NODE_SIZE;
  }

  parentNode(n: BrickMapNode): BrickMapNode | undefined {
    let result = this.storage[n + PARENT_NODE_OFFSET];
    return result == UNDEFINED_NODE ? undefined : result;
  }

  minXminYMinZNode(n: BrickMapNode): BrickMapNode | undefined {
    let result = this.storage[n + MIN_X_MIN_Y_MIN_Z_NODE_OFFSET];
    return result == UNDEFINED_NODE ? undefined : result;
  }

  minXminYMaxZNode(n: BrickMapNode): BrickMapNode | undefined {
    let result = this.storage[n + MIN_X_MIN_Y_MAX_Z_NODE_OFFSET];
    return result == UNDEFINED_NODE ? undefined : result;
  }

  minXmaxYMinZNode(n: BrickMapNode): BrickMapNode | undefined {
    let result = this.storage[n + MIN_X_MAX_Y_MIN_Z_NODE_OFFSET];
    return result == UNDEFINED_NODE ? undefined : result;
  }

  minXmaxYMaxZNode(n: BrickMapNode): BrickMapNode | undefined {
    let result = this.storage[n + MIN_X_MAX_Y_MAX_Z_NODE_OFFSET];
    return result == UNDEFINED_NODE ? undefined : result;
  }

  maxXminYMinZNode(n: BrickMapNode): BrickMapNode | undefined {
    let result = this.storage[n + MAX_X_MIN_Y_MIN_Z_NODE_OFFSET];
    return result == UNDEFINED_NODE ? undefined : result;
  }

  maxXminYMaxZNode(n: BrickMapNode): BrickMapNode | undefined {
    let result = this.storage[n + MAX_X_MIN_Y_MAX_Z_NODE_OFFSET];
    return result == UNDEFINED_NODE ? undefined : result;
  }

  maxXmaxYMinZNode(n: BrickMapNode): BrickMapNode | undefined {
    let result = this.storage[n + MAX_X_MAX_Y_MIN_Z_NODE_OFFSET];
    return result == UNDEFINED_NODE ? undefined : result;
  }

  maxXmaxYMaxZNode(n: BrickMapNode): BrickMapNode | undefined {
    let result = this.storage[n + MAX_X_MAX_Y_MAX_Z_NODE_OFFSET];
    return result == UNDEFINED_NODE ? undefined : result;
  }

  setParentNode(n: BrickMapNode, rhs: BrickMapNode | undefined) {
    this.storage[n + PARENT_NODE_OFFSET] = rhs ?? UNDEFINED_NODE;
  }

  setMinXminYMinZNode(n: BrickMapNode, rhs: BrickMapNode | undefined) {
    this.storage[n + MIN_X_MIN_Y_MIN_Z_NODE_OFFSET] = rhs ?? UNDEFINED_NODE;
  }

  setMinXminYMaxZNode(n: BrickMapNode, rhs: BrickMapNode | undefined) {
    this.storage[n + MIN_X_MIN_Y_MAX_Z_NODE_OFFSET] = rhs ?? UNDEFINED_NODE;
  }

  setMinXmaxYMinZNode(n: BrickMapNode, rhs: BrickMapNode | undefined) {
    this.storage[n + MIN_X_MAX_Y_MIN_Z_NODE_OFFSET] = rhs ?? UNDEFINED_NODE;
  }

  setMinXmaxYMaxZNode(n: BrickMapNode, rhs: BrickMapNode | undefined) {
    this.storage[n + MIN_X_MAX_Y_MAX_Z_NODE_OFFSET] = rhs ?? UNDEFINED_NODE;
  }

  setMaxXminYMinZNode(n: BrickMapNode, rhs: BrickMapNode | undefined) {
    this.storage[n + MAX_X_MIN_Y_MIN_Z_NODE_OFFSET] = rhs ?? UNDEFINED_NODE;
  }

  setMaxXminYMaxZNode(n: BrickMapNode, rhs: BrickMapNode | undefined) {
    this.storage[n + MAX_X_MIN_Y_MAX_Z_NODE_OFFSET] = rhs ?? UNDEFINED_NODE;
  }

  setMaxXmaxYMinZNode(n: BrickMapNode, rhs: BrickMapNode | undefined) {
    this.storage[n + MAX_X_MAX_Y_MIN_Z_NODE_OFFSET] = rhs ?? UNDEFINED_NODE;
  }

  setMaxXmaxYMaxZNode(n: BrickMapNode, rhs: BrickMapNode | undefined) {
    this.storage[n + MAX_X_MAX_Y_MAX_Z_NODE_OFFSET] = rhs ?? UNDEFINED_NODE;
  }
}
