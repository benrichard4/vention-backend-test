const { find, update } = require("../models/material");

const MaterialService = () => {
  const getMaterial = async (id) => {
    return find(id);
  };

  const updateMaterial = async (id, powerLevel) => {
    return update(id, powerLevel);
  };

  return {
    getMaterial,
    updateMaterial,
  };
};

module.exports = MaterialService;
