const HIGH_LEVEL_RES_BITS = 7;
const HIGH_LEVEL_RES = (1 << HIGH_LEVEL_RES_BITS);
const HIGH_LEVEL_RES_MASK = HIGH_LEVEL_RES - 1;
const LOW_LEVEL_RES_BITS = 3;
const LOW_LEVEL_RES = (1 << LOW_LEVEL_RES_BITS);
const LOW_LEVEL_RES_MASK = LOW_LEVEL_RES - 1;

const TEXTURE_RES_BITS = 12;
const TEXTURE_RES = (1 << TEXTURE_RES_BITS);
const TEXTURE_RES_MASK = 1 - TEXTURE_RES;

const START_BRICKS_OFFSET = HIGH_LEVEL_RES * HIGH_LEVEL_RES * HIGH_LEVEL_RES;
const BRICK_SIZE = LOW_LEVEL_RES * LOW_LEVEL_RES * LOW_LEVEL_RES;

export class BrickMapV2 {
  private data: Uint32Array = new Uint32Array(TEXTURE_RES * TEXTURE_RES);
  private bricksEnd = START_BRICKS_OFFSET;

  get(xIdx: number, yIdx: number, zIdx: number): number {
    return 0.0;
  }
}
