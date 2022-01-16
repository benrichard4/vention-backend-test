const router = require("express").Router();

const MaterialService = require("../services/materialService.js");
const WeaponService = require("../services/weaponService.js");

// IMPLEMENT CRUD FOR MATERIAL
router.get("/:id", async (req, res) => {
  try {
    const material = await MaterialService().getMaterial(req.params.id);
    res.status(200).json(material);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

//ROUTE FOR UPDATING MATERIAL POWERLEVEL
//body: {
//  power_level
//}
router.patch("/:id", async (req, res) => {
  try {
    //get updated material
    const updatedMaterial = await MaterialService().updateMaterial(
      req.params.id,
      req.body.power_level
    );
    //get updated weapons corresponding to udpated materials
    const updatedWeapons = await WeaponService().updateWeapon(req.params.id);
    res.status(201).json({ updatedMaterial, updatedWeapons });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
