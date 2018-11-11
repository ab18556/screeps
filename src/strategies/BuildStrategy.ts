import PositionHelpers from "helpers/PositionHelpers";
import RoomEntities from "RoomEntities";
import RechargeStrategy from "./RechargeStrategy";

export default class BuildStrategy implements Strategy {
  private constructionSites: Array<ConstructionSite<BuildableStructureConstant>>;
  private rechargeStrategy: RechargeStrategy;

  constructor({ constructionSites }: RoomEntities, rechargeStrategy: RechargeStrategy) {
    this.constructionSites = constructionSites;
    this.rechargeStrategy = rechargeStrategy;

  }

  public applyTo(builderCreep: BuilderCreep) {
    if (this.constructionSites.length === 0) {
      builderCreep.suicide();
    }
    else {
      RechargeStrategy.toggleFlagIsLookingForEnergy(builderCreep);
      if (builderCreep.memory.isLookingForEnergy) {
        this.rechargeStrategy.applyTo(builderCreep);
      }
      if (!builderCreep.memory.isLookingForEnergy) {
        const constructionSite = PositionHelpers.orderByRangeToPosition(this.constructionSites, builderCreep.pos)[0];
        this.build(builderCreep, constructionSite);
      }
    }
  }

  public execute() {
    throw new Error('Not implemented yet.')
  }

  private build(builderCreep: BuilderCreep, constructionSite: ConstructionSite<BuildableStructureConstant>) {
    if (builderCreep.build(constructionSite) === ERR_NOT_IN_RANGE) {
      builderCreep.moveTo(constructionSite);
    }
  }
}
