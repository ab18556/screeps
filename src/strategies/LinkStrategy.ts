import RoomEntities from "RoomEntities";

export default class LinkStrategy {
    private storageLink?: StructureLink;

    constructor({ storageLink }: RoomEntities) {
        this.storageLink = storageLink;
    }
    public applyTo(link: StructureLink) {
        if (this.storageLink && !this.storageLink.energy && link.energy === link.energyCapacity) {
            link.transferEnergy(this.storageLink);
        }
    }
}
