import { spawnLoop } from "collections/Spawns";
import { ErrorMapper } from "utils/ErrorMapper";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);
  _.forEach(Game.rooms, (r) => {
    const creeps = _.merge({ workers: [], harvesters: [] }, _.groupBy<Creep>(Game.creeps, ({ memory: { role } }) => role ? `${role}s` : 'workers')) as Creeps;
    const idleCreeps = [...creeps.workers];
    const containers = r.find<StructureContainer>(FIND_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_CONTAINER });
    const activeContainers = _.filter(containers, (c) => c.store.energy > 0);
    const fillableStructures = r.find(FIND_MY_STRUCTURES, { filter: (s) => ((s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN) && s.energy < s.energyCapacity) });
    const brokenStructures = r.find(FIND_STRUCTURES, { filter: (s) => s.hitsMax * 0.75 > s.hits });
    const currentConstructionSite = _.sortBy(r.find(FIND_CONSTRUCTION_SITES), (s) => s.progressTotal - s.progress)[0];
    const tombstones = _.sortBy(r.find(FIND_TOMBSTONES, { filter: (t) => t.store.energy > 0 }), (t) => t.ticksToDecay);

    spawnLoop(creeps, _.map(Game.spawns), containers);

    _.forEach([...idleCreeps], (c) => {
      if (!c.carry.energy) {
        c.memory.task = 'harvesting';
      }
      if (c.memory.task === 'harvesting') {
        if (c.carry.energy === c.carryCapacity) {
          delete c.memory.task;
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
            const sources = r.find(FIND_SOURCES_ACTIVE);
            if (sources.length > 0) {
              const closestSource = _.sortBy(sources, (x) => c.pos.getRangeTo(x))[0];
              if (c.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                c.moveTo(closestSource, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 0 });
              }
            }
          }
          _.remove(idleCreeps, c);
        }
      }
    });

    creeps.harvesters.forEach((h, i) => {
      const container = containers[i];
      const source = r.find(FIND_SOURCES)[i];
      const amountHarvestedPerTick = h.memory.workMultiplier * 2;
      const softCapacity = Math.floor(h.carryCapacity / amountHarvestedPerTick) * amountHarvestedPerTick;
      if (h.carry.energy > amountHarvestedPerTick * 2) {
        h.transfer(container, RESOURCE_ENERGY, Math.min(container.storeCapacity - container.store.energy, h.carry.energy));
      }

      if (container.hits < container.hitsMax && h.carry.energy) {
        h.repair(container);
      }

      if (!h.pos.isEqualTo(container.pos)) {
        h.moveTo(container)
      } else if (h.carry.energy < softCapacity) {
        h.harvest(source);
      }

    });

    executeWithClosestCreep('transfer', fillableStructures, [RESOURCE_ENERGY]);

    executeWithClosestCreep('repair', brokenStructures);

    if (currentConstructionSite) {
      executeWithClosestCreep('build', [currentConstructionSite])
    }

    _.forEach(idleCreeps, (c) => {
      if (r.controller) {
        if (c.upgradeController(r.controller) === ERR_NOT_IN_RANGE) {
          c.moveTo(r.controller, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 0 });
        }
      }
    });

    function executeWithClosestCreep(action: Intent, structures: Array<RoomPosition | { pos: RoomPosition }>, args: any[] = []) {
      _.forEach(structures, (s) => {
        if (idleCreeps.length === 0) {
          return false;
        }
        const closestCreep = _.sortBy(idleCreeps, (c) => { c.pos.getRangeTo(s) })[0];
        if ((closestCreep as any)[action](s, ...args) === ERR_NOT_IN_RANGE) {
          closestCreep.moveTo(s, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 0 });
        }
        _.remove(idleCreeps, closestCreep);
        return true;
      });
    }
  });

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  console.log(Game.cpu.getUsed());
});
