export class SpawnAction {
  private creepRole: CreepRole;
  private spawn: StructureSpawn;
  private targetRoom: Room;

  // Todo set creep config

  constructor(creepRole: CreepRole, spawn: StructureSpawn, targetRoom: Room) {
    this.creepRole = creepRole;
    this.spawn = spawn;
    this.targetRoom = targetRoom;

    // Todo: configure creep
  }

  public run() {
    switch (this.creepRole) {
      case 'builder':
        return this.spawnBuilder();
      case 'carrier':
        return this.spawnCarrier();
      case 'harvester':
        return this.spawnHarvester();
      case 'worker':
        return this.spawnWorker();
    }
  }

  private spawnWorker() {
    const body = [MOVE, CARRY, WORK];
    const upgrade = [MOVE, CARRY, WORK];
    const bodyParts = this.getBodyParts(body, upgrade, 15);
    return this.doSpawnCreep(bodyParts, `Worker${Game.time}`, {
      memory: {
        role: 'worker',
        room: this.targetRoom.name,
        status: 'lookingForEnergy',
      }
    });
  }

  private spawnHarvester() {
    const body = [CARRY, MOVE, WORK]
    const upgrade = [WORK, MOVE, WORK];
    const bodyParts = this.getBodyParts(body, upgrade, 9);
    const memory: HarvesterMemory = {
      role: 'harvester',
      room: this.targetRoom.name,
      status: 'lookingForEnergy',
      workMultiplier: _.filter(bodyParts, (b) => b === WORK).length,
    }
    return this.doSpawnCreep(bodyParts, `Harvester${Game.time}`, { memory });
  }

  private spawnCarrier() {
    const body = [MOVE, CARRY, CARRY];
    const upgrade: BodyPartConstant[] = [MOVE, CARRY, CARRY];
    const bodyParts = this.getBodyParts(body, upgrade);
    return this.doSpawnCreep(bodyParts, `Carrier${Game.time}`, {
      memory: {
        role: 'carrier',
        room: this.targetRoom.name,
        status: 'lookingForEnergy',
      }
    });
  }

  private spawnBuilder() {
    const body = [MOVE, CARRY, WORK];
    const upgrade: BodyPartConstant[] = [MOVE];
    const bodyParts = this.getBodyParts(body, upgrade, 4);
    return this.doSpawnCreep(bodyParts, `Builder${Game.time}`, {
      memory: {
        role: 'builder',
        room: this.targetRoom.name,
        status: 'idle',
      }
    });
  }

  private getBodyParts(body: BodyPartConstant[], bodyUpgrade: BodyPartConstant[], maxParts?: number) {
    const numberOfExtensions = this.targetRoom.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType === STRUCTURE_EXTENSION }).length;
    let maxEnergyAvailable = numberOfExtensions * 50 + 300;

    if (_.map(Game.creeps).length === 0) {
      maxEnergyAvailable = Math.min(maxEnergyAvailable, this.targetRoom.energyAvailable);
    }

    let totalBodyParts = body;
    let nextUpgradeIndex = 0;
    let nextUpgradedBody = [...totalBodyParts, bodyUpgrade[nextUpgradeIndex]];

    while (bodyUpgrade.length > 0 && (!maxParts || nextUpgradedBody.length <= maxParts) && this.getBodyPartsCost(nextUpgradedBody) <= maxEnergyAvailable) {
      totalBodyParts = [...totalBodyParts, bodyUpgrade[nextUpgradeIndex]];
      nextUpgradeIndex = nextUpgradeIndex < bodyUpgrade.length - 1 ? nextUpgradeIndex + 1 : 0;
      nextUpgradedBody = [...totalBodyParts, bodyUpgrade[nextUpgradeIndex]];
    }

    return totalBodyParts;
  }

  private getBodyPartsCost(bodyParts: BodyPartConstant[]) {
    return _.sum(bodyParts.map((b) => BODYPART_COST[b]));
  }

  private doSpawnCreep(body: BodyPartConstant[], name: string, opts?: SpawnOptions) {
    if (this.spawn.spawnCreep(body, name, opts) !== OK) {
      // TODO: Find a way tu use closest spawn instead
      const anyOtherSpawn = _.find(Game.spawns, (s) => s.id !== this.spawn.id);
      if (anyOtherSpawn) {
        anyOtherSpawn.spawnCreep(body, name, opts);
      } else {
        return;
      }
    }

    return name;
  }
}
