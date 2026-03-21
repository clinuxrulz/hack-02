import { type Accessor, createSignal, createMemo, latest, type Signal } from "solid-js";
import { Player } from "./Player";
import { Court } from "./Court";
import { Ball } from "./Ball";
import * as THREE from "three";
import { when } from "./util";

namespace World {
  export type Params = {
    player1?: Player,
    player2?: Player,
    court?: Court,
    ball?: ReturnType<typeof Ball>,
  };
}

export class World {
  readonly player1: Signal<Player | undefined>;
  readonly player2: Signal<Player | undefined>;
  readonly court: Signal<Court | undefined>;
  readonly ball: Signal<ReturnType<typeof Ball> | undefined>;

  constructor(params: World.Params) {
    this.player1 = createSignal(params.player1);
    this.player2 = createSignal(params.player2);
    this.court = createSignal(params.court);
    this.ball = createSignal(params.ball);
  }

  update(dt: number) {
    let player1 = this.player1[0]();
    let court = this.court[0]();
    if (player1 != undefined) {
      let pos = player1.position;
      let newPos = latest(pos[0]).clone();
      if (court != undefined) {
        let courtWidth = court.width[0]();
        let courtLength = court.length[0]();
        if (newPos.x < -0.5 * courtWidth + 0.25) {
          newPos.x = -0.5 * courtWidth + 0.25;
        }
        if (newPos.x > 0.5 * courtWidth - 0.25) {
          newPos.x = +0.5 * courtWidth - 0.25;
        }
        if (newPos.z > +0.5 * courtLength - 0.25) {
          newPos.z = +0.5 * courtLength - 0.25;
        }
        if (newPos.z < 0.25) {
          newPos.z = 0.25;
        }
      }
      pos[1](newPos);
    }
  }

  render(target: THREE.Object3D) {
    let hasCourt = createMemo(() => this.court[0]() != undefined);
    createMemo(() => {
      if (!hasCourt()) {
        return;
      }
      let court = this.court[0] as Accessor<NonNullable<ReturnType<typeof this.court[0]>>>;
      createMemo(() => court().render(target));
    });
    when(
      this.ball[0],
      (ball) => {
        createMemo(() => ball().render(target));
      },
    );
  }
}
