const db = require("../config/dbConfig.js");
const table = "materials";
const cTable = "compositions";

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
      // only return material if deleted_at is null
      if (!material.deleted_at) {
        return new Material(material);
      } else {
        throw { error: "deleted" };
      }
    } catch (err) {
      if (err.error == "deleted") {
        throw new Error("Material has been deleted");
      } else {
        throw new Error("Material not found"); // was "Weapon not found"
      }
    }
  }

  //findAll finds even deleted instances of materials
  static async findAll(id) {
    try {
      let material = await db(table).where("id", id).first();
      return new Material(material);
    } catch (err) {
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
    } catch (err) {
      throw new Error("Material powerlevel not updated");
    }
  }
  // TO BE IMPLEMENTED
  async delete(id) {
    try {
      //if get all parent ids from recursive function
      let parentIdsArr = await this.getParentIds(id);

      //add id from argument into array and rename
      let allIdsToBeDeleted = [...parentIdsArr, id];

      //initialize to empty an array of all to be deleted Materials
      let allDeletedMaterialDef = [];

      //for each material to be deleted, update the deleted_at column to the current Date, then push the material definiation to material definition array
      for (const idToBeDeleted of allIdsToBeDeleted) {
        let [newMaterialDef] = await db(table)
          .where("id", idToBeDeleted)
          .update({ deleted_at: new Date() })
          .returning("*");

        allDeletedMaterialDef.push(newMaterialDef);
      }
      return allDeletedMaterialDef;
    } catch (err) {
      throw new Error("Error in delete method, material not deleted");
    }
  }

  //recursive
  async getParentIds(id) {
    //find parent ids
    let foundParentId = await db(cTable)
      .where("material_id", id)
      .select("parent_id");

    if (foundParentId.length > 0) {
      const [parentId] = foundParentId.map(
        (parentIdObj) => parentIdObj.parent_id
      );
      const allParentIds = await this.getParentIds(parentId);
      allParentIds.push(parentId);
      return allParentIds;
    } else {
      const parentIdArray = [];
      return parentIdArray;
    }
  }

  //create method for creating new or previously existing materials
  static async create(payload) {
    try {
      //let newMaterial = new Material(payload);
      //get number of rows in existing material table
      let [countObj] = await db(table).count("id");
      let numRows = countObj.count;

      //if the id given is less than the number of rows in the material table, we know the material and composition have been defined before
      if (payload.id <= numRows) {
        //check if there are children material who are still deleted. If there are, throw an error message saying to fix children first
        let childIds = await Material.getChildIds(payload.id);
        let deletedAtHolder = [];

        if (childIds.length > 0) {
          let childDeleletedAtObjArr = await db
            .select("id", "deleted_at")
            .from(table)
            .whereIn("id", childIds);
          childDeleletedAtObjArr.forEach((object) => {
            if (object.deleted_at) {
              deletedAtHolder.push(object.deleted_at);
            }
          });
        }

        if (childIds.length === 0 || deletedAtHolder.length === 0) {
          //find the material
          let foundMaterial = await db(table).where("id", payload.id).first();

          //if deleted at has a timestamp (truthy), update all fields with what was sent in the payload (we assume, however that the composition remains the same)
          if (foundMaterial.deleted_at) {
            let [newExistingMaterial] = await db(table)
              .where("id", payload.id)
              .update({
                power_level: payload.power_level,
                qty: payload.qty,
                deleted_at: null,
              })
              .returning("*");
            return newExistingMaterial;
          } else {
            throw { error: "exists" };
          }
        } else {
          //it already exists, so throw error saying it exists
          throw { error: "create child first" };
        }
      } else {
        //in here create brand new material with composition and everything
      }
    } catch (err) {
      if (err.error == "exists") {
        throw new Error("Material already exists");
      } else if (err.error == "create child first") {
        throw new Error(
          "One of the material's children has been deleted. Create it before continuing"
        );
      } else {
        throw new Error("Cannot create material");
      }
    }
  }

  //recursive funciton to get all childIds
  static async getChildIds(id) {
    //find first child ids
    let foundChildId = await db(cTable)
      .where("parent_id", id)
      .select("material_id");

    //if there are first, child ids, cycle over them to see if they have children. push all the children into an array and return the array
    if (foundChildId.length > 0) {
      const childIds = foundChildId.map((childIdObj) => childIdObj.material_id);
      for (const childId of childIds) {
        const newChildId = await Material.getChildIds(childId);
        let allChildIds = [...childIds];
        allChildIds = [...childIds, ...newChildId];
        return allChildIds;
      }
    } else {
      return [];
    }
  }
}

module.exports = Material;
