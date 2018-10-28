export function executeWithClosestCreep<T extends Creep>(action: Action, structures: Array<RoomPosition | { pos: RoomPosition }> = [], creeps: Creeps<T>, args: any[] = []) {
  const tasks = getTasks(structures, creeps);
  planTasks(tasks).assignments.forEach((creepName, i) => {
    executeTask(Game.creeps[creepName], action, structures[i], args);
    delete creeps[creepName];
  });
}

function planTasks(tasks: Tasks, totalDist = 0, assignments: string[] = []): Dispatch {
  if (tasks.length === 0 || _.isEmpty(tasks[0])) {
    return { assignments, length: totalDist }
  } else {
    const plannedTasks: Dispatch[] = [];

    Object.keys(tasks[0]).forEach((creepName) => {
      const newTasks = tasks.slice(1).map((t) => {
        const { [creepName]: omit, ...rest } = t;
        return rest;
      });

      plannedTasks.push(planTasks(newTasks, totalDist + tasks[0][creepName], assignments.concat(creepName)));
    });

    return _.min(plannedTasks, (d) => d.length);
  }
}

function getTasks<T extends Creep>(structures: Array<RoomPosition | { pos: RoomPosition }>, creeps: Creeps<T>): Tasks {
  return structures.map((s) => {
    return _.reduce(creeps, (t, c) => {
      return { ...t, [c.name]: c.pos.getRangeTo(s) }
    }, {});
  });
}

export function executeTask(creep: Creep, action: Action, structure: RoomPosition | { pos: RoomPosition }, args: any[]) {
  if ((creep as any)[action](structure, ...args) === ERR_NOT_IN_RANGE) {
    creep.moveTo(structure, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 0 });
  }
}
