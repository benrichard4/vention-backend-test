const db = require("../config/dbConfig.js");
const table = "materials";
const compTable = "compositions";
const { getPowerLevel } = require("./weapon");

class Material {
  constructor(payload) {
    this.id = payload.id;
    this.power_level = payload.power_level;
    this.qty = payload.qty;
    this.deleted_at = payload.deleted_at;
  }

  static async find(id) {
    try {
      let material = await db(table).where("id", id).first();
      return new Material(material);
    } catch (e) {
      throw new Error("Material not found"); // was "Weapon not found"
    }
  }

  // TO BE IMPLEMENTED
  static async update(id, powerLevel) {
    try {
      //update material and set id and power_level in array newMaterialDefArray
      let [newMaterialDef] = await db(table)
        .where("id", id)
        .update({ power_level: powerLevel })
        .returning("*");

      return newMaterialDef;
    } catch (e) {
      throw new Error("Material not found");
    }
  }
  // TO BE IMPLEMENTED
  static async delete(id) {}
}

module.exports = Material;
