exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("materials_weapons")
    .del()
    .then(function () {
      // Inserts seed entries
      return knex("materials_weapons").insert([
        { weapon_id: 1, material_id: 1 },
        { weapon_id: 1, material_id: 6 },
        { weapon_id: 1, material_id: 9 },
        { weapon_id: 1, material_id: 12 },
        { weapon_id: 2, material_id: 6 },
      ]);
    });
};
