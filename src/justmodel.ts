import Immutable from "immutable"
import Joi from "joi"

export class ValidationError extends Error {
  details: Object

  constructor(err: Error) {
    super(err.message)

    this.name = "ValidationError"
    this.details = (err as any).details
  }
}

export default class Model<T extends Object> {
  private __isProxy: boolean = false

  private _data: Immutable.Map<any, any>
  private _originalData: Immutable.Map<any, any>

  constructor(data = Immutable.Map(), originalData = data) {
    this._data = data
    this._originalData = originalData
  }

  /**
   * Loads model data from provided object. This method is usefull
   * for loading data from storage.
   */
  public load(data: Object) {
    const result = this.loadSchema.validate(data)

    return new (this.constructor as typeof Model)(
      Immutable.fromJS(result.value)
    )._createProxy() as this & T
  }

  /**
   * Creates a new model with provided data
   */
  public create(data: T) {
    return this._update([data], this.createSchema, true)._createProxy()
  }

  /**
   * Immutably update model with data
   *
   * @param {...Partial<T>[]} data multiple partials of a data to update with
   * @returns {Model<T>} newly created instance of a model
   */
  public update(...data: Partial<T>[]) {
    return this._update(data)._createProxy()
  }

  /**
   * Updates model in place
   *
   * @param {...Partial<T>[]} data multiple partials of a data to update with
   * @param {...Partial<T>[]} data
   * @returns {this}
   */
  public updateInPlace(...data: Partial<T>[]) {
    return this._update(data, this.updateSchema, true)
  }

  /**
   * Gets model value
   *
   * @returns {T} model value as object
   */
  public value(): T {
    return this._data.toJS() as T
  }

  /**
   * Checks whether model has a property set
   *
   * @param {(string | Array<string>)} [prop=''] Path to a property, which can be dot separated string or array
   * @returns {*} property value
   */
  public has(prop: string | Array<string> = "") {
    if (prop === "") {
      return !this._data.equals(Immutable.Map())
    }

    if (typeof prop === "string") {
      prop = prop.split(".")
    }

    return this._data.hasIn(prop)
  }

  /**
   * Checks whether object has a property set on initial value.
   *
   * @param {(string | Array<string>)} [prop=''] Path to a property, which can be dot separated string or array
   * @returns {*} property value
   */
  public hasOld(prop: string | Array<string> = ""): boolean {
    if (prop === "") {
      return !this._originalData.equals(Immutable.Map())
    }

    if (typeof prop === "string") {
      prop = prop.split(".")
    }

    return this._originalData.hasIn(prop)
  }

  /**
   * Commits model changes. This operation resets change tracking on model to
   * current model data.
   *
   * @returns {Model<T>} newly created instance of a model
   */
  public commit() {
    return new (this.constructor as typeof Model)(
      this._data
    )._createProxy() as this & T
  }

  /**
   * Commits model changes in place. This operation resets change tracking on model to
   * current model data.
   *
   * @returns {this}
   */
  public commitInPlace() {
    this._originalData = this._data

    return this._createProxy()
  }

  /**
   * Gets value of a property.
   *
   * @param {(string | Array<string>)} [prop=''] Path to a property, which can be dot separated string or array
   * @returns {*} property value
   */
  public get(prop: string | Array<string> = ""): any {
    if (prop === "") {
      return this._data
    }

    if (typeof prop === "string") {
      prop = prop.split(".")
    }

    if (!this._data.hasIn(prop)) {
      throw new ReferenceError(
        `Missing property '${prop.toString()}' on model '${this.constructor
          .name}'`
      )
    }

    return this._data.getIn(prop)
  }

  /**
   * Gets initial value of a property
   *
   * @param {(string | Array<string>)} [prop=''] Path to a property, which can be dot separated string or array
   * @returns {*} property value
   */
  public getOld(prop: string | Array<string> = ""): any {
    if (prop === "") {
      return this._originalData
    }

    if (typeof prop === "string") {
      prop = prop.split(".")
    }

    return this._originalData.getIn(prop)
  }

