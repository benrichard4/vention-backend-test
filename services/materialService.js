const { find, update, create } = require("../models/material");

const MaterialService = () => {
  const getMaterial = async (id) => {
    return find(id);
  };

  const updateMaterial = async (id, powerLevel) => {
    return update(id, powerLevel);
  };

  const deleteMaterial = async (id) => {
    const material = await find(id);
    return material.delete(id);
  };

  const createMaterial = async (payload) => {
    return create(payload);
  };

  return {
    getMaterial,
    updateMaterial,
    deleteMaterial,
    createMaterial,
  };
};

module.exports = MaterialService;
