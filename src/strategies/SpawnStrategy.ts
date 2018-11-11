import RoomEntities from "RoomEntities";
import { SpawnAction } from "SpawnAction";


export default class SpawnStrategy {
    private creeps: CreepsGroupedByRole;
    private sources: Source[];
    private spawns: StructureSpawn[];
    private storage?: StructureStorage;
    private constructionSites: Array<ConstructionSite<BuildableStructureConstant>>;
    private containers: StructureContainer[];
    private room: Room;

    constructor({ creeps, sources, spawns, storage, constructionSites, containers, room }: RoomEntities) {
        this.creeps = creeps;
        this.sources = sources;
        this.spawns = spawns;
        this.storage = storage;
        this.constructionSites = constructionSites;
        this.containers = containers;
        this.room = room;
    }

    public applyTo(spawn: StructureSpawn) {
        const idleSpawn = this.applyFindIdleSpawnStrategy(this.spawns);
        if (idleSpawn) {
            const creepRole = this.getCreepRoleToSpawnNext(spawn);
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
        if (_.size(this.creeps.worker) < 4) {
            return 'worker';
        } else if (_.size(this.creeps.harvester) < this.sources.length && (this.storage || this.containers.length > 0)) {
            return 'harvester';
        } else if (_.size(this.creeps.carrier) < 1 && this.storage) {
            return 'carrier';
        } else if (_.size(this.constructionSites) > 0 && _.size(this.creeps.builder) < 1) {
            return 'builder';
        }

        return undefined;
    }
}
