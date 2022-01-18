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

  /////////////////////////////////////
  //  FIND                           //
  /////////////////////////////////////
  //find will find materials, as long as they have not been deleted(has a timestamp under "deleted_at")
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

  /////////////////////////////////////
  //  FIND ALL                       //
  /////////////////////////////////////
  //findAll similar to find but finds even deleted instances of materials
  static async findAll(id) {
    try {
      let material = await db(table).where("id", id).first();
      return new Material(material);
    } catch (err) {
      throw new Error("Material not found"); // was "Weapon not found"
    }
  }

  /////////////////////////////////////
  //  UDPATE                         //
  /////////////////////////////////////
  // Update method Updates the material's power level. takes in material id and new powerlevel
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

  /////////////////////////////////////
  //  DELETE                         //
  /////////////////////////////////////
  //delete method takes in a material id and deletes the material in question by adding a timestamp to the cell under column "deleted_at". Since could be dependent on the material being deleted, any parent material, will also get a timestamp for deletion
  static async deleteM(id) {
    try {
      //if get all parent ids from recursive function
      let parentIdsArr = await Material.getParentIds(id);

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

  /////////////////////////////////////
  //  CREATE                         //
  /////////////////////////////////////
  //create method for creating materials
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

        //if there are children, check to see if they are deleted by adding the deleted ones to the deletedAtHolder
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
        //IN FUTURE CREATE, ADD CODE TO BE ABLE TO CREATE BRAND NEW MATERIAL WITH NEW COMPOSITIONS (ID > 12)
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

  /////////////////////////////////////
  //  MATERIAL SPECIFIC HELPERS      //
  /////////////////////////////////////

  //recursive method that finds all parents of a given material id
  static async getParentIds(id) {
    //find parent ids
    let foundParentId = await db(cTable)
      .where("material_id", id)
      .select("parent_id");

    if (foundParentId.length > 0) {
      const parentIds = foundParentId.map(
        (parentIdObj) => parentIdObj.parent_id
      );
      for (const parentId of parentIds) {
        const newParentId = await Material.getParentIds(parentId);
        let allParentIds = [...parentIds];
        allParentIds = [...parentIds, ...newParentId];
        return allParentIds;
      }
    } else {
      const parentIdArray = [];
      return parentIdArray;
    }
  }

  //recursive funciton to get all children of a given material id
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
