import { RoomEntities } from "room";

export function applyCreepSpawningStrategy(
  roomEntities: RoomEntities,
  numberOfWorkers: number,
  numberOfHarvesters: number,
  numberOfCarriers: number,
  numberOfBuilders: number,
  spawn: StructureSpawn,
) {
  const nextCreepRoleToSpawn = getNextCreepTypeToSpawn(
    roomEntities,
    numberOfWorkers,
    numberOfHarvesters,
    numberOfCarriers,
    numberOfBuilders,
    spawn,
  );

  if (nextCreepRoleToSpawn) {
    spawnCreep(nextCreepRoleToSpawn, spawn, roomEntities.creeps.harvester, roomEntities.sources);
  }
}

function getNextCreepTypeToSpawn(
  roomEntities: RoomEntities,
  numberOfWorkers: number,
  numberOfHarvesters: number,
  numberOfCarriers: number,
  numberOfBuilders: number,
  spawn: StructureSpawn,
): keyof CreepRoles | undefined {
  const { creeps, sources, storage, room, spawns } = roomEntities;

  // This order is part of the strategy.
  // We want to prioritize workers over harvester, ..., and builders
  if (numberOfWorkers < 4) {
    return 'worker';
  } else if (numberOfHarvesters < sources.length && (storage || spawns[0].room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER })[0])) {
    return 'harvester';
  } else if (numberOfCarriers < 1 && storage) {
    return 'carrier';
  } else if (roomEntities.constructionSites.length > 0 && numberOfBuilders < 1) {
    return 'builder';
  }

  return undefined;
}

function spawnWorker(spawn: StructureSpawn, room: Room) {
  const body = [MOVE, CARRY, WORK];
  const upgrade = [MOVE, CARRY, WORK];
  const bodyParts = getBodyParts(body, upgrade, room, 15);
  doSpawnCreep(spawn, bodyParts, `Worker${Game.time}`, {
    memory: {
      isLookingForEnergy: true,
      role: 'worker',
      room: room.name,
    }
  });
}

function spawnHarvester(spawn: StructureSpawn, room: Room, source: Source) {
  const body = [CARRY, MOVE, WORK]
  const upgrade = [WORK, MOVE, WORK];
  const bodyParts = getBodyParts(body, upgrade, room, 9);
  const memory: HarvesterMemory = {
    assignments: {
      sourceId: source.id,
      storeId: getHarvesterStoreId(source),
    },
    isLookingForEnergy: true,
    role: 'harvester',
    room: room.name,
    workMultiplier: _.filter(bodyParts, (b) => b === WORK).length,
  }
  doSpawnCreep(spawn, bodyParts, `Harvester${Game.time}`, { memory });
}

function spawnCarrier(spawn: StructureSpawn, room: Room) {
  const body = [MOVE, CARRY, CARRY];
  const upgrade: BodyPartConstant[] = [MOVE, CARRY, CARRY];
  const bodyParts = getBodyParts(body, upgrade, room);
  doSpawnCreep(spawn, bodyParts, `Carrier${Game.time}`, {
    memory: {
      isLookingForEnergy: false,
      role: 'carrier',
      room: room.name,
    }
  });
}

function spawnBuilder(spawn: StructureSpawn, room: Room) {
  const body = [MOVE, CARRY, WORK];
  const upgrade: BodyPartConstant[] = [MOVE];
  const bodyParts = getBodyParts(body, upgrade, room, 4);
  doSpawnCreep(spawn, bodyParts, `Builder${Game.time}`, {
    memory: {
      isLookingForEnergy: false,
      role: 'builder',
      room: room.name,
    }
  });
}

function getBodyParts(body: BodyPartConstant[], bodyUpgrade: BodyPartConstant[], room: Room, maxParts?: number) {
  const numberOfExtensions = room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_EXTENSION }).length;
  let maxEnergyAvailable = numberOfExtensions * 50 + 300;

  if (_.map(Game.creeps).length === 0) {
    maxEnergyAvailable = Math.min(maxEnergyAvailable, room.energyAvailable);
  }

  let totalBodyParts = body;
  let nextUpgradeIndex = 0;
  let nextUpgradedBody = [...totalBodyParts, bodyUpgrade[nextUpgradeIndex]];


  console.log(getBodyPartsCost(nextUpgradedBody));
  console.log(maxEnergyAvailable);
  while (bodyUpgrade.length > 0 && (!maxParts || nextUpgradedBody.length <= maxParts) && getBodyPartsCost(nextUpgradedBody) <= maxEnergyAvailable) {
    totalBodyParts = [...totalBodyParts, bodyUpgrade[nextUpgradeIndex]];
    nextUpgradeIndex = nextUpgradeIndex < bodyUpgrade.length - 1 ? nextUpgradeIndex + 1 : 0;
    nextUpgradedBody = [...totalBodyParts, bodyUpgrade[nextUpgradeIndex]];
  }

  return totalBodyParts;
}

function getBodyPartsCost(bodyParts: BodyPartConstant[]) {
  return _.sum(bodyParts.map((b) => BODYPART_COST[b]));
}

function getHarvesterStoreId(source: Source) {
  const container = source.pos.findInRange<StructureContainer>(FIND_STRUCTURES, 1, { filter: (s) => s.structureType === STRUCTURE_CONTAINER })[0];
  const link = source.pos.findInRange<StructureLink>(FIND_STRUCTURES, 1, { filter: (s) => s.structureType === STRUCTURE_LINK })[0];
  const store = link || container;
  return store ? store.id : undefined;
}

function spawnCreep(creepRole: keyof CreepRoles, spawn: StructureSpawn, harvesters: { [creepName: string]: HarvesterCreep }, sources: Source[]) {
  switch (creepRole) {
    case 'builder':
      spawnBuilder(spawn, spawn.room);
      break;
    case 'carrier':
      spawnCarrier(spawn, spawn.room);
      break;
    case 'harvester':
      const exploitedSources = _.map(harvesters, (s) => s.memory.assignments.sourceId);
      const source = sources.find((s) => !exploitedSources.includes(s.id)) as Source;
      spawnHarvester(spawn, spawn.room, source);
      break;
    case 'worker':
      spawnWorker(spawn, spawn.room);
      break;
  }
}

function doSpawnCreep(spawn: StructureSpawn, body: BodyPartConstant[], name: string, opts?: SpawnOptions) {
  if (spawn.spawnCreep(body, name, opts) !== OK) {
    // TODO: Find a way tu use closest spawn instead
    const anyOtherSpawn = _.find(Game.spawns, (s) => s.id !== spawn.id);
    if (anyOtherSpawn) {
      anyOtherSpawn.spawnCreep(body, name, opts);
    }
  }
}
