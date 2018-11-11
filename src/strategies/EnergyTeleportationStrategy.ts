import RoomEntities from "RoomEntities";

export default class EnergyTeleportationStrategy implements Strategy {
  private linkNearToStorage?: StructureLink;
  private linksNearToSources: StructureLink[];

  constructor({ linkNearToStorage, linksNearToSources }: RoomEntities) {
    this.linkNearToStorage = linkNearToStorage;
    this.linksNearToSources = linksNearToSources;
  }

  public execute() {
    const linkNearToStorage = this.linkNearToStorage;

    if (linkNearToStorage) {
      this.linksNearToSources.forEach((link) => {
        if (link.energy === link.energyCapacity) {
          link.transferEnergy(linkNearToStorage);
        }
      });
    }
  }
}
