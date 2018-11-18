import RoomEntities from "RoomEntities";
import BuildStrategy from "./BuildStrategy";
import CarryStrategy from "./CarryStrategy";
import EnergyTeleportationStrategy from "./EnergyTeleportationStrategy";
import HarvestStrategy from "./HarvestStrategy";
import RechargeStrategy from "./RechargeStrategy";
import SpawnStrategy from "./SpawnStrategy";
import TowerStrategy from "./TowerStrategy";
import TransferStrategy from "./TransferStrategy";
import WorkStrategy from "./WorkStrategy";

export default class RoomStrategy implements Strategy {
  public execute() {
    _.forEach(Game.rooms, (room) => {
      if (this.isSimulation() || this.isClaimedRoom(room)) {
        const roomEntities = new RoomEntities(room);
        const rechargeStrategy = new RechargeStrategy(roomEntities);
        const workStrategy = new WorkStrategy(roomEntities);
        const buildStrategy = new BuildStrategy(roomEntities);
        const carryStrategy = new CarryStrategy(roomEntities);
        const harvestStrategy = new HarvestStrategy(roomEntities);
        const transferStrategy = new TransferStrategy(roomEntities);
        const towerStrategy = new TowerStrategy(roomEntities);
        const energyTeleportationStrategy = new EnergyTeleportationStrategy(roomEntities);
        const spawnStrategy = new SpawnStrategy(roomEntities);
        spawnStrategy.execute();
        rechargeStrategy.execute();
        workStrategy.execute();
        buildStrategy.execute();
        carryStrategy.execute();
        harvestStrategy.execute();
        transferStrategy.execute();
        towerStrategy.execute();
        energyTeleportationStrategy.execute();
      }
    });
  }

  private isSimulation() {
    return Game.shard.name === 'sim';
  }

  private isClaimedRoom(room: Room): boolean {
    return ['W16N39', 'W15N39'].includes(room.name);
  }
}
