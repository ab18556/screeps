## Refactoring

### Vision

#### Strategies, Tasks and the like

```
GiveEnergyToTowerTask -> part of TowerStrategy
RepairTowerTask -> part of TowerStrategy
RepairRoad -> TowerStragegy

Tasks, Strategies, ...

RepairRoadStrategy->apply(( )) {
creeps -> filtrer orderer
candidates = order by range to road to repair
while (!candiates->do(()) == 'OK') {candidates.next()}

if optimazationFailed:
    while (notCandidates->() =='OK') {nocandidates.next())};
}
Task->doit()
creep.do(repairRoadTask)
creep.do(
return 'i'm busy';

return 'CMT -> squat' return no

return 'doing it'
)
```

## Seperate cache from game's memory

When using game's memory as a cache for stuff that have been already _found_, we shall not access the memory directly but ask the cache to give us the cached instances of what we need.

## Recator Decorated* Classes

when we'll be more oop, CreepRole won't be necessary anymore and then Decorated* will be renamed without the emphasis on the _pattern_ used.

## Refactor ActionnableEntity.do

current signature:
public do(task: string, target: Link): boolean;

should be:
public do(task: iTask): boolean;
