exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex("weapons")
    .del()
    .then(function () {
      // Inserts seed entries
      return knex("weapons").insert([
        {
          id: 1,
          name: "Excalibur",
          power_level: 16130,
          qty: 1,
          status: "new",
        },
        {
          id: 2,
          name: "Magic Staff",
          power_level: 225,
          qty: 1,
          status: "new",
        },
      ]);
    });
};
