import PositionHelpers from "helpers/PositionHelpers";
import RoomEntities from "RoomEntities";
import RechargeStrategy from "./RechargeStrategy";

export default class BuildStrategy implements Strategy {
  private constructionSites: Array<ConstructionSite<BuildableStructureConstant>>;
  private rechargeStrategy: RechargeStrategy;
  private builderCreeps: CreepsGroupedByRole['builder'];

  constructor({ constructionSites, creepsGroupedByRole: { builder } }: RoomEntities, rechargeStrategy: RechargeStrategy) {
    this.constructionSites = constructionSites;
    this.rechargeStrategy = rechargeStrategy;
    this.builderCreeps = builder;
  }

  public execute() {
    if (this.constructionSites.length === 0) {
      this.killUselessBuilderCreeps();
    }
    else {
      _.forEach(this.builderCreeps, (builderCreep) => {
        RechargeStrategy.toggleFlagIsLookingForEnergy(builderCreep);

        switch (builderCreep.memory.status) {
          case 'lookingForEnergy':
            this.rechargeStrategy.applyTo(builderCreep);
            break;
          case 'idle':
          case 'working':
            this.tellBuilderCreepToWork(builderCreep);
            break;
        }
      });
    }
  }

  private getClosestConstructionSite(builderCreep: Creep) {
    return PositionHelpers.orderByRangeToPosition(this.constructionSites, builderCreep.pos)[0];
  }

  private killUselessBuilderCreeps() {
    _.forEach(this.builderCreeps, (builderCreep) => {
      builderCreep.suicide();
      builderCreep.memory.status = 'dying';
    });
  }

  private tellBuilderCreepToWork(builderCreep: BuilderCreep) {
    const closestConstructionSite = this.getClosestConstructionSite(builderCreep);
    if (builderCreep.build(closestConstructionSite) === ERR_NOT_IN_RANGE) {
      builderCreep.moveTo(closestConstructionSite);
    }
  }
}
