declare type Intent = 'sleep' | 'harvest' | 'transfer' | 'repair' | 'build' | 'upgradeController';
declare type Status = 'idle' | 'moving' | 'working';

declare type Role = 'worker' | 'harvester';
declare type RoleGroup = 'workers' | 'harvesters';
declare type Creeps = { [key in RoleGroup]: Creep[] };

interface CreepMemory {
  task?: string;
  role?: Role;
  target?: RoomPosition | { pos: RoomPosition };
  workMultiplier: number;
}

type Job = {
  condition: boolean;
  target?: RoomPosition | { pos: RoomPosition };
  args?: any[];
}

type Jobs = {
  [key in Intent]: Job
};

type RoomCache = {
  fillableStructures?: AnyOwnedStructure[],
  buildableStructures?: ConstructionSite<BuildableStructureConstant>[],
  brokenStructures?: AnyStructure[],
  sources?: Source[],
};

type RoomCaches = { [roomName: string]: RoomCache };
