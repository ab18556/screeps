import RoomEntities from "RoomEntities";


export default class TransferStrategy implements Strategy {
  private storage?: StructureStorage;

  constructor({ storage }: RoomEntities) {
    this.storage = storage;
  }

  public applyTo(creep: Creep) {
    const storage = this.storage;
    if (storage && this.creepCarriesSomethingElseThanEnergy(creep)) {
      _.forEach(creep.carry, (value: number, r) => {
        const resourceConstant = r as ResourceConstant;
        if (r !== RESOURCE_ENERGY) {
          if (creep.pos.isNearTo(storage)) {
            creep.transfer(storage, resourceConstant, value);
          }
          else {
            creep.moveTo(storage);
          }
        }
      });
    }
  }

  public execute() {
    throw new Error('Not implemented yet.')
  }

  private creepCarriesSomethingElseThanEnergy(creep: Creep) {
    return _.some(creep.carry, (_v, r) => r !== RESOURCE_ENERGY);
  }
}
