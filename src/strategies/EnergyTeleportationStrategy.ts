import Link from "actionnableEntities/Link";
import RoomEntities from "RoomEntities";

export default class EnergyTeleportationStrategy implements Strategy {
  private storageAdjacentLink?: StructureLink;
  private sourceAdjacentLinks: StructureLink[];

  constructor({ storageAdjacentLink, sourceAdjacentLinks }: RoomEntities) {
    this.storageAdjacentLink = storageAdjacentLink;
    this.sourceAdjacentLinks = sourceAdjacentLinks;
  }

  public execute() {
    if (this.storageAdjacentLink) {
      const storageAdjacentLink = new Link(this.storageAdjacentLink);

      if (storageAdjacentLink.isEmpty) {
        this.sourceAdjacentLinks.forEach((structuredLink) => {
          // todo: if storage is not full then we shall ask links to transfert
          const link = new Link(structuredLink);
          link.do('transferEnergy', storageAdjacentLink);
        });
      }
    }
  }
}
