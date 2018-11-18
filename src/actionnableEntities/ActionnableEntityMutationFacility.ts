export default class ActionnableEntityMutationFacility {
  public static mutateStructureLinkIntoLink() {
    const prototype = StructureLink.prototype as any;
    prototype.do = function (task: string, target: Link): boolean {
      switch (task) {
        case 'transferEnergy':
          return this.doTransferEnergy(target);
        default:
          return false;
      }
    };
    prototype.isEmpty = function (): boolean { return !this.energy; };
    prototype.isFull = function (): boolean { return this.energy === this.energyCapacity; };
    // private methods
    prototype.doTransferEnergy = function (target: Link): boolean {
      if (this.isFull) {
        return this.transferEnergy(target) === OK;
      }
      return false;
    };
  }
}
