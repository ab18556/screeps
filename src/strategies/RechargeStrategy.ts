import PositionHelpers from "helpers/PositionHelpers";
import RoomEntities from "RoomEntities";

export default class RechargeStrategy {
  private looseEnergyNodes: Array<Resource<RESOURCE_ENERGY>>;
  private tombstones: Tombstone[];
  private activeContainers: StructureContainer[];
  private storage?: StructureStorage;
  private storageLink?: StructureLink;
  private sources: Source[];
  private harvesterCreeps: { [creepName: string]: HarvesterCreep };

  constructor({ looseEnergyNodes, tombstones, activeContainers, storage, storageLink, sources, creeps: { harvester } }: RoomEntities) {
    this.looseEnergyNodes = looseEnergyNodes;
    this.tombstones = tombstones;
    this.activeContainers = activeContainers;
    this.storage = storage;
    this.storageLink = storageLink;
    this.sources = sources;
    this.harvesterCreeps = harvester;
  }

  public applyTo(creep: AnyCreep) {
    const closestContainer = PositionHelpers.getClosestToPosition(this.activeContainers, creep.pos);

    if (this.looseEnergyNodes.length > 0) {
      this.pickupLooseEnergy(creep, this.looseEnergyNodes[0]);
    }
    else if (this.tombstones.length > 0) {
      this.lootTombstone(creep, this.tombstones[0]);
    }
    else if (this.storage && this.storage.store.energy > 0) {
      this.withdrawEnergyFromStorage(creep, this.storage);
    }
    else if (this.storageLink && this.storageLink.energy > 0) {
      this.withdrawEnergyFromStorageLink(creep, this.storageLink);
    }
    else if (closestContainer) {
      this.withdrawEnergyFromContainer(creep, closestContainer);
    }
    else if (this.sources.length > 0 && _.size(this.harvesterCreeps) === 0) {
      const closestSource = PositionHelpers.getClosestToPosition(this.sources, creep.pos);
      RechargeStrategy.harvestEnergyFromSource(creep, closestSource);
    }

  }

  private pickupLooseEnergy(creep: AnyCreep, looseEnergyNode: Resource<RESOURCE_ENERGY>) {
    if (creep.pickup(looseEnergyNode) === ERR_NOT_IN_RANGE) {
      creep.moveTo(looseEnergyNode, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }

  private withdrawEnergyFromContainer(creep: AnyCreep, closestContainer: StructureContainer) {
    if (creep.withdraw(closestContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(closestContainer, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }

  private withdrawEnergyFromStorageLink(creep: AnyCreep, storageLink: StructureLink) {
    if (creep.withdraw(storageLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(storageLink, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }

  private withdrawEnergyFromStorage(creep: AnyCreep, storage: StructureStorage) {
    if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }

  private lootTombstone(creep: AnyCreep, tombstone: Tombstone) {
    if (creep.withdraw(tombstone, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(tombstone, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }

  public static toggleFlagIsLookingForEnergy(creep: AnyCreep) {
    if (!creep.carry.energy) {
      creep.memory.isLookingForEnergy = true;
    }
    else if (creep.carry.energy === creep.carryCapacity) {
      creep.memory.isLookingForEnergy = false;
    }
  }

  public static harvestEnergyFromSource(creep: AnyCreep, source: Source) {
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }
}
