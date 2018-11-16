import PositionHelpers from "helpers/PositionHelpers";
import RoomEntities from "RoomEntities";


export default class CarryStrategy implements Strategy {
  private storageAdjacentLink?: StructureLink;
  private activeContainers: StructureContainer[];
  private rechargeableSpawnRelatedStructures: Array<StructureSpawn | StructureExtension>;
  private rechargeableTowers: StructureTower[];
  private storage?: StructureStorage;
  private carrierCreeps: CreepsGroupedByRole['carrier'];


  constructor({ activeContainers, storageAdjacentLink, rechargeableSpawnRelatedStructures, rechargeableTowers, storage, creepsGroupedByRole: { carrier } }: RoomEntities) {
    this.storageAdjacentLink = storageAdjacentLink;
    this.activeContainers = activeContainers;
    this.rechargeableSpawnRelatedStructures = rechargeableSpawnRelatedStructures;
    this.rechargeableTowers = rechargeableTowers;
    this.storage = storage;
    this.carrierCreeps = carrier;
  }

  public execute() {
    _.forEach(this.carrierCreeps, (carrierCreep) => {
      if (!carrierCreep.carry.energy || (this.storageAdjacentLink && carrierCreep.carryCapacity - carrierCreep.carry.energy > this.storageAdjacentLink.energy)) {
        carrierCreep.memory.status = 'lookingForEnergy';
      }
      if (carrierCreep.memory.status === 'lookingForEnergy') {
        if (this.storageAdjacentLink && this.storageAdjacentLink.energy > 0) {
          if (carrierCreep.withdraw(this.storageAdjacentLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            carrierCreep.moveTo(this.storageAdjacentLink);
          }
          else {
            carrierCreep.memory.status = 'idle';
          }
        }
        else if (this.activeContainers.length > 0) {
          const largestEnergySource = _.sortByOrder(this.activeContainers, (s: StructureContainer & StructureLink) => (s.store && s.store.energy) || s.energy, 'desc')[0];
          if (largestEnergySource) {
            if (carrierCreep.withdraw(largestEnergySource, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              carrierCreep.moveTo(largestEnergySource);
            }
            else {
              carrierCreep.memory.status = 'idle';
            }
          }
        }
        else {
          carrierCreep.memory.status = 'idle';
        }
      }
      else {
        if (this.rechargeableSpawnRelatedStructures.length > 0) {
          const closestSpawnRelatedStructures = PositionHelpers.orderByRangeToPosition(this.rechargeableSpawnRelatedStructures, carrierCreep.pos)[0];
          this.transferEnergyToSpawnRelatedStructure(carrierCreep, closestSpawnRelatedStructures);
        }
        else if (_.any(this.rechargeableTowers, (t) => t.energy / t.energyCapacity < 0.75)) {
          const nearTower = _.find(this.rechargeableTowers, (t) => carrierCreep.pos.isNearTo(t) && t.energy / t.energyCapacity < 0.75);
          const bestTower = nearTower || _.sortByAll(this.rechargeableTowers, [(s) => Math.floor(s.energy / s.energyCapacity * 100 / 20), (s) => carrierCreep.pos.getRangeTo(s)])[0];
          this.transferEnergyToTower(carrierCreep, bestTower);
        }
        else if (this.storage && this.storage.store.energy !== this.storage.storeCapacity) {
          this.transferEnergyToStorage(carrierCreep, this.storage);
        }
      }
    });
  }

  private transferEnergyToSpawnRelatedStructure(carrierCreep: CarrierCreep, spawnRelatedStructure: StructureSpawn | StructureExtension) {
    if (carrierCreep.transfer(spawnRelatedStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      carrierCreep.moveTo(spawnRelatedStructure);
    }
  }

  private transferEnergyToTower(carrierCreep: CarrierCreep, tower: StructureTower) {
    if (carrierCreep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      carrierCreep.moveTo(tower);
    }
  }

  private transferEnergyToStorage(carrierCreep: CarrierCreep, storage: StructureStorage) {
    if (carrierCreep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      carrierCreep.moveTo(storage);
    }
  }
}
