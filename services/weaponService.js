const { updatePowerLevel } = require("../models/weapon");

const WeaponService = () => {
  const updateWeapon = async (mat_id) => {
    return updatePowerLevel(mat_id);
  };

  return {
    updateWeapon,
  };
};

module.exports = WeaponService;
