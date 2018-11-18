export abstract class ActionnableEntity<T, baseClassType> {
  constructor(public readonly baseObject: baseClassType) {
    this.extendParentPrototype(baseObject);
  }

  private extendParentPrototype(baseObject: baseClassType) {
    for (const key in baseObject) {
      (this as any)[key] = (baseObject as any)[key];
    }
  }

  public abstract do(task: string, target: T): boolean;
}

