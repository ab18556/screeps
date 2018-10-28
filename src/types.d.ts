declare type Action = 'harvest' | 'transfer' | 'repair' | 'build' | 'upgradeController';

declare type Creeps<T> = { [name: string]: T }

declare type CreepRoles = {
  worker: WorkerCreep;
  harvester: HarvesterCreep;
  roadWorker: RoadWorkerCreep;
}

declare type AnyCreep = CreepRoles[keyof CreepRoles];
declare type CreepRole = keyof CreepRoles;

interface HarvesterCreep extends Creep {
  memory: HarvesterMemory;
}

interface RoadWorkerCreep extends Creep { }

interface WorkerCreep extends Creep { }

declare type CreepsGroupedByRole = { [P in keyof CreepRoles]: { [creepName: string]: CreepRoles[P] } };

declare type Towers = { [id: string]: StructureTower };

interface SpawnOptions {
  memory?: AnyCreep['memory']
}

interface HarvesterMemory extends CreepMemory {
  workMultiplier: number;
}

interface CreepMemory {
  role: CreepRole;
  isHarvesting: boolean;
}

interface TowerMemory {
  depleted: boolean;
}

declare type AnyEnergyRechargableOwnedStructure =
  | StructureExtension
  | StructureLab
  | StructureNuker
  | StructureSpawn
  | StructureTower;

interface Memory {
  creeps: { [name: string]: AnyCreep['memory'] };
  flags: { [name: string]: FlagMemory };
  rooms: { [name: string]: RoomMemory };
  spawns: { [name: string]: SpawnMemory };
  towers: { [id: string]: TowerMemory }
}

type Job = {
  condition: boolean;
  target?: RoomPosition | { pos: RoomPosition };
  args?: any[];
}

type Jobs = {
  [key in Action]: Job
};

type RoomCache = {
  fillableStructures?: AnyOwnedStructure[],
  buildableStructures?: ConstructionSite<BuildableStructureConstant>[],
  brokenStructures?: AnyStructure[],
  sources?: Source[],
};

type RoomCaches = { [roomName: string]: RoomCache };

interface Dispatch {
  assignments: string[];
  length: number;
}

interface Task {
  [creepName: string]: number
}

type Tasks = Task[];
