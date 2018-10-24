export const spawnLoop = (creeps: Creeps, spawns: StructureSpawn[], containers: StructureContainer[]) => {
    if (creeps.workers.length < 5) {
        const body = [MOVE, CARRY, WORK];
        const upgrade = [MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, CARRY, WORK];
        const bodyParts = getBodyParts(body, upgrade, spawns[0].room, 9);
        spawns[0].spawnCreep(bodyParts, `Worker${Game.time}`, {
            memory: {
                role: 'worker',
                workMultiplier: _.filter(bodyParts, (b) => b === WORK).length,
            }
        });
    } else if (creeps.harvesters.length < containers.length) {
        const body = [MOVE, CARRY, WORK];
        const upgrade = [MOVE, WORK, WORK];
        const bodyParts = getBodyParts(body, upgrade, spawns[0].room, 9);
        spawns[0].spawnCreep(bodyParts, `Harvester${Game.time}`, {
            memory: {
                role: 'harvester',
                workMultiplier: _.filter(bodyParts, (b) => b === WORK).length,
            }
        });
    }

    function getBodyParts(body: BodyPartConstant[], bodyUpgrade: BodyPartConstant[], room: Room, maxParts?: number) {
        const numberOfExtensions = room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_EXTENSION }).length;
        let maxEnergyAvailable = numberOfExtensions * 50 + 300;

        if (_.map(Game.creeps).length === 0) {
            maxEnergyAvailable = Math.min(maxEnergyAvailable, room.energyAvailable);
        }

        (room.memory as any).maxEnergyAvailable = maxEnergyAvailable;

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

}

