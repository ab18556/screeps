
export class RoomEntities {
  public readonly room: Room;
  public readonly spawns: StructureSpawn[];
  public readonly myStructures: AnyOwnedStructure[];
  public readonly structures: AnyStructure[];
  public readonly constructionSites: Array<ConstructionSite<BuildableStructureConstant>>;
  public readonly tombstones: Tombstone[];
  public readonly containers: StructureContainer[];
  public readonly activeContainers: StructureContainer[];
  public readonly rechargeableLabs: StructureLab[];
  public readonly rechargeableNukers: StructureNuker[];
  public readonly rechargeableTowers: StructureTower[];
  public readonly rechargeableSpawnRelatedStructures: Array<StructureSpawn | StructureExtension>;
  public readonly roads: StructureRoad[];
  public readonly brokenRoads: StructureRoad[];
  public readonly brokenStructures: AnyOwnedStructure[];
  public readonly brokenWalls: StructureWall[];
  public readonly hostiles: Creep[];
  public readonly sources: Source[];
  public readonly storage?: StructureStorage;
  public readonly storageLink?: StructureLink;
  public readonly links: StructureLink[];
  public readonly creeps: CreepsGroupedByRole;
  public readonly looseEnergy: Array<Resource<ResourceConstant>>;

  public readonly towers: Towers;

  constructor(room: Room) {
    this.room = room;

    this.spawns = this.findSpawns();
    this.sources = this.findSources();
    this.myStructures = this.findMyStructures();
    this.structures = this.findStructures();
    this.constructionSites = this.findConstructionSites();
    this.tombstones = this.findTombstones();
    this.containers = this.findContainers();
    this.activeContainers = this.findActiveContainers();
    this.rechargeableLabs = this.findRechargeableLabs();
    this.rechargeableNukers = this.findRechargeableNukers();
    this.rechargeableTowers = this.findRechargeableTowers();
    this.rechargeableSpawnRelatedStructures = this.findRechargeableSpawnRelatedStructures();
    this.roads = this.findRoads();
    this.brokenRoads = this.findBrokenRoads();
    this.brokenStructures = this.findBrokenStructures();
    this.brokenWalls = this.findBrokenWalls();
    this.hostiles = this.findHostiles();
    this.storage = this.findStorage();
    this.storageLink = this.findStorageLink();
    this.links = this.findLinks();
    this.creeps = this.getCreepsGroupedByRole();
    this.looseEnergy = this.findDroppedEnergy();

    this.towers = this.findTowers();
  }

  private findSpawns() {
    return _.filter(Game.spawns, (s) => s.room.name === this.room.name)
  }

  private findSources() {
    return this.room.find(FIND_SOURCES);
  }

  private findHostiles() {
    return this.room.find(FIND_HOSTILE_CREEPS);
  }

  private findMyStructures() {
    return this.room.find(FIND_MY_STRUCTURES);
  }

  private findStructures() {
    return this.room.find(FIND_STRUCTURES);
  }

  private findConstructionSites() {
    return this.room.find(FIND_CONSTRUCTION_SITES);
  }

  private findTombstones() {
    return _.sortBy(this.room.find(FIND_TOMBSTONES, { filter: (t) => t.store.energy > 0 }), (t) => t.ticksToDecay);
  }

  private findTowers() {
    const towers = _.filter<StructureTower>(this.myStructures as StructureTower[], (s) => s.structureType === STRUCTURE_TOWER);
    return this.entityListToDictionary<StructureTower>(towers);
  }

  private findContainers() {
    return _.filter<StructureContainer>(this.structures as StructureContainer[], (s) => s.structureType === STRUCTURE_CONTAINER);
  }

  private findActiveContainers() {
    return _.filter<StructureContainer>(this.containers, (s) => s.store.energy > 0);
  }

  private findRoads() {
    return _.filter<StructureRoad>(this.structures as StructureRoad[], (s) => s.structureType === STRUCTURE_ROAD);
  }

  private findBrokenRoads() {
    return _.filter<StructureRoad>(this.roads, (s) => s.hitsMax > s.hits);
  }

  private findBrokenWalls() {
    return _.filter<StructureWall>(this.structures as StructureWall[], (s) => (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && s.hitsMax * 0.75 > s.hits && Math.floor(Memory.wallHitsTarget / 1000) * 1000 > s.hits);
  }

  private findRechargeableLabs() {
    return _.filter(this.myStructures as StructureLab[], (s) => s.structureType === STRUCTURE_LAB && s.energy < s.energyCapacity);
  }

  private findRechargeableNukers() {
    return _.filter(this.myStructures as StructureNuker[], (s) => s.structureType === STRUCTURE_NUKER && s.energy < s.energyCapacity);
  }

  private findRechargeableTowers() {
    return _.filter(this.myStructures as StructureTower[], (s) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity);
  }

  private findRechargeableSpawnRelatedStructures() {
    return _.filter(this.myStructures as Array<StructureExtension | StructureSpawn>, (s) => [STRUCTURE_EXTENSION, STRUCTURE_SPAWN].includes(s.structureType) && s.energy < s.energyCapacity);
  }

  private findBrokenStructures() {
    return _.filter(this.myStructures, (s) => s.hitsMax * 0.75 > s.hits && s.structureType !== STRUCTURE_RAMPART);
  }

  private findDroppedEnergy() {
    return this.room.find(FIND_DROPPED_RESOURCES, { filter: (e => e.pos.x >= 11 && e.pos.x < 47) });
  }

  private getCreepsGroupedByRole() {
    return Object.keys(Game.creeps).reduce<CreepsGroupedByRole>((creeps, creepName) => {
      if (Game.creeps[creepName] && Game.creeps[creepName].memory.room === this.room.name) {
        creeps[Game.creeps[creepName].memory.role][creepName] = Game.creeps[creepName];
      }
      return creeps;
    }, { worker: {}, harvester: {}, carrier: {}, builder: {} });
  }

  private findStorage() {
    let storage = Game.getObjectById<StructureStorage>(this.room.memory.storageId) || undefined;

    if (!storage) {
      storage = _.find<StructureStorage>(this.myStructures as StructureStorage[], (s) => s.structureType === STRUCTURE_STORAGE);
      if (storage) {
        this.room.memory.storageId = storage.id;
      }
    }

    return storage;
  }

  private findStorageLink() {
    const storage = this.findStorage();

    if (!storage) {
      return;
    }

    let storageLink = Game.getObjectById<StructureLink>(this.room.memory.storageLinkId);

    if (!storageLink) {
      storageLink = storage.pos.findInRange<StructureLink>(FIND_MY_STRUCTURES, 1, { filter: (s) => s.structureType === STRUCTURE_LINK })[0];
      if (storageLink) {
        this.room.memory.storageLinkId = storageLink.id;
      }
    }

    return storageLink;
  }

  private findLinks() {
    const storageLink = this.storageLink;
    const storageLinkId = (storageLink && storageLink.id);
    return _.filter<StructureLink>(this.structures as StructureLink[], (s) => s.structureType === STRUCTURE_LINK && s.id !== storageLinkId);
  }

  private entityListToDictionary<T extends { id: string }>(list: T[]) {
    _.reduce(list, (o) => o, {})
    return list.reduce<{ [id: string]: T }>((o, t) => {
      return { ...o, [t.id]: t }
    }, {});
  }
}



