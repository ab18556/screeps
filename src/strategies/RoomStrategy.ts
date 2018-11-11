import BuildStrategy from "./BuildStrategy";
import CarryStrategy from "./CarryStrategy";
import EnergyTeleportationStrategy from "./EnergyTeleportationStrategy";
import HarvestStrategy from "./HarvestStrategy";
import RechargeStrategy from "./RechargeStrategy";
import SpawnStrategy from "./SpawnStrategy";
import TowerStrategy from "./TowerStrategy";
import TransferStrategy from "./TransferStrategy";
import WorkStrategy from "./WorkStrategy";
import RoomEntities from "RoomEntities";

export default class RoomStrategy implements Strategy {
  public applyTo(room: Room) {
    if (this.isSimulation() || this.isClaimedRoom(room)) {
      const roomEntities = new RoomEntities(room);
      const { creeps, towers, linksNearToSources, spawns } = roomEntities;

      const rechargeStrategy = new RechargeStrategy(roomEntities);
      const workStrategy = new WorkStrategy(roomEntities, rechargeStrategy);
      const buildStrategy = new BuildStrategy(roomEntities, rechargeStrategy);
      const carryStrategy = new CarryStrategy(roomEntities);
      const harvestStrategy = new HarvestStrategy(roomEntities);
      const transferStrategy = new TransferStrategy(roomEntities);
      const towerStrategy = new TowerStrategy(roomEntities);
      const energyTeleportationStrategy = new EnergyTeleportationStrategy(roomEntities);
      const spawnStrategy = new SpawnStrategy(roomEntities);

      spawnStrategy.applyTo(spawns[0]);
      workStrategy.apply({ ...creeps.worker });

      _.forEach(creeps.builder, (builderCreep) => buildStrategy.applyTo(builderCreep));
      _.forEach(creeps.carrier, (carrier) => carryStrategy.applyTo(carrier));
      _.forEach(creeps.harvester, (harvester) => harvestStrategy.applyTo(harvester));

      _.forEach(Game.creeps, (creep) => transferStrategy.applyTo(creep));

      _.forEach(towers, (tower) => towerStrategy.applyTo(tower));
      energyTeleportationStrategy.execute();
    }
  }

  public execute() {
    throw new Error('Not implemented yet.')
  }

  private isSimulation() {
    return Game.shard.name === 'sim';
  }

  private isClaimedRoom(room: Room): boolean {
    return ['W16N39', 'W15N39'].includes(room.name);
  }
}
