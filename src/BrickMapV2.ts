const HIGH_LEVEL_RES_BITS = 7;
const HIGH_LEVEL_RES = (1 << HIGH_LEVEL_RES_BITS);
const HIGH_LEVEL_RES_MASK = HIGH_LEVEL_RES - 1;
const LOW_LEVEL_RES_BITS = 3;
const LOW_LEVEL_RES = (1 << LOW_LEVEL_RES_BITS);
const LOW_LEVEL_RES_MASK = LOW_LEVEL_RES - 1;

const COMBINED_RES_BITS = HIGH_LEVEL_RES_BITS + LOW_LEVEL_RES_BITS;
const COMBINED_RES = (1 << COMBINED_RES_BITS);

const TEXTURE_RES_BITS = 12;
const TEXTURE_RES = (1 << TEXTURE_RES_BITS);
const TEXTURE_RES_MASK = 1 - TEXTURE_RES;

const START_BRICKS_OFFSET = HIGH_LEVEL_RES * HIGH_LEVEL_RES * HIGH_LEVEL_RES;
// +1 for parent reference
const BRICK_SIZE = 1 + LOW_LEVEL_RES * LOW_LEVEL_RES * LOW_LEVEL_RES;

const VOXEL_SIZE = 10.0;

export class BrickMapV2 {
  private data: Uint32Array = new Uint32Array(TEXTURE_RES * TEXTURE_RES);
  private bricksEnd = START_BRICKS_OFFSET;

  get(xIdx: number, yIdx: number, zIdx: number): number {
    if (
      xIdx < 0 || xIdx >= COMBINED_RES ||
      yIdx < 0 || yIdx >= COMBINED_RES ||
      zIdx < 0 || zIdx >= COMBINED_RES
    ) {
      return 0.0;
    }
    let hiXIdx = xIdx >> HIGH_LEVEL_RES_BITS;
    let hiYIdx = yIdx >> HIGH_LEVEL_RES_BITS;
    let hiZIdx = zIdx >> HIGH_LEVEL_RES_BITS;
    let hiIdx =
      (hiZIdx << (HIGH_LEVEL_RES_BITS << 1)) +
      (hiYIdx << HIGH_LEVEL_RES_BITS) +
      hiXIdx;
    let offset = this.data[hiIdx];
    if (offset == 0) {
      return 0;
    }
    let lowXIdx = xIdx & LOW_LEVEL_RES_MASK;
    let lowYIdx = yIdx & LOW_LEVEL_RES_MASK;
    let lowZIdx = zIdx & LOW_LEVEL_RES_MASK;
    let lowIdx =
      (lowZIdx << (LOW_LEVEL_RES_BITS << 1)) +
      (lowYIdx << LOW_LEVEL_RES_BITS) +
      lowXIdx;
    return this.data[offset + lowIdx];
  }

  set(xIdx: number, yIdx: number, zIdx: number, value: number) {
    if (
      xIdx < 0 || xIdx >= COMBINED_RES ||
      yIdx < 0 || yIdx >= COMBINED_RES ||
      zIdx < 0 || zIdx >= COMBINED_RES
    ) {
      return;
    }
    let hiXIdx = xIdx >> HIGH_LEVEL_RES_BITS;
    let hiYIdx = yIdx >> HIGH_LEVEL_RES_BITS;
    let hiZIdx = zIdx >> HIGH_LEVEL_RES_BITS;
    let hiIdx =
      (hiZIdx << (HIGH_LEVEL_RES_BITS << 1)) +
      (hiYIdx << HIGH_LEVEL_RES_BITS) +
      hiXIdx;
    let offset = this.data[hiIdx];
    if (offset == 0) {
      offset = this.allocBrick();
      this.data[hiIdx] = offset;
      this.data[offset] = hiIdx;
    }
    let lowXIdx = xIdx & LOW_LEVEL_RES_MASK;
    let lowYIdx = yIdx & LOW_LEVEL_RES_MASK;
    let lowZIdx = zIdx & LOW_LEVEL_RES_MASK;
    let lowIdx =
      (lowZIdx << (LOW_LEVEL_RES_BITS << 1)) +
      (lowYIdx << LOW_LEVEL_RES_BITS) +
      lowXIdx;
    this.data[offset + lowIdx] = value;
    if (value == 0) {
      let allZero = true;
      for (let i = 0; i < BRICK_SIZE; ++i) {
        if (this.data[offset + i] != 0) {
          allZero = false;
          break;
        }
      }
      if (allZero) {
        this.freeBrick(offset);
      }
    }
  }

  private allocBrick(): number {
    let brick = this.bricksEnd;
    this.bricksEnd += BRICK_SIZE;
    for (let i = 0; i < BRICK_SIZE; ++i) {
      this.data[brick + i] = 0;
    }
    return brick;
  }

  private freeBrick(brick: number) {
    {
      let parent = this.data[brick];
      this.data[parent] = 0;
    }
    if (this.bricksEnd > START_BRICKS_OFFSET + BRICK_SIZE) {
      let srcIdx = this.bricksEnd - BRICK_SIZE;
      let dstIdx = brick;
      if (srcIdx != dstIdx) {
        for (let i = 0; i < BRICK_SIZE; ++i) {
          this.data[dstIdx + i] = this.data[srcIdx + i];
        }
        let parent = this.data[dstIdx];
        this.data[parent] = dstIdx;
      }
    }
    this.bricksEnd -= BRICK_SIZE;
  }
}
