import { ActionnableEntity } from "./ActionnableEntity";

interface Link extends StructureLink { }
class Link extends ActionnableEntity<Link, StructureLink> {
  get isEmpty(): boolean { return !this.energy; }
  get isFull(): boolean { return this.energy === this.energyCapacity; }

  constructor(structureLink: StructureLink) {
    super(structureLink);
  }

  public do(task: string, target: Link): boolean {
    switch (task) {
      case 'transferEnergy':
        return this.doTransferEnergy(target);
      default:
        return false;
    }
  }

  private doTransferEnergy(target: Link): boolean {
    if (this.isFull) {
      return this.transferEnergy(Game.getObjectById(target.id) as StructureLink) === OK;
    }

    return false;
  }
}

export default Link;
