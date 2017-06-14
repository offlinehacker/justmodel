/* eslint-env node, mocha */
/* eslint-disable no-unused-expressions */

const Joi = require('joi');
const uuidv4 = require('uuid/v4');
const {expect} = require('chai');

const Model = require('../lib');

class BaseModel extends Model {
    static get schema() {
        return super.schema.keys({
            id: Joi.string().guid().default(() => uuidv4(), 'uuid'),
            createdAt: Joi.date().default(() => new Date(), 'createdAt'),
            updatedAt: Joi.date().default(() => new Date(), 'updatedAt')
        });
    }
}

class UserModel extends BaseModel {
    static get schema() {
        return super.schema.keys({
            username: Joi.string().lowercase().min(6),
            email: Joi.string().email().lowercase(),
            password: Joi.string().min(8),
            hashedPassword: Joi.string()
        });
    }

    static get createSchema() {
        return this.schema.requiredKeys(['username', 'email', 'password']);
    }

    static get loadSchema() {
        return this.schema.requiredKeys(['username', 'email', 'hashedPassword']);
    }

    get value() {
        return this._data.delete('password').delete('hashedPassword').toJS();
    }
}

describe('Model', () => {
    let user;

    describe('create', () => {
        before(() => {
            user = UserModel.create({
                username: 'offlinehacker',
                email: 'test@gmail.com',
                password: 'passpasspass'
            });
        });

        it('should be created', () => {
            expect(user.value).to.be.deep.equal({
                id: user.get('id'),
                createdAt: user.get('createdAt'),
                updatedAt: user.get('updatedAt'),
                username: 'offlinehacker',
                email: 'test@gmail.com'
            });

            expect(user.get('password')).to.be.equal('passpasspass');
        });

        it('values should be changed', () => {
            expect(user.hasChanged('id')).to.be.true;
            expect(user.hasChanged('password')).to.be.true;
        });
    });

    describe('update', () => {
        before(() => {
            user = UserModel.load({
                username: 'offlinehacker',
                email: 'test@gmail.com',
                hashedPassword: 'hashhashhash'
            });

            user = user.update({
                email: 'test2@gmail.com'
            });
        });

        it('should get new values', () => {
            expect(user.get('username')).to.be.equal('offlinehacker');
            expect(user.get('email')).to.be.equal('test2@gmail.com');
        });

        it('should have changed values', () => {
            expect(user.hasChanged('username')).to.be.false;
            expect(user.hasChanged('email')).to.be.true;
        });

        it('should get old value', () => {
            expect(user.getOld('username')).to.be.equal('offlinehacker');
            expect(user.getOld('email')).to.be.equal('test@gmail.com');
        });

        it('should commit changes', () => {
            user = user.commit();

            expect(user.getOld('username')).to.be.equal(user.get('username'));
            expect(user.getOld('email')).to.be.equal(user.get('email'));
        });
    });
});
