import RoomEntities from "RoomEntities";
import { SpawnAction } from "SpawnAction";


export default class SpawnStrategy implements Strategy {
    private workerCreeps: CreepsGroupedByRole['worker'];
    private harvesterCreeps: CreepsGroupedByRole['harvester'];
    private carrierCreeps: CreepsGroupedByRole['carrier'];
    private builderCreeps: CreepsGroupedByRole['builder'];
    private sources: Source[];
    private spawns: StructureSpawn[];
    private storage?: StructureStorage;
    private constructionSites: Array<ConstructionSite<BuildableStructureConstant>>;
    private containers: StructureContainer[];
    private room: Room;

    constructor({ creepsGroupedByRole: { worker, harvester, carrier, builder }, sources, spawns, storage, constructionSites, containers, room }: RoomEntities) {
        this.workerCreeps = worker;
        this.harvesterCreeps = harvester;
        this.carrierCreeps = carrier;
        this.builderCreeps = builder;
        this.sources = sources;
        this.spawns = spawns;
        this.storage = storage;
        this.constructionSites = constructionSites;
        this.containers = containers;
        this.room = room;
    }

    public execute() {
        const idleSpawn = this.applyFindIdleSpawnStrategy(this.spawns);
        if (idleSpawn) {
            const creepRole = this.getCreepRoleToSpawnNext(this.spawns[0]);
            if (creepRole) {
                const spawnAction = new SpawnAction(creepRole, idleSpawn, this.room);
                spawnAction.run();
            }
        }
    }

    private applyFindIdleSpawnStrategy(currentRoomSpawns: StructureSpawn[]) {
        const currentRoomIdleSpawn = _.find(currentRoomSpawns, (spawn) => spawn.isActive && !spawn.spawning);

        if (currentRoomIdleSpawn) {
            return currentRoomIdleSpawn;
        }
        else {
            return _.find(Game.spawns, (spawn) => spawn.isActive && !spawn.spawning);
        }
    }

    private getCreepRoleToSpawnNext(spawn: StructureSpawn): keyof CreepRoles | undefined {
        // This order is part of the strategy.
        // We want to prioritize workers over harvester, ..., and builders
        if (_.size(this.workerCreeps) < 4) {
            return 'worker';
        } else if (_.size(this.harvesterCreeps) < this.sources.length && (this.storage || this.containers.length > 0)) {
            return 'harvester';
        } else if (_.size(this.carrierCreeps) < 1 && this.storage) {
            return 'carrier';
        } else if (_.size(this.constructionSites) > 0 && _.size(this.builderCreeps) < 1) {
            return 'builder';
        }

        return undefined;
    }
}