  /**
   * Checks whether prpperty has changed
   *
   * @param {(string | Array<string>)} [prop=''] Path to a property, which can be dot separated string or array
   * @returns {boolean} whether property has changed
   */
  public hasChanged(prop: string | Array<string> = ""): boolean {
    const value1 = this.has(prop) ? this.get(prop) : undefined
    const value2 = this.getOld(prop)

    if (Immutable.isImmutable(value1)) {
      return !value1.equals(value2)
    }

    return value1 !== value2
  }

  /**
   * Checks whether model equals other model
   *
   * @param {Model} model model to compare with
   * @returns {boolean} whether model equals other model
   */
  public equals(model: this): boolean {
    return model._data.equals(this._data)
  }

  /**
   * Creates clone of a model
   *
   * @returns {Model<T>} cloned model
   */
  public clone() {
    return new (this.constructor as typeof Model)(
      this._data,
      this._originalData
    )._createProxy() as this & T
  }

  private _update(
    data: Array<Partial<T>>,
    schema = this.updateSchema,
    inPlace = false
  ): this {
    let newData = this._data

    for (const entry of data) {
      newData = newData.mergeDeep(entry)
    }

    const result = schema.validate(newData.toJS())

    if (result.error) {
      throw new ValidationError(result.error)
    }

    if (inPlace) {
      this._data = newData

      return this
    }

    return new (this.constructor as typeof Model)(
      Immutable.fromJS(result.value),
      this._originalData
    ) as this
  }

  /**
   * Gets default model schema
   *
   * This method can be extended by child class to redefine schema
   *
   * @returns {Joi.JoiObject} schema object
   */
  protected get schema() {
    return Joi.object()
  }

  /**
   * Gets model schema that is used when creating a model
   *
   * This method can be extended by child class to redefine schema
   *
   * @returns {Joi.JoiObject} schema object
   */
  protected get createSchema() {
    return this.schema
  }

  /**
   * Gets model schema that is used when updating a model
   *
   * This method can be extended by child class to redefine schema
   *
   * @returns {Joi.JoiObject} schema object
   */
  protected get updateSchema() {
    return this.schema
  }

  /**
   * Gets model schema that is used when loading a model
   *
   * This method can be extended by child class to redefine schema
   *
   * @returns {Joi.JoiObject} schema object
   */
  protected get loadSchema() {
    return this.schema
  }

  private _createObjectValueProxy(
    value: Object,
    prop: string,
    rootValue = value
  ): any {
    return new Proxy(value, {
      get: (target, name, receiver) => {
        const value = Reflect.get(target, name, receiver)

        if (typeof value === "object") {
          return this._createObjectValueProxy(value, prop, rootValue)
        }

        return value
      },

      set: (target, name, value, receiver): any => {
        const result = Reflect.set(target, name, value, receiver)

        if (result) {
          this.updateInPlace({ [prop]: rootValue } as any)
        }

        return result
      }
    })
  }

  private _createProxy(): this & T {
    if (this.__isProxy) {
      return this as this & T
    }

    return new Proxy<this & T>(this as this & T, {
      get: (target, name, receiver) => {
        // getter to check whether object is proxyified
        if (name === "__isProxy") {
          return true
        }

        // check whether object has an attribute
        if (target.has(name.toString())) {
          let value = target.get(name.toString())

          if (Immutable.isImmutable(value)) {
            value = value.toJS()
          }

          if (typeof value === "object") {
            return this._createObjectValueProxy(value, name.toString())
          }

          return value
        }

        // get value from object itself
        return Reflect.get(target, name, receiver)
      },
      set: (target, name, value, receiver): any => {
        if (target.has(name.toString())) {
          this.updateInPlace({ [name]: value } as any)
        }

        return Reflect.set(target, name, value, receiver)
      }
    })
  }
}
