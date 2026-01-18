const HIGH_LEVEL_BITS = 7;
const HIGH_LEVEL_RES = (1 << HIGH_LEVEL_BITS);
const LOW_LEVEL_BITS = 3;
const LOW_LEVEL_RES = (1 << LOW_LEVEL_BITS);

const TEXTURE_RES_BITS = 12;
const TEXTURE_RES = (1 << TEXTURE_RES_BITS);

export class BrickMapV2 {
  private data: Uint32Array = new Uint32Array(TEXTURE_RES * TEXTURE_RES);
  
}
