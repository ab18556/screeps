declare type Action = 'harvest' | 'transfer' | 'repair' | 'build' | 'upgradeController';

declare type Creeps<T> = { [name: string]: T }

declare type CreepRoles = {
  worker: WorkerCreep;
  harvester: HarvesterCreep;
  carrier: CarrierCreep;
  builder: BuilderCreep;
}

declare type AnyCreep = CreepRoles[keyof CreepRoles];
declare type CreepRole = keyof CreepRoles;

interface HarvesterCreep extends Creep {
  memory: HarvesterMemory;
}

interface CarrierCreep extends Creep { }
interface BuilderCreep extends Creep { }

interface WorkerCreep extends Creep { }

declare type CreepsGroupedByRole = { [P in keyof CreepRoles]: { [creepName: string]: CreepRoles[P] } };

declare type Towers = { [id: string]: StructureTower };

interface SpawnOptions {
  memory?: AnyCreep['memory']
}

declare type AnyEnergyRechargableOwnedStructure =
  | StructureExtension
  | StructureLab
  | StructureNuker
  | StructureSpawn
  | StructureTower;

interface HarvesterMemory extends CreepMemory {
  workMultiplier: number;
  assignments: {
    sourceId: string,
    storeId?: string,
  }
}

interface CreepMemory {
  role: CreepRole;
  isHarvesting: boolean;
  room: string;
}

interface RoomMemory {
  storageId: string;
  storageLinkId: string;
}

interface TowerMemory {
  depleted: boolean;
}

interface Memory {
  creeps: { [name: string]: AnyCreep['memory'] };
  flags: { [name: string]: FlagMemory };
  rooms: { [name: string]: RoomMemory };
  spawns: { [name: string]: SpawnMemory };
  towers: { [id: string]: TowerMemory }
}

interface Dispatch {
  assignments: string[];
  length: number;
}

interface Task {
  [creepName: string]: number
}

type Tasks = Task[];
