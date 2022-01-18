const db = require("../config/dbConfig.js");
const wTable = "weapons";
const mTable = "materials";
const cTable = "compositions";
const mwTable = "materials_weapons";

class Weapon {
  constructor(payload) {
    // TO BE IMPLEMENTED
    this.id = payload.id;
    this.name = payload.name;
    this.power_level = payload.power_level;
    this.qty = payload.qty;
    this.status = payload.status;
  }

  ///////////////////////////
  //  FIND                 //
  ///////////////////////////
  //method that finds a weapon based on id from the weapons table
  static async findWeapon(id) {
    try {
      let weapon = await db(wTable).where("id", id).first();
      return new Weapon(weapon);
    } catch (e) {
      throw new Error("Weapon Not found");
    }
  }

  ///////////////////////////
  //  UPDATE POWER LEVEL   //
  ///////////////////////////
  //method that updates the powerlevel of all weapons that are constructed with the materials being passed in the argument.
  static async updatePowerLevel(matIds) {
    try {
      const totalWeaponsToBeUpdated = [];
      for (const matId of matIds) {
        //find all weapons that use the materials passed into function
        let foundWeaponsObjArr = await db(mwTable)
          .where("material_id", matId)
          .select("weapon_id");
        const weaponsToBeUpdated = foundWeaponsObjArr.map(
          (weaponObj) => weaponObj.weapon_id
        );

        weaponsToBeUpdated.forEach((weapon) => {
          if (!totalWeaponsToBeUpdated.includes(weapon)) {
            totalWeaponsToBeUpdated.push(weapon);
          }
        });
      }

      //initialize updatedWeapons array
      const updatedWeapons = [];

      //cycle though each weapon id to be updated and update the weapon using the getPowerLevel method.
      for (const weaponId of totalWeaponsToBeUpdated) {
        //use find method to find weapon based on id
        let foundWeapon = await Weapon.findWeapon(weaponId);

        //get new power level of found weapon
        let newPowerLevel = await foundWeapon.getPowerLevel(weaponId);

        //update the weapon table with the new powerLevel and assign newWeaponDef as updated weapon
        let [newWeaponDef] = await db(wTable)
          .where("id", weaponId)
          .update({ power_level: newPowerLevel })
          .returning("*");

        //push newWeaponDef to updatedWeaons
        updatedWeapons.push(newWeaponDef);
      }

      return updatedWeapons;
    } catch (e) {
      throw new Error("Error in updatePowerLevel");
    }
  }

  ///////////////////////////
  //  GET POWER LEVEL      //
  ///////////////////////////
  //method that gets power level of weapon by id
  async getPowerLevel(id) {
    try {
      //get materials that weapon is constructed from from id and store in array
      const materialObjArr = await db(mwTable)
        .where("weapon_id", id)
        .select("material_id");
      const materialArr = materialObjArr.map(
        (materialObj) => materialObj.material_id
      );

      //variable that will hold sum of all powerlevels of materials.
      let weaponPowerLevelSum = 0;

      //cycle through all materials in materialArr
      for (const material of materialArr) {
        //for each material, get the material total power level based on the material itself and the material's composition and add it to weaponPowerLevelSum.
        weaponPowerLevelSum += await this.getMaterialTotalPowerLevel(material);
      }

      return weaponPowerLevelSum;
    } catch (e) {
      throw new Error("Weapon not found");
    }
  }

  /////////////////////////////////////
  //  GET MATERIAL TOTAL POWER LEVEL //
  /////////////////////////////////////
  //method that gets material's total power level based on its composition. (recursive function)
  async getMaterialTotalPowerLevel(matId) {
    try {
      //get power level of material from material table
      let foundMaterial = await db(mTable).where("id", matId).first();
      let materialPowerLevel = foundMaterial.power_level;

      //get material composition from composition table
      let materialCompositionArr = await db(cTable).where("parent_id", matId);

      //if material composition array is empty, return materialPowerLevel . Else -> see notes in else
      if (materialCompositionArr.length === 0) {
        return materialPowerLevel;
      } else {
        let compositionPower = 0;
        //cycle through material composition array, and for each material, run recursive method and add to composition power
        for (const subMaterialObj of materialCompositionArr) {
          compositionPower +=
            (await this.getMaterialTotalPowerLevel(
              subMaterialObj.material_id
            )) * subMaterialObj.qty;
        }

        //return composition plus the materialPowerLevel. The materialPowerlevel is added here at the end and not in the for loop, so that it is not added each time the for loop runs
        return compositionPower + materialPowerLevel;
      }
    } catch (err) {
      throw new Error("material not found");
    }
  }

