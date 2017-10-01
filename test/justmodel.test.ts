import Joi from "joi"

import Model from "../src/justmodel"
import { ValidationError } from "../src/justmodel"

type User = {
  username: string
  password: string
  meta?: {
    abcd: string
    metaObject: {
      key: string
    }
  }
}

class UserModel extends Model<User> {
  protected get schema() {
    return super.schema.keys({
      username: Joi.string()
        .required()
        .min(4),
      password: Joi.string()
        .required()
        .min(8),
      meta: Joi.object({
        abcd: Joi.string(),
        metaObject: Joi.object({
          key: Joi.string()
        }).default({})
      }).default({ metaObject: {} })
    })
  }
}

/**
 * Model test
 */
describe("Model test", () => {
  it("Model is instantiable", () => {
    expect(new Model()).toBeInstanceOf(Model)
  })

  describe("model creation", () => {
    it("should create valid model", () => {
      new UserModel().create({
        username: "user",
        password: "password"
      })
    })

    it("should throw ValidationError if creating invalid model", () => {
      expect(() => {
        new UserModel().create({
          username: "abc",
          password: "abc"
        })
      }).toThrow(ValidationError)
    })
  })

  describe("model loading", () => {
    it("should load model", () => {
      new UserModel().load({
        username: "user",
        password: "password",
        meta: {}
      })
    })

    it("should apply defaults", () => {
      const user = new UserModel().load({
        username: "user",
        password: "password"
      })

      expect(user.meta).toEqual({ metaObject: {} })
    })
  })

  describe("model properties", () => {
    it("should get property using get method", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      expect(model.get("username")).toBe("user")
    })

    it("should get deep property using get method", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password",
        metaObject: {
          key: "value"
        }
      })

      expect(model.get("metaObject.key")).toBe("value")
    })

    it("should get property value by object key", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      expect(model.username).toBe("user")
      expect(model.password).toBe("password")
    })

    it("should get deep object properties", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password",
        meta: {
          abcd: "test"
        }
      })

      expect(model.meta.abcd).toBe("test")
    })

    it("should throw error on get if property is not set", () => {
      const model = new UserModel().load({ username: "user" })

      expect(() => model.get("password")).toThrow(ReferenceError)
    })

    it("should check if model has property set", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      expect(model.has("username")).toBeTruthy()
    })

    it("should check if model has old property set", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      expect(model.hasOld("username")).toBeTruthy()
    })

    it("should check if model has any value", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      expect(model.has()).toBeTruthy()
      expect(model.hasOld()).toBeTruthy()
    })

    it("should set value using object key", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      model.username = "newuser"

      expect(model.username).toBe("newuser")
    })

    it("should set deep value using object key", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      model.meta.abcd = "defgh"
      model.meta.metaObject.key = "value"

      expect(model.meta.abcd).toBe("defgh")
      expect(model.meta.metaObject.key).toBe("value")
    })

    it("should update using update method", () => {
      let model = new UserModel().load({
        username: "user",
        password: "password"
      })

      model = model.update({ username: "newuser" })

      expect(model.get("username")).toBe("newuser")
    })

    it("should update in place using updateInPlace method", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      model.updateInPlace({ username: "newuser" })

      expect(model.get("username")).toBe("newuser")
    })
  })

  describe("model changes", () => {
    it("should have no changes on loading", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      expect(model.hasChanged()).toBeFalsy()
    })

    it("should have changes when creating model", () => {
      const model = new UserModel().create({
        username: "user",
        password: "password"
      })

      expect(model.hasChanged()).toBeTruthy()
    })

    it("should detect changes when updating model using object keys", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      model.username = "newuser"

      expect(model.hasChanged()).toBeTruthy()
      expect(model.hasChanged("username")).toBeTruthy()
    })

    it("should update immutably when using update method", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      const newModel = model.update({ username: "newuser" })

      expect(model.hasChanged()).toBeFalsy()
      expect(newModel.hasChanged()).toBeTruthy()
    })

    it("should update in place when using updateInPlace method", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      const newModel = model.updateInPlace({ username: "newuser" })

      expect(model.hasChanged()).toBeTruthy()
      expect(newModel.hasChanged()).toBeTruthy()
    })

    it("should get old value using getOld method", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      model.username = "newuser"

      expect(model.getOld("username")).toBe("user")
    })

    it("should commit changes", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      expect(
        model
          .update({ username: "newuser" })
          .commit()
          .hasChanged()
      ).toBeFalsy()
      expect(
        model
          .updateInPlace({ username: "newuser" })
          .commitInPlace()
          .hasChanged()
      ).toBeFalsy()
    })

    it("should check if models are equal", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      expect(model.equals(model)).toBeTruthy()
    })
  })

  describe("model misc methods", () => {
    it("should get value", () => {
      const data = {
        username: "user",
        password: "password",
        meta: { metaObject: {} }
      }

      const model = new UserModel().load(data)

      expect(model.value()).toEqual(data)
    })

    it("should clone model", () => {
      const model = new UserModel().load({
        username: "user",
        password: "password"
      })

      expect(model.clone()).not.toBe(model)
    })
  })
})
