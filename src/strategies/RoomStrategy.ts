import RoomEntities from "RoomEntities";
import BuildStrategy from "./BuildStrategy";
import CarryStrategy from "./CarryStrategy";
import HarvestStrategy from "./HarvestStrategy";
import LinkStrategy from "./LinkStrategy";
import RechargeStrategy from "./RechargeStrategy";
import SpawnStrategy from "./SpawnStrategy";
import TowerStrategy from "./TowerStrategy";
import TransferStrategy from "./TransferStrategy";
import WorkStrategy from "./WorkStrategy";

export default class RoomStrategy {
  public applyTo(room: Room) {
    if (this.isSimulation() || this.isClaimedRoom(room)) {
      const roomEntities = new RoomEntities(room);
      const { creeps, towers, links, spawns } = roomEntities;

      const rechargeStrategy = new RechargeStrategy(roomEntities);
      const workStrategy = new WorkStrategy(roomEntities, rechargeStrategy);
      const buildStrategy = new BuildStrategy(roomEntities, rechargeStrategy);
      const carryStrategy = new CarryStrategy(roomEntities);
      const harvestStrategy = new HarvestStrategy(roomEntities);
      const transferStrategy = new TransferStrategy(roomEntities);
      const towerStrategy = new TowerStrategy(roomEntities);
      const linkStrategy = new LinkStrategy(roomEntities);
      const spawnStrategy = new SpawnStrategy(roomEntities);

      spawnStrategy.applyTo(spawns[0]);
      workStrategy.apply({ ...creeps.worker });

      _.forEach(creeps.builder, (builderCreep) => buildStrategy.applyTo(builderCreep));
      _.forEach(creeps.carrier, (carrier) => carryStrategy.applyTo(carrier));
      _.forEach(creeps.harvester, (harvester) => harvestStrategy.applyTo(harvester));

      _.forEach(Game.creeps, (creep) => transferStrategy.applyTo(creep));

      _.forEach(towers, (tower) => towerStrategy.applyTo(tower));
      _.forEach(links, (link) => linkStrategy.applyTo(link));
    }
  }

  private isSimulation() {
    return Game.shard.name === 'sim';
  }

  private isClaimedRoom(room: Room): boolean {
    return ['W16N39', 'W15N39'].includes(room.name);
  }
}
