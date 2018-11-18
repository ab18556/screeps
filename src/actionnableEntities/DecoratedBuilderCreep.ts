import { ActionnableEntity } from "./ActionnableEntity";

export interface DecoratedBuilderCreep extends Creep { }

export class DecoratedBuilderCreep extends ActionnableEntity<ConstructionSite<BuildableStructureConstant>, BuilderCreep> {
  constructor(builderCreep: BuilderCreep) {
    super(builderCreep);
  }

  public do(task: string, target: ConstructionSite<BuildableStructureConstant>): boolean {
    switch (task) {
      case 'build':
        return this.doBuild(target);
      default:
        return false;
    }
  }

  private doBuild(target: ConstructionSite<BuildableStructureConstant>) {
    if (this.isReadyToBuild()) {
      switch (this.build(target)) {
        case OK:
          return true;
        case ERR_NOT_IN_RANGE:
          return this.moveTo(target) === OK;
        default:
          return false;
      }
    }

    return false;
  }

  private isReadyToBuild() {
    return this.memory.status === 'idle' || this.memory.status === 'working';
  }
}

export default DecoratedBuilderCreep;
