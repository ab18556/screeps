type Action = 'harvest' | 'transfer' | 'repair' | 'build' | 'upgradeController';

type Status = 'dying' | 'lookingForEnergy' | 'idle' | 'working';

interface Creeps<T = Creep> {
  [name: string]: T;
}

interface CreepRoles {
  builder: BuilderCreep;
  carrier: CarrierCreep;
  harvester: HarvesterCreep;
  worker: WorkerCreep;
}

type BuilderCreep = Creep;
type CarrierCreep = Creep
type WorkerCreep = Creep;

type AnyCreep = CreepRoles[keyof CreepRoles];
type CreepRole = keyof CreepRoles;

interface HarvesterCreep extends Creep {
  memory: HarvesterMemory;
}

type CreepsGroupedByRole = { [P in keyof CreepRoles]: { [creepName: string]: CreepRoles[P] } };

interface Towers {
  [id: string]: StructureTower;
}

type AnyEnergyRechargableOwnedStructure =
  | StructureExtension
  | StructureLab
  | StructureNuker
  | StructureSpawn
  | StructureTower;

interface HarvesterMemory extends CreepMemory {
  workMultiplier: number;
  assignments?: {
    sourceId: string,
    storeId?: string,
  }
}


interface CreepMemory extends Pick<CreepRoles[keyof CreepRoles]['memory'], keyof CreepRoles[keyof CreepRoles]['memory']> {
  role: CreepRole;
  room: string;
  status: Status;
}


interface RoomMemory {
  storageId: string;
  storageAdjacentLinkId: string;
  sources: string[];
}

interface TowerMemory {
  depleted: boolean;
}

interface Memory {
  creeps: { [name: string]: CreepMemory };
  flags: { [name: string]: FlagMemory };
  rooms: { [name: string]: RoomMemory };
  spawns: { [name: string]: SpawnMemory };
  towers: { [id: string]: TowerMemory };
}

interface Dispatch {
  assignments: string[];
  length: number;
}

interface Task {
  [creepName: string]: number
}

type Tasks = Task[];

interface Strategy {
  execute(): void;
}
