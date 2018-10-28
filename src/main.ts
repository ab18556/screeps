import { spawnLoop } from "collections/Spawns";
import { executeWithClosestCreep } from "taskDispatch";
import { ErrorMapper } from "utils/ErrorMapper";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  initMemory();
  cleanMissinCreepsMemory();

  _.forEach(Game.rooms, (room) => {
    const towers = findTowers(room);
    const containers = findContainers(room);
    const activeContainers = findActiveContainers(room);
    const rechargeableStructures = findRechargeableStructures(room);
    const brokenRoads = findBrokenRoads(room);
    const brokenStructures = findBrokenStructures(room);
    const constructionSites = findConstructionSites(room);
    const tombstones = findTombstones(room);
    const creeps = getCreepsGroupedByRole();
    const idleWorkerCreeps = { ...creeps.worker };
    const hostiles = room.find(FIND_HOSTILE_CREEPS);

    cleanMissingTowersMemory(towers);

    // Spawning Creeps
    spawnLoop(creeps, _.map(Game.spawns), containers);

    _.forEach({ ...idleWorkerCreeps }, (c) => recharge(c, idleWorkerCreeps));
    _.forEach(creeps.roadWorker, (c) => recharge(c));

    // Harvesters loop
    Object.keys(creeps.harvester).forEach((h, i) => {
      const container = containers[i];
      const source = room.find(FIND_SOURCES)[i];
      const amountHarvestedPerTick = creeps.harvester[h].memory.workMultiplier * 2;
      const softCapacity = Math.floor(creeps.harvester[h].carryCapacity / amountHarvestedPerTick) * amountHarvestedPerTick;

      if (creeps.harvester[h].carry.energy > amountHarvestedPerTick * 2) {
        const amount = Math.min(container.storeCapacity - container.store.energy, creeps.harvester[h].carry.energy);

        if (creeps.harvester[h].transfer(container, RESOURCE_ENERGY, amount) === ERR_NOT_IN_RANGE) {
          creeps.harvester[h].moveTo(container, { reusePath: 10 });
        }
      }

      if (container.hits < container.hitsMax && creeps.harvester[h].carry.energy) {
        if (creeps.harvester[h].repair(container)) {
          creeps.harvester[h].moveTo(container, { reusePath: 10 });
        };
      }

      if (creeps.harvester[h].carry.energy < softCapacity) {
        if (creeps.harvester[h].harvest(source) === ERR_NOT_IN_RANGE) {
          creeps.harvester[h].moveTo(source, { reusePath: 10 });
        }
      }
    });

    // Planning moves
    executeWithClosestCreep('transfer', rechargeableStructures, idleWorkerCreeps, [RESOURCE_ENERGY]);

    if (brokenRoads.length === 0) {
      Object.keys(creeps.roadWorker).forEach((n) => rest(creeps.roadWorker[n]));
    } else {
      executeWithClosestCreep('repair', brokenRoads, { ...creeps.roadWorker });
    }

    executeWithClosestCreep('repair', brokenStructures, idleWorkerCreeps);

    while (constructionSites.length > 0 && !_.isEmpty(idleWorkerCreeps)) {
      executeWithClosestCreep('build', constructionSites, idleWorkerCreeps)
    }

    _.forEach(towers, (t) => {
      const criticalyBrokenRoad = brokenRoads.filter((r) => r.hits < r.hitsMax * 0.75);
      if (hostiles.length > 0) {
        const closestHostile = hostiles.reduce((ch, h, i, a) => {
          const currentRange = t.pos.getRangeTo(h);
          if (currentRange < ch.range) {
            return { hostile: h, range: currentRange }
          } else {
            return ch;
          }
        }, { hostile: hostiles[0], range: Infinity });

        t.attack(closestHostile.hostile);
      } else if (criticalyBrokenRoad.length > 0) {
        const closestBrokenRoad = criticalyBrokenRoad.reduce((cbr, r, i, a) => {
          const currentRange = t.pos.getRangeTo(r);
          if (currentRange < cbr.range) {
            return { road: r, range: currentRange }
          } else {
            return cbr;
          }
        }, { road: brokenRoads[0], range: Infinity });

        t.repair(closestBrokenRoad.road);
      }
    })

    _.forEach(idleWorkerCreeps, (c) => {
      if (room.controller) {
        if (c.upgradeController(room.controller) === ERR_NOT_IN_RANGE) {
          c.moveTo(room.controller, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 0 });
        }
      }
    });

    function rest(creep: Creep) {
      // creep.moveTo(room.find(FIND_FLAGS, { filter: (f) => f.color === COLOR_WHITE })[0]);
      if (room.controller) {
        if (creep.upgradeController(room.controller) === ERR_NOT_IN_RANGE) {
          creep.moveTo(room.controller, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 0 });
        }
      }
    }

    function recharge<T extends Creep>(c: AnyCreep, removeFrom?: Creeps<T>) {
      if (!c.carry.energy) {
        c.memory.isHarvesting = true;
      }
      if (c.memory.isHarvesting) {
        if (c.carry.energy === c.carryCapacity) {
          c.memory.isHarvesting = false;
        } else {
          if (tombstones.length > 0) {
            if (c.withdraw(tombstones[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              c.moveTo(tombstones[0], { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 0 });
            }
          }
          if (activeContainers.length > 0) {
            const closestContainer = _.sortBy(activeContainers, (x) => c.pos.getRangeTo(x))[0];
            if (c.withdraw(closestContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              c.moveTo(closestContainer, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 0 });
            }
          } else {
            const sources = room.find(FIND_SOURCES_ACTIVE);
            if (sources.length > 0) {
              const closestSource = _.sortBy(sources, (x) => c.pos.getRangeTo(x))[0];
              if (c.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                c.moveTo(closestSource, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 0 });
              }
            }
          }
          if (removeFrom) {
            delete idleWorkerCreeps[c.name];
          }
        }
      }
    }
  });
});

