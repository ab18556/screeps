import { RoomEntities } from "room";

export function spawnLoop(creeps: CreepsGroupedByRole, roomEntities: RoomEntities) {
  const { sources, storage, room, spawns } = roomEntities;

  if (!spawns[0]) {
    return;
  }

  if (Object.keys(creeps.worker).length < 4) {
    spawnWorker(spawns[0], room);
  } else if (Object.keys(creeps.harvester).length < sources.length && (storage || spawns[0].room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER })[0])) {
    const assignedSources = _.map(creeps.harvester, (s) => s.memory.assignments.sourceId);
    const source = sources.find((s) => !assignedSources.includes(s.id)) as Source;
    spawnHarvester(spawns[0], room, source);
  } else if (Object.keys(creeps.carrier).length < 1 && storage) {
    spawnCarrier(spawns[0], room);
  } else if (roomEntities.constructionSites.length > 0 && Object.keys(creeps.builder).length < 1) {
    spawnBuilder(spawns[0], room);
  }
}

function spawnWorker(spawn: StructureSpawn, room: Room) {
  const body = [MOVE, CARRY, WORK];
  const upgrade = [MOVE, CARRY, WORK];
  const bodyParts = getBodyParts(body, upgrade, room, 15);
  spawnCreep(spawn, bodyParts, `Worker${Game.time}`, {
    memory: {
      isHarvesting: true,
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
    isHarvesting: true,
    role: 'harvester',
    room: room.name,
    workMultiplier: _.filter(bodyParts, (b) => b === WORK).length,
  }
  spawnCreep(spawn, bodyParts, `Harvester${Game.time}`, { memory });
}

function spawnCarrier(spawn: StructureSpawn, room: Room) {
  const body = [MOVE, CARRY, CARRY];
  const upgrade: BodyPartConstant[] = [MOVE, CARRY, CARRY];
  const bodyParts = getBodyParts(body, upgrade, room);
  spawnCreep(spawn, bodyParts, `Carrier${Game.time}`, {
    memory: {
      isHarvesting: false,
      role: 'carrier',
      room: room.name,
    }
  });
}

function spawnBuilder(spawn: StructureSpawn, room: Room) {
  const body = [MOVE, CARRY, WORK];
  const upgrade: BodyPartConstant[] = [MOVE];
  const bodyParts = getBodyParts(body, upgrade, room, 4);
  spawnCreep(spawn, bodyParts, `Builder${Game.time}`, {
    memory: {
      isHarvesting: false,
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

function spawnCreep(spawn: StructureSpawn, body: BodyPartConstant[], name: string, opts?: SpawnOptions) {
  if (spawn.spawnCreep(body, name, opts) !== OK) {
    // TODO: Find a way tu use closest spawn instead
    const anyOtherSpawn = _.find(Game.spawns, (s) => s.id !== spawn.id);
    if (anyOtherSpawn) {
      anyOtherSpawn.spawnCreep(body, name, opts);
    }
  }
}
