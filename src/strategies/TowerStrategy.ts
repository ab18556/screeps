import RoomEntities from "RoomEntities";

export default class TowerStrategy implements Strategy {
  private hostiles: Creep[];
  private brokenRoads: StructureRoad[];
  private brokenWalls: StructureWall[];
  private towers: Towers;
  private brokenPublicStructures: Array<StructureRoad | StructureWall>;

  constructor({ hostiles, brokenRoads, brokenWalls, towers }: RoomEntities) {
    this.hostiles = hostiles;
    this.brokenRoads = brokenRoads;
    this.brokenWalls = brokenWalls;
    this.towers = towers;
    this.brokenPublicStructures = [...this.brokenRoads, ...this.brokenWalls];
  }

  public execute() {
    if (this.hostiles.length > 0) {
      this.attackHostiles();
    }
    else if (this.brokenPublicStructures.length > 0) {
      this.repairBrokenPublicStructures();
    }
  }

  private attackHostiles() {
    _.forEach(this.towers, (tower) => {
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
    });
  }

  private repairBrokenPublicStructures() {
    _.forEach(this.towers, (tower) => {
      if (tower.energy > tower.energyCapacity / 2) {
        const sortedBrokenPublicStructures = this.sortStructuresByHitsPercentageAndRangeToTower(tower);
        tower.repair(sortedBrokenPublicStructures[0]);
      }
    });
  }

  private sortStructuresByHitsPercentageAndRangeToTower(tower: StructureTower) {
    return _.sortByOrder(this.brokenPublicStructures, [(brokenStructure) => brokenStructure.hits / brokenStructure.hitsMax, (s) => tower.pos.getRangeTo(s)]);
  }
}
