import RoomEntities from "RoomEntities";
import ActionnableEntityMutationFacility from "actionnableEntities/ActionnableEntityMutationFacility";

export default class EnergyTeleportationStrategy implements Strategy {
  private storageAdjacentLink?: Link;
  private sourceAdjacentLinks: Link[];

  constructor({ storageAdjacentLink, sourceAdjacentLinks }: RoomEntities) {
    this.storageAdjacentLink = storageAdjacentLink as Link;
    this.sourceAdjacentLinks = sourceAdjacentLinks as Link[];
  }

  public execute() {
    const storageAdjacentLink = this.storageAdjacentLink;
    if (storageAdjacentLink) {
      if (storageAdjacentLink.isEmpty()) {
        this.sourceAdjacentLinks.forEach((link) => {
          // todo: if storage is not full then we shall ask links to transfert
          link.do('transferEnergy', storageAdjacentLink);
        });
      }
    }
  }
}
