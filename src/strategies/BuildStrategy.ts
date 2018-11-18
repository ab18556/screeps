import PositionHelpers from "helpers/PositionHelpers";
import RoomEntities from "RoomEntities";
import DecoratedBuilderCreep from "actionnableEntities/DecoratedBuilderCreep";

export default class BuildStrategy implements Strategy {
  private constructionSites: Array<ConstructionSite<BuildableStructureConstant>>;
  private builderCreeps: CreepsGroupedByRole['builder'];

  constructor({ constructionSites, creepsGroupedByRole: { builder } }: RoomEntities) {
    this.constructionSites = constructionSites;
    this.builderCreeps = builder;
  }

  public execute() {
    if (this.constructionSites.length === 0) {
      this.killUselessBuilderCreeps();
    }
    else {
      _.forEach(this.builderCreeps, (builderCreep) => {
        const decoratedBuilderCreep = new DecoratedBuilderCreep(builderCreep);
        decoratedBuilderCreep.do('build', this.getClosestConstructionSite(builderCreep));
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
}
