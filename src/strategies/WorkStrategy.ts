import RoomEntities from "RoomEntities";
import { executeWithClosestCreep } from "taskDispatch";
import RechargeStrategy from "./RechargeStrategy";


export default class WorkStrategy implements Strategy {
  private roomEntities: RoomEntities;
  private rechargeableSpawnRelatedStructures: Array<StructureSpawn | StructureExtension>;
  private brokenStructures: AnyOwnedStructure[];
  private creeps: CreepsGroupedByRole;
  private rechargeableTowers: StructureTower[];
  private constructionSites: Array<ConstructionSite<BuildableStructureConstant>>;
  private room: Room;
  private rechargeStrategy: RechargeStrategy;

  constructor(roomEntities: RoomEntities, rechargeStrategy: RechargeStrategy) {
    const { rechargeableSpawnRelatedStructures, brokenStructures, creeps, rechargeableTowers, constructionSites, room } = roomEntities;

    this.roomEntities = roomEntities;
    this.rechargeableSpawnRelatedStructures = rechargeableSpawnRelatedStructures;
    this.brokenStructures = brokenStructures;
    this.creeps = creeps;
    this.rechargeableTowers = rechargeableTowers;
    this.constructionSites = constructionSites;
    this.room = room;
    this.rechargeStrategy = rechargeStrategy;
  }

  public apply(idleWorkerCreeps: { [x: string]: WorkerCreep; }) {
    this.rechargeWorkerCreeps(idleWorkerCreeps, this.roomEntities);
    executeWithClosestCreep('transfer', this.rechargeableSpawnRelatedStructures, idleWorkerCreeps, [RESOURCE_ENERGY]);
    executeWithClosestCreep('repair', this.brokenStructures, idleWorkerCreeps);

    if (_.size(this.creeps.carrier) === 0) {
      executeWithClosestCreep('transfer', this.rechargeableTowers, idleWorkerCreeps, [RESOURCE_ENERGY]);
    }

    if (this.constructionSites.length > 0 && Object.keys(this.creeps.builder).length === 0) {
      // TODO: Remove crappy sort
      executeWithClosestCreep('build', [_.sortBy(this.constructionSites, (s) => s.pos.x).reverse()[0]], idleWorkerCreeps);
    }
    _.forEach(idleWorkerCreeps, (workerCreep) => {
      if (this.room.controller) {
        this.upgradeController(workerCreep, this.room.controller);
      }
    });
  }

  public execute() {
    throw new Error('Not implemented yet.')
  }

  private rechargeWorkerCreeps(workerCreeps: { [x: string]: WorkerCreep; }, roomEntities: RoomEntities) {
    const orderedWorkerCreepsToBeRecharged = this.optimizeWorkerCreepRechargeOrder(workerCreeps);

    _.forEach(orderedWorkerCreepsToBeRecharged, (workerCreep) => {
      RechargeStrategy.toggleFlagIsLookingForEnergy(workerCreep);

      if (workerCreep.memory.isLookingForEnergy) {
        this.rechargeStrategy.applyTo(workerCreep);
        if (workerCreeps) {
          delete workerCreeps[workerCreep.name];
        }
      }
    });
  }

  private upgradeController(workerCreep: WorkerCreep, controller: StructureController) {
    if (workerCreep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      workerCreep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }

  private optimizeWorkerCreepRechargeOrder(workerCreeps: { [x: string]: WorkerCreep; }) {
    return this.orderByEnergyNeededToBeFull(workerCreeps);
  }

  private orderByEnergyNeededToBeFull(workerCreeps: { [x: string]: WorkerCreep; }) {
    return _.sortBy(workerCreeps, (c) => c.carryCapacity - c.carry.energy);
  }
}
