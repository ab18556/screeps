import RoomEntities from "RoomEntities";


export default class TransferStrategy implements Strategy {
  private storage?: StructureStorage;
  private creeps: Creeps;

  constructor({ storage, creeps }: RoomEntities) {
    this.storage = storage;
    this.creeps = creeps;
  }

  public execute() {
    if (this.storage) {
      this.bringElementsToStorage(this.storage);
    }
  }

  private bringElementsToStorage(storage: StructureStorage) {
    _.forEach(this.creeps, (creep) => {
      if (this.creepCarriesSomethingElseThanEnergy(creep)) {
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
    });
  }

  private creepCarriesSomethingElseThanEnergy(creep: Creep) {
    return _.some(creep.carry, (_v, r) => r !== RESOURCE_ENERGY);
  }
}
