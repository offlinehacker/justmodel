# justmodel

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/offlinehacker/justmodel.svg)](https://greenkeeper.io/)
[![Travis](https://img.shields.io/travis/offlinehacker/justmodel.svg)](https://travis-ci.org/offlinehacker/justmodel)
[![Coveralls](https://img.shields.io/coveralls/offlinehacker/justmodel.svg)](https://coveralls.io/github/offlinehacker/justmodel)
[![Dev Dependencies](https://david-dm.org/offlinehacker/justmodel/dev-status.svg)](https://david-dm.org/offlinehacker/justmodel?type=dev)

Extendable immutable javascript models with validation and change tracking

## Description

JustModel is a modern extendable model library written in typescript,
that provides several features that every model library should have:

### Static typed data types

Justmodel has fully typed models when working with typescript and flowtype,
that provide type safety when working with models.

```javascript
import Model from 'justmodel';

type User = {
  username: string;
  password: string;
}; 

class UserModel extends Model<User> {}

const user = new UserModel().create({username: 'username'}) // <-- property password is missing in type
```

### Immutable and non-immutable operations

All operations are immutable by default, except is in place mutation methods are used

```javascript
let mutatedUser = user.update({password: 'newpassword'});

user === mutatedUser // <-- false as immutable operation was used

muetatedUser = user.updateInPlace({password: 'newpassword'});

user === mutatedUser // <-- true as model was mutated in place
```

### Data validation with create, update and load joi schemas

```javascript
class UserModel extends Model<User> {
  get schema() {
    return Joi.object({
      username: Joi.string(),
      password: Joi.string().required(),
      hashedPassword: Joi.string().hex()
    }).xor('password', 'hashedPassword');
  }

  get createSchema() {
    return this.schema.requiredKeys(['password']);
  }
}

const user = new UserModel().create({
  username: 'user'
}); // <-- validation error as password is missing
```

### Change detection

Just model tracks changes on models and provides method that gets old value
or tells if change was made compared to initial value. This is very usefull if
doing update oprations on model and need to know if values have changed.

```javascript
const model = new UserModel().load(data);

model.updateInPlace(req.data);

if (model.hasChanged('password')) {
  // check old password for example
}
```

### Insallation

```bash
npm install --save justmodel
```

### Example

```javascript
import Model from 'justmodel';

class UserModel extends Model<User> {
  get schema() {
    return Joi.object({
      username: Joi.string().min(4).max(20).lowercase(),
      password: Joi.string().required().min(8),
      email: Joi.string().email().required(),
      hashedPassword: Joi.string().hex()
    });
  }

  get createSchema() {
    return this.schema.requiredKeys(['password']);
  }

  value() {
    return this._data.delete('password').toJS();
  }
}

const user = new UserModel().create({
  username: 'user',
  password: 'mypassword',
  email: 'email@example.com'
});

checkWeakPasswords(user);

user.updateInPlace({
  hashedPassword: hashPassword(user.password)
});

if(user.hasChanged('email')) {
  return sendChangeEmail(user);
}

save(user);
```

### Development

 - `npm t`: Run test suite
 - `npm start`: Runs `npm run build` in watch mode
 - `npm run test:watch`: Run test suite in [interactive watch mode](http://facebook.github.io/jest/docs/cli.html#watch)
 - `npm run test:prod`: Run linting and generate coverage
 - `npm run build`: Generage bundles and typings, create docs
 - `npm run lint`: Lints code
 - `npm run commit`: Commit using conventional commit style ([husky](https://github.com/typicode/husky) will tell you to use it if you haven't :wink:)
 - `npm run semantic-release`: Release code using [semantic release](https://github.com/semantic-release/semantic-release)

## Credits

Made with :heart: by [@offlinehacker](https://twitter.com/offlinehacker) 
