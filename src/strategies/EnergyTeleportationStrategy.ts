import RoomEntities from "RoomEntities";

export default class EnergyTeleportationStrategy implements Strategy {
  private storageAdjacentLink?: StructureLink;
  private sourceAdjacentLinks: StructureLink[];

  constructor({ storageAdjacentLink, sourceAdjacentLinks }: RoomEntities) {
    this.storageAdjacentLink = storageAdjacentLink;
    this.sourceAdjacentLinks = sourceAdjacentLinks;
  }

  public execute() {
    const storageAdjacentLink = this.storageAdjacentLink;

    if (storageAdjacentLink) {
      this.sourceAdjacentLinks.forEach((link) => {
        if (link.energy === link.energyCapacity) {
          link.transferEnergy(storageAdjacentLink);
        }
      });
    }
  }
}
