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
