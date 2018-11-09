import { spawnLoop } from "collections/Spawns";
import { RoomEntities } from "room";
import { executeWithClosestCreep } from "taskDispatch";
import { ErrorMapper } from "utils/ErrorMapper";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  Memory.progress = Memory.progress > 20000 ? Memory.progress : 20000;
  Memory.progress++;
  console.log(Memory.progress)

  initMemory();
  cleanMissinCreepsMemory();

  _.forEach(Game.rooms, (room) => {
    if (['W16N39', 'W15N39'].includes(room.name)) {
      const roomEntities = new RoomEntities(room);
      const {
        creeps,
        towers,
        sources,
        storage,
        rechargeableTowers,
        rechargeableSpawnRelatedStructures,
        brokenRoads,
        brokenWalls,
        activeContainers,
        storageLink,
        brokenStructures,
        constructionSites,
        hostiles,
        links,
        droppedEnergy,
        tombstones,
      } = roomEntities;
      const idleWorkerCreeps = { ...creeps.worker };

      cleanMissingTowersMemory(towers);

      // Spawning Creeps
      spawnLoop(creeps, roomEntities);

      _.forEach(_.sortBy(idleWorkerCreeps, (c) => c.carryCapacity - c.carry.energy), (c) => recharge(c, idleWorkerCreeps));

      // Harvesters loop
      Object.keys(creeps.harvester).forEach((h, i) => {
        const creep: HarvesterCreep = Game.creeps[h] as HarvesterCreep;
        const amountHarvestedPerTick = creep.memory.workMultiplier * 2;
        const softCapacity = Math.floor(creep.carryCapacity / amountHarvestedPerTick) * amountHarvestedPerTick;
        const source = Game.getObjectById<Source>(creep.memory.assignments.sourceId) as Source;
        const store = Game.getObjectById<StructureContainer | StructureLink>(creep.memory.assignments.storeId);

        if (store) {
          if (creeps.harvester[h].carry.energy > amountHarvestedPerTick * 2) {
            const capacity = (store as StructureContainer).storeCapacity || (store as StructureLink).energyCapacity;
            const energy = (store as StructureContainer).store ? (store as StructureContainer).store.energy : (store as StructureLink).energy;
            const amount = Math.min(capacity - energy, creeps.harvester[h].carry.energy);

            if (creeps.harvester[h].transfer(store, RESOURCE_ENERGY, amount) === ERR_NOT_IN_RANGE) {
              creeps.harvester[h].moveTo(store);
            }
          }

          if (store.hits < store.hitsMax && creeps.harvester[h].carry.energy) {
            if (creeps.harvester[h].repair(store)) {
              creeps.harvester[h].moveTo(store);
            };
          }

          if (creeps.harvester[h].carry.energy < softCapacity) {
            if (creeps.harvester[h].harvest(source) === ERR_NOT_IN_RANGE) {
              creeps.harvester[h].moveTo(source);
            }
          }
        }
      });

      // Planning moves
      executeWithClosestCreep('transfer', rechargeableSpawnRelatedStructures, idleWorkerCreeps, [RESOURCE_ENERGY]);

      if (Object.keys(creeps.carrier).length === 0) {
        executeWithClosestCreep('transfer', rechargeableTowers, idleWorkerCreeps, [RESOURCE_ENERGY]);
      }

      _.forEach(creeps.carrier, (c) => {
        if (!c.carry.energy || (storageLink && c.carryCapacity - c.carry.energy > storageLink.energy)) {
          c.memory.isHarvesting = true;
        }

        if (c.memory.isHarvesting) {
          if (storageLink && storageLink.energy > 0) {
            if (c.withdraw(storageLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              c.moveTo(storageLink);
            } else {
              c.memory.isHarvesting = false;
            }
          } else if (activeContainers.length > 0) {

            const largestEnergySource = _.sortByOrder(activeContainers, (s: StructureContainer & StructureLink) => (s.store && s.store.energy) || s.energy, 'desc')[0];

            if (largestEnergySource) {
              if (c.withdraw(largestEnergySource, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                c.moveTo(largestEnergySource);
              } else {
                c.memory.isHarvesting = false;
              }
            }
          }
          else {
            c.memory.isHarvesting = false;
          }
        } else {
          if (rechargeableSpawnRelatedStructures.length > 0) {
            const closestSpawnRelatedStructures = _.sortBy(rechargeableSpawnRelatedStructures, (s) => c.pos.getRangeTo(s))[0];
            if (c.transfer(closestSpawnRelatedStructures, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              c.moveTo(closestSpawnRelatedStructures);
            }
          } else if (rechargeableTowers.length > 0 && _.any(rechargeableTowers, (t) => t.energy / t.energyCapacity < 0.75)) {
            const nearTower = _.find(rechargeableTowers, (t) => c.pos.isNearTo(t) && t.energy / t.energyCapacity < 0.75);
            const bestTower = nearTower || _.sortByAll(rechargeableTowers, [(s) => Math.floor(s.energy / s.energyCapacity * 100 / 20), (s) => c.pos.getRangeTo(s)])[0];

            if (c.transfer(bestTower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              c.moveTo(bestTower);
            }
          } else if (storage && storage.store.energy !== storage.storeCapacity) {
            if (c.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              c.moveTo(storage);
            }
          }
        }
      });

      executeWithClosestCreep('repair', brokenStructures, idleWorkerCreeps);

      if (constructionSites.length > 0 && Object.keys(creeps.builder).length === 0) {
        // TODO: Remove crappy sort
        executeWithClosestCreep('build', [_.sortBy(constructionSites, (s) => s.pos.x).reverse()[0]], idleWorkerCreeps)
      }

      _.forEach(towers, (t) => {
        const brokenPublicStructures = _.sortByOrder([...brokenRoads, ...brokenWalls], [(s) => s.hits / s.hitsMax, (s) => t.pos.getRangeTo(s)]);
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
        } else if (brokenPublicStructures.length > 0 && t.energy > t.energyCapacity / 2) {
          t.repair(brokenPublicStructures[0]);
        }
      })

      links.forEach((l) => {
        if (storageLink && !storageLink.energy && l.energy === l.energyCapacity) {
          l.transferEnergy(storageLink)
        }
      });

      _.forEach(idleWorkerCreeps, (c) => {
        if (room.controller) {
          if (c.upgradeController(room.controller) === ERR_NOT_IN_RANGE) {
            c.moveTo(room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
          }
        }
      });

      _.forEach(creeps.builder, (c) => {
        if (constructionSites.length === 0) {
          c.suicide();
        } else {
          recharge(c);

          if (!c.memory.isHarvesting) {
            // TODO: Remove crappy sort
            const constructionSite = _.sortBy(constructionSites, (s) => s.pos.x).reverse()[0];

            if (c.build(constructionSite) === ERR_NOT_IN_RANGE) {
              c.moveTo(constructionSite);
            }
          }
        }
      });

      function recharge<T extends Creep>(c: AnyCreep, removeFrom?: Creeps<T>) {
        if (!c.carry.energy) {
          c.memory.isHarvesting = true;
        }
        if (c.memory.isHarvesting) {
          if (c.carry.energy === c.carryCapacity) {
            c.memory.isHarvesting = false;
          } else {
            if (droppedEnergy.length > 0) {
              if (c.pickup(droppedEnergy[0]) === ERR_NOT_IN_RANGE) {
                c.moveTo(droppedEnergy[0], { visualizePathStyle: { stroke: '#ffffff' } });
              }
            } else if (tombstones.length > 0) {
              if (c.withdraw(tombstones[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                c.moveTo(tombstones[0], { visualizePathStyle: { stroke: '#ffffff' } });
              }
            } else {
              const closestContainer = _.sortBy(activeContainers, (s) => c.pos.getRangeTo(s))[0];

              if (storage && storage.store.energy > 0) {
                if (c.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                  c.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
                }
              } else if (storageLink && storageLink.energy > 0) {
                if (c.withdraw(storageLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                  c.moveTo(storageLink, { visualizePathStyle: { stroke: '#ffffff' } });
                }
              } else if (closestContainer) {
                if (c.withdraw(closestContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                  c.moveTo(closestContainer, { visualizePathStyle: { stroke: '#ffffff' } });
                }
              } else {
                if (sources.length > 0 && Object.keys(creeps.harvester).length === 0) {
                  const closestSource = _.sortBy(sources, (x) => c.pos.getRangeTo(x))[0];
                  if (c.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                    c.moveTo(closestSource, { visualizePathStyle: { stroke: '#ffffff' } });
                  }
                }
              }
            }
            if (removeFrom) {
              delete idleWorkerCreeps[c.name];
            }
          }
        }
      }
    }
  });
});

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
