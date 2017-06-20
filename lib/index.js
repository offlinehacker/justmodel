// @flow

const {Map, fromJS, isImmutable} = require('immutable');
const {ValidationError, InternalError} = require('errorjs');
const Joi = require('joi');

class Model<T: Object, M: Model<any, any>> {
    _data: Map<any, any>;
    _originalData: Map<any, any>;

    get value(): T {
        return (this._data.toJS(): any);
    }

    has(prop: string | Array<string>): boolean {
        if (typeof prop === 'string') {
            prop = prop.split('.');
        }

        return this._data.hasIn(prop);
    }

    hasOld(prop: string | Array<string>): boolean {
        if (typeof prop === 'string') {
            prop = prop.split('.');
        }

        return this._originalData.hasIn(prop);
    }

    commit(): any {
        const model = new this.constructor();
        model._data = this._data;
        model._originalData = this._data;

        return model;
    }

    get(prop: string | Array<string>): any {
        if (typeof prop === 'string') {
            prop = prop.split('.');
        }

        if (!this._data.hasIn(prop)) {
            throw new InternalError('property_missing', 'model property is missing', {
                model: this.constructor.name,
                prop
            });
        }

        return this._data.getIn(prop);
    }

    getOld(prop: string | Array<string>): any {
        if (typeof prop === 'string') {
            prop = prop.split('.');
        }

        return this._originalData.getIn(prop);
    }

    hasChanged(prop: string): boolean {
        const value = this.has(prop) ? this.get(prop) : undefined;
        const oldValue = this.getOld(prop);

        if (isImmutable(value)) {
            return !value.equals(oldValue);
        }

        return value !== oldValue;
    }

    update(data: T | Array<T>, schema: Object = this.constructor.updateSchema): M {
        if (!Array.isArray(data)) {
            data = [data];
        }

        let newData = this._data;

        for (const entry of data) {
            newData = newData.mergeDeep(entry);
        }

        const result = schema.validate(newData.toJS());

        if (result.error) {
            throw new ValidationError('model_validation_error', 'error validating model',
                result.error, {
                    model: this.constructor.name,
                    data
                }
            );
        }

        const model = new this.constructor();
        model._data = (fromJS(result.value): any);
        model._originalData = this._originalData;

        return (model: any);
    }

    static get schema(): Object {
        return Joi.object();
    }

    static get createSchema(): Object {
        return this.schema;
    }

    static get updateSchema(): Object {
        return this.schema;
    }

    static get loadSchema(): Object {
        return this.schema;
    }

    static create(data: T): M {
        const model = new this();

        model._data = new Map({});
        model._originalData = model._data;

        return (model.update(data, this.createSchema): any);
    }

    static load(data: T): M {
        const model = new this();

        const result = this.loadSchema.validate(data);

        model._data = (fromJS(result.value): any);
        model._originalData = model._data;

        return (model: any);
    }
}

module.exports = Model;
