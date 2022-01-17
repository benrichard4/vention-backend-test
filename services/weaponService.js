const {
  updatePowerLevel,
  findWeapon,
  updateStatus,
} = require("../models/weapon");

const { findAll } = require("../models/material");

const WeaponService = () => {
  const updateWeaponPowerLevel = async (matId) => {
    return updatePowerLevel(matId);
  };

  const getWeaponQuantity = async (id) => {
    const weapon = await findWeapon(id);
    return weapon.getMaxQuantity(id);
  };

  const updateWeaponStatus = async (matId, status) => {
    const material = await findAll(matId);
    const parentMaterials = await material.getParentIds(matId);
    const matIds = [...parentMaterials, matId];
    return updateStatus(matIds, status);
  };

  return {
    updateWeaponPowerLevel,
    getWeaponQuantity,
    updateWeaponStatus,
  };
};

module.exports = WeaponService;
