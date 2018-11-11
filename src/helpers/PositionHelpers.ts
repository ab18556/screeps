export default class PositionHelpers {
    public static orderByRangeToPosition<T extends RoomObject>(items: T[], pos: RoomPosition) {
        return _.sortBy(items, (s) => pos.getRangeTo(s));
    }

    public static getClosestToPosition<T extends RoomObject>(activeContainers: T[], pos: RoomPosition) {
        return PositionHelpers.orderByRangeToPosition(activeContainers, pos)[0];
    }
}
