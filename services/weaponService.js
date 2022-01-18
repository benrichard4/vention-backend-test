const {
  updatePowerLevel,
  findWeapon,
  updateStatus,
} = require("../models/weapon");

const { getParentIds } = require("../models/material");

//Weapon service handles the business logic of the weapon class.
const WeaponService = () => {
  const updateWeaponPowerLevel = async (matId) => {
    const parentMaterials = await getParentIds(matId);
    const matIds = [...parentMaterials, Number(matId)];
    return updatePowerLevel(matIds);
  };

  const getWeaponQuantity = async (id) => {
    const weapon = await findWeapon(id);
    return weapon.getMaxQuantity(id);
  };

  const updateWeaponStatus = async (matId, status) => {
    //const material = await findAll(matId);
    const parentMaterials = await getParentIds(matId);
    const matIds = [...parentMaterials, matId];
    await updatePowerLevel(matIds);
    return updateStatus(matIds, status);
  };

  return {
    updateWeaponPowerLevel,
    getWeaponQuantity,
    updateWeaponStatus,
  };
};

module.exports = WeaponService;
