import RoomEntities from "RoomEntities";
import { executeWithClosestCreep } from "taskDispatch";
import RechargeStrategy from "./RechargeStrategy";


export default class WorkStrategy implements Strategy {
  private roomEntities: RoomEntities;
  private rechargeableSpawnRelatedStructures: Array<StructureSpawn | StructureExtension>;
  private brokenStructures: AnyOwnedStructure[];
  private builderCreeps: CreepsGroupedByRole['builder'];
  private carrierCreeps: CreepsGroupedByRole['carrier'];
  private rechargeableTowers: StructureTower[];
  private constructionSites: Array<ConstructionSite<BuildableStructureConstant>>;
  private room: Room;
  private idleWorkerCreeps: CreepsGroupedByRole['worker'];

  constructor(roomEntities: RoomEntities) {
    const { rechargeableSpawnRelatedStructures, brokenStructures, creepsGroupedByRole: { builder, carrier, worker }, rechargeableTowers, constructionSites, room } = roomEntities;

    this.roomEntities = roomEntities;
    this.rechargeableSpawnRelatedStructures = rechargeableSpawnRelatedStructures;
    this.brokenStructures = brokenStructures;
    this.builderCreeps = builder;
    this.carrierCreeps = carrier;
    this.rechargeableTowers = rechargeableTowers;
    this.constructionSites = constructionSites;
    this.room = room;
    this.idleWorkerCreeps = { ...worker };
  }

  public execute() {
    this.rechargeWorkerCreeps(this.idleWorkerCreeps, this.roomEntities);
    executeWithClosestCreep('transfer', this.rechargeableSpawnRelatedStructures, this.idleWorkerCreeps, [RESOURCE_ENERGY]);
    executeWithClosestCreep('repair', this.brokenStructures, this.idleWorkerCreeps);
    if (_.size(this.carrierCreeps) === 0) {
      executeWithClosestCreep('transfer', this.rechargeableTowers, this.idleWorkerCreeps, [RESOURCE_ENERGY]);
    }
    if (this.constructionSites.length > 0 && _.size(this.builderCreeps) === 0) {
      // TODO: Remove crappy sort
      executeWithClosestCreep('build', [_.sortBy(this.constructionSites, (s) => s.pos.x).reverse()[0]], this.idleWorkerCreeps);
    }
    _.forEach(this.idleWorkerCreeps, (workerCreep) => {
      if (this.room.controller) {
        this.upgradeController(workerCreep, this.room.controller);
      }
    });
  }

  private rechargeWorkerCreeps(workerCreeps: { [x: string]: WorkerCreep; }, roomEntities: RoomEntities) {
    const orderedWorkerCreepsToBeRecharged = this.optimizeWorkerCreepRechargeOrder(workerCreeps);

    _.forEach(orderedWorkerCreepsToBeRecharged, (workerCreep) => {
      if (workerCreep.memory.status === 'lookingForEnergy') {
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