  /////////////////////////////////////
  //  GET MAX QUANTITY               //
  /////////////////////////////////////
  //method that calculates max quantity of weapon based on weapon id
  async getMaxQuantity(id) {
    try {
      //let foundWeapon = await Weapon.find(id);
      //get materials that weapon is constructed from from id and store in array
      const materialObjArr = await db(mwTable)
        .where("weapon_id", id)
        .select("material_id");
      const materialArr = materialObjArr.map(
        (materialObj) => materialObj.material_id
      );

      //initalize array that will hold the max quantity available of each material that contributes to the build of the weapon.
      let maxFromEachMaterialArray = [];

      //cycle through each material and find the max quantity available to build weapon.
      for (const material of materialArr) {
        //get max material qty from method
        let maxMaterialQty = await this.getMaterialMaxQty(material);

        //push the result to the maxFromEachMaterialArray
        maxFromEachMaterialArray.push(maxMaterialQty);
      }

      //find the minimum value in maxFromEachMaterialArray and return it
      return Math.min(...maxFromEachMaterialArray);
    } catch (err) {
      throw new Error("Error in getMaxQuantity");
    }
  }

  /////////////////////////////////////
  //  GET MATERIAL MAX QTY           //
  /////////////////////////////////////
  //recursive method that finds the max quantity a material can provide based on its composition and qty in stock
  async getMaterialMaxQty(matId) {
    try {
      //get quantity of parent material from material table
      let foundParentMaterial = await db(mTable).where("id", matId).first();
      let parentMaterialQty = foundParentMaterial.qty;

      //get material composition from composition table
      let materialCompositionArr = await db(cTable).where("parent_id", matId);

      //if material composition array is empty, return parentMaterialQty. Else -> see notes in else
      if (materialCompositionArr.length === 0) {
        return parentMaterialQty;
      } else {
        let compositionQty = 0;

        //cycle through the material composition array, and for each material, run recursive method then add it to the composition qty.
        for (const subMaterialObj of materialCompositionArr) {
          compositionQty += Math.floor(
            (await this.getMaterialMaxQty(subMaterialObj.material_id)) /
              subMaterialObj.qty
          );
        }

        return compositionQty + parentMaterialQty;
      }
    } catch (e) {
      throw new Error("Error in getMaterialMaxQty");
    }
  }

  /////////////////////////////////////
  //  UPDATE STATUS                  //
  /////////////////////////////////////
  //method that is called when a material is deleted or created to determine if a weapon should break or be fixed to new, take in an array of ids, and a status ("broken" or "new")
  static async updateStatus(matIds, status) {
    try {
      //initialize updatedWeapons array
      const updatedWeapons = [];

      for (const materialId of matIds) {
        //find all weapons that use the material passed into function
        let foundWeaponsObjArr = await db(mwTable)
          .where("material_id", materialId)
          .select("weapon_id");
        const weaponsToBeUpdated = foundWeaponsObjArr.map(
          (weaponObj) => weaponObj.weapon_id
        );

        //cycle though each weapon id to be updated and update the weapon.
        for (const weaponId of weaponsToBeUpdated) {
          //update the weapon table with the new status and assign newWeaponDef as updated weapon
          if (status === "broken") {
            let [newWeaponDef] = await db(wTable)
              .where("id", weaponId)
              .update({ status: status })
              .returning("*");

            //push newWeaponDef to updatedWeaons if it's not already there
            if (!updatedWeapons.some((e) => e.name === newWeaponDef.name)) {
              updatedWeapons.push(newWeaponDef);
            }
          } else if (status === "new") {
            //check to see if any top level material in the weapon is deleted. If it is, don't update to new, if they are all.

            //get all top level materials of given weaponId
            let topLevelMaterialsObjArr = await db(mwTable)
              .where("weapon_id", weaponId)
              .select("material_id");
            let topLevelMaterials = topLevelMaterialsObjArr.map(
              (materials) => materials.material_id
            );

            //get array of all top level materials deleted_at values
            let isDeletedObjArr = await db
              .select("id", "deleted_at")
              .from(mTable)
              .whereIn("id", topLevelMaterials);

            //define empty array to hold potential deleted materials
            const deletedTopLevelMaterials = [];
            //cycle through ObjArr and push each item that has a deleted_at timestamp to deletedAt array
            isDeletedObjArr.forEach((object) => {
              if (object.deleted_at) {
                deletedTopLevelMaterials.push(object);
              }
            });

            //if deletedTopLevelMaterials is empty, it means it is ok to now set the weapon back to new
            if (deletedTopLevelMaterials.length === 0) {
              let [newWeaponDef] = await db(wTable)
                .where("id", weaponId)
                .update({ status: status })
                .returning("*");
              if (!updatedWeapons.some((e) => e.name === newWeaponDef.name)) {
                updatedWeapons.push(newWeaponDef);
              }
            }
          }
        }
      }

      return updatedWeapons;
    } catch (err) {
      throw new Error("Error updating Status");
    }
  }
}

module.exports = Weapon;