// Memory functions

function initMemory() {
  if (!Memory.towers) {
    Memory.towers = {};
  }
}

function cleanMissinCreepsMemory() {
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
}

function cleanMissingTowersMemory(towers: Towers) {
  for (const id in Memory.towers) {
    if (!towers[id]) {
      delete Memory.towers[id];
    }
  }
}

function getCreepsGroupedByRole() {
  return Object.keys(Game.creeps).reduce<CreepsGroupedByRole>((creeps, creepName) => {
    creeps[Game.creeps[creepName].memory.role][creepName] = Game.creeps[creepName];
    return creeps;
  }, { worker: {}, harvester: {}, roadWorker: {} });
}


// Find functions
function findTowers(room: Room) {
  return room.find<StructureTower>(FIND_MY_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_TOWER }).reduce<Towers>((o, t) => ({ ...o, [t.id]: t }), {});
}

function findContainers(room: Room) {
  return room.find<StructureContainer>(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER });
}

function findActiveContainers(room: Room) {
  return room.find<StructureContainer>(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store.energy > 0 });
}

function findRechargeableStructures(room: Room) {
  return room.find(FIND_MY_STRUCTURES, { filter: (s: AnyEnergyRechargableOwnedStructure) => [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_LAB, STRUCTURE_NUKER].includes(s.structureType) && s.energy < s.energyCapacity });
}

function findRoads(room: Room) {
  return room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_ROAD });
}
function findBrokenRoads(room: Room) {
  return room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_ROAD && s.hitsMax > s.hits });
}

function findBrokenStructures(room: Room) {
  return room.find(FIND_MY_STRUCTURES, { filter: (s) => s.hitsMax * 0.75 > s.hits });
}

function findConstructionSites(room: Room) {
  return room.find(FIND_CONSTRUCTION_SITES);
}

function findTombstones(room: Room) {
  return _.sortBy(room.find(FIND_TOMBSTONES, { filter: (t) => t.store.energy > 0 }), (t) => t.ticksToDecay);
}
