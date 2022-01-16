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
    this.power_level = payload.powerlevel;
    this.qty = payload.qty;
    this.status = payload.status;
  }

  //method that finds a weapon based on id
  static async find(id) {
    try {
      let weapon = await db(wTable).where("id", id).first();
      return new Weapon(weapon);
    } catch (e) {
      throw new Error("Weapon Not found");
    }
  }

  //method that updates the powerlevel of all weapons that are constructed with the material being passed in the argument.
  static async updatePowerLevel(mat_id) {
    try {
      //find all weapons that use the material passed into function
      let foundWeaponsObjArr = await db(mwTable)
        .where("material_id", mat_id)
        .select("weapon_id");
      const weaponsToBeUpdated = foundWeaponsObjArr.map(
        (weaponObj) => weaponObj.weapon_id
      );

      //initialize updatedWeapons array
      const updatedWeapons = [];

      //cycle though each weapon id to be updated and update the weapon using the getPowerLevel method.
      for (const weaponId of weaponsToBeUpdated) {
        //use find method to find weapon based on id
        let foundWeapon = await Weapon.find(weaponId);

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

  //TO BE IMPLEMENTED
  async getPowerLevel(id) {
    try {
      console.log("in get powerlevel");
      //get materials from this.id and store in array
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

  //function that gets materials total power level based on its composition
  async getMaterialTotalPowerLevel(mat_id) {
    try {
      //get power level of material from material table
      let foundMaterial = await db(mTable).where("id", mat_id).first();
      let materialPowerLevel = foundMaterial.power_level;

      //get material composition from composition table
      let materialCompositionArr = await db(cTable).where("parent_id", mat_id);

      //if material composition array is empty, return materialPowerLevel multiplied by the qty. Else -> see notes in else
      if (materialCompositionArr.length === 0) {
        return materialPowerLevel;
      } else {
        let compositionPower = 0;
        //cycle through material composition array, and for each material, run recursive method and add to materialPowerLevel * qty.
        for (const subMaterialObj of materialCompositionArr) {
          compositionPower +=
            (await this.getMaterialTotalPowerLevel(
              subMaterialObj.material_id
            )) * subMaterialObj.qty;
        }
        //return composition plus the materialPowerLevel. The materialPowerlevel is added here at the end and not if the for loop, so that it is not added each time the for loop runs

        return compositionPower + materialPowerLevel;
      }
    } catch (err) {
      throw new Error("material not found");
    }
  }
}

// let excaliber = new Weapon({ id: 1 });
// this.getPowerLevel(1).then((res) => console.log("finalSum", res));
//Weapon.updatePowerLevel(6).then((res) => console.log(res));
// Weapon.getPowerLevel(1).then((res) => console.log(res));
//axe.getMaterialTotalPowerLevel(6, 1).then((res) => console.log(res));
//console.log(Axe);

module.exports = Weapon;
