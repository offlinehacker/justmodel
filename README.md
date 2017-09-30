# justmodel

[![Greenkeeper badge](https://badges.greenkeeper.io/offlinehacker/justmodel.svg)](https://greenkeeper.io/)

Extendable immutable javascript models with validation and change tracking

## Example

```js
const Model = require('justmodel');

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

let user = UserModel.create({
	username: 'offlinehacker',
	email: 'jaka@gatehub.net',
	password: 'testtesttest'
});

user.value // model object value
user.get('username'); // offlinehacker
user.hasChanged('username'); // true

user = user.commit();

user.hasChanged('username'); // false

user = user.update({
	username: 'newusername'
});

user.hasChanged('username'); // true
user.getOld('username'); // offlinehacker
```

## License

MIT

## Author

Jaka Hudoklin <jakahudoklin@gmail.com>
