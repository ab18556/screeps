import RoomEntities from "RoomEntities";

export default class TowerStrategy implements Strategy {
  private hostiles: Creep[];
  private brokenRoads: StructureRoad[];
  private brokenWalls: StructureWall[];

  constructor({ hostiles, brokenRoads, brokenWalls }: RoomEntities) {
    this.hostiles = hostiles;
    this.brokenRoads = brokenRoads;
    this.brokenWalls = brokenWalls;
  }

  public applyTo(tower: StructureTower) {
    const brokenPublicStructures = _.sortByOrder([...this.brokenRoads, ...this.brokenWalls], [(brokenStructure) => brokenStructure.hits / brokenStructure.hitsMax, (s) => tower.pos.getRangeTo(s)]);
    if (this.hostiles.length > 0) {
      const closestHostile = this.hostiles.reduce((closeHostile, hostile) => {
        const range = tower.pos.getRangeTo(hostile);
        if (range < closeHostile.range) {
          return { hostile, range };
        }
        else {
          return closeHostile;
        }
      }, { hostile: this.hostiles[0], range: Infinity });
      tower.attack(closestHostile.hostile);
    }
    else if (brokenPublicStructures.length > 0 && tower.energy > tower.energyCapacity / 2) {
      tower.repair(brokenPublicStructures[0]);
    }
  }

  public execute() {
    throw new Error('Not implemented yet.')
  }
}
