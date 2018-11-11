import PositionHelpers from "helpers/PositionHelpers";
import RoomEntities from "RoomEntities";
import RechargeStrategy from "./RechargeStrategy";

export default class HarvestStrategy implements Strategy {
  private sources: Source[];
  private harvesterCreeps: { [creepName: string]: HarvesterCreep };
  private links: StructureLink[];
  private containers: StructureContainer[];

  constructor({ sources, creeps: { harvester }, linksNearToSources, containers }: RoomEntities) {
    this.sources = sources;
    this.harvesterCreeps = harvester;
    this.links = linksNearToSources;
    this.containers = containers;
  }
  public applyTo(harvester: HarvesterCreep) {
    const amountHarvestedPerTick = harvester.memory.workMultiplier * 2;
    const softCapacity = Math.floor(harvester.carryCapacity / amountHarvestedPerTick) * amountHarvestedPerTick;
    const source = _.find(this.sources, (s) => !_.some(this.harvesterCreeps, (h) => h.name !== harvester.name && h.pos.isNearTo(s)));

    if (source) {
      const smallEnergyStorage = PositionHelpers.getClosestToPosition([...this.links, ...this.containers], source.pos);

      if (smallEnergyStorage) {
        if (harvester.carry.energy > amountHarvestedPerTick * 2) {
          const capacity = this.getSmallEnergyStorageCapacity(smallEnergyStorage);
          const energy = this.getSmallStorageStoredEnergy(smallEnergyStorage);
          const amount = Math.min(capacity - energy, harvester.carry.energy);
          this.transferEnergyToSmallStorage(harvester, smallEnergyStorage, amount);
        }
        if (smallEnergyStorage.hits < smallEnergyStorage.hitsMax && harvester.carry.energy) {
          this.repairSmallStorage(harvester, smallEnergyStorage);
        }
        if (harvester.carry.energy < softCapacity) {
          RechargeStrategy.harvestEnergyFromSource(harvester, source);
        }
      }
    }
  }

  public execute() {
    throw new Error('Not implemented yet.')
  }

  private getSmallStorageStoredEnergy(smallEnergyStorage: StructureLink | StructureContainer) {
    if ((smallEnergyStorage as StructureContainer).store) {
      return (smallEnergyStorage as StructureContainer).store.energy;
    }
    return (smallEnergyStorage as StructureLink).energy;
  }

  private getSmallEnergyStorageCapacity(smallEnergyStorage: StructureLink | StructureContainer) {
    return (smallEnergyStorage as StructureContainer).storeCapacity || (smallEnergyStorage as StructureLink).energyCapacity;
  }

  private transferEnergyToSmallStorage(harvesterCreep: HarvesterCreep, smallEnergyStorage: StructureContainer | StructureLink, amount: number) {
    if (harvesterCreep.transfer(smallEnergyStorage, RESOURCE_ENERGY, amount) === ERR_NOT_IN_RANGE) {
      harvesterCreep.moveTo(smallEnergyStorage);
    }
  }

  private repairSmallStorage(harvesterCreep: HarvesterCreep, smallStorage: StructureContainer | StructureLink) {
    if (harvesterCreep.repair(smallStorage)) {
      harvesterCreep.moveTo(smallStorage);
    }
  }
}
