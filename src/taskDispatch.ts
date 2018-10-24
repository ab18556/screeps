import { List } from "lodash";

export function findOptimal(dists: [[number, number]], index = 0, totalDist = 0, stop = false) {
    let minimum = Infinity;
    let assignments: number[] = [];

    dists[index].forEach((dist, i) => {
        if (totalDist + dist < minimum) {
            if (index < dists.length - 1) {
                const res = findOptimal(dists, index + 1, totalDist + dist, i);

                if (totalDist + res.distance < minimum) {
                    minimum = totalDist + res.distance;
                    assignments = [i].concat(res.assignments)
                }
            } else {
                minimum = totalDist + dist;
                assignments = [i];
            }
        }
    });

    return {
        assignments,
        distance: minimum,
    }
}

interface Dispatch {
    assignments: string[];
    length: number;
}

interface Task {
    [creepName: string]: number
}

type Tasks = Task[];

const allTasks = [
    { bob: 2, charles: 1 },
    { bob: 6, charles: 2 },
];

function dispatchCreeps(tasks: Tasks, totalDist = 0, assignments: string[] = []): Dispatch {
    if (tasks.length === 0 || _.isEmpty(tasks[0])) { // TODO: Gérer le fait que le nombre de creeps et le nombre de tasks ne soit pas égal.
        return { assignments, length: totalDist }
    } else {
        const dispatches: Dispatch[] = [];

        Object.keys(tasks[0]).forEach((creepName) => {
            const newTasks = tasks.slice(1).map((t) => {
                const { [creepName]: omit, ...rest } = t;
                return rest;
            });

            dispatches.push(dispatchCreeps(newTasks, totalDist + tasks[0][creepName], assignments.concat(creepName)));
        });

        return _.min(dispatches, (d) => d.length);
    }
}
