import RoomStrategy from "strategies/RoomStrategy";
import { ErrorMapper } from "utils/ErrorMapper";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  initMemory();
  cleanMemory();

  incrementWallHitsTarget();
  const roomStrategy = new RoomStrategy();
  _.forEach(Game.rooms, (room) => roomStrategy.applyTo(room));
});

function initMemory() {
  const MINIMAL_WALL_STRENGTH = 20000;

  Memory.wallStrengthProgression = Memory.wallStrengthProgression > MINIMAL_WALL_STRENGTH ? Memory.wallStrengthProgression : MINIMAL_WALL_STRENGTH;
}

function cleanMemory() {
  deleteMissingCreepsFromMemory();
}

function incrementWallHitsTarget() {
  Memory.wallHitsTarget++;

  console.log(Memory.wallHitsTarget)
}

function deleteMissingCreepsFromMemory() {
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
}
