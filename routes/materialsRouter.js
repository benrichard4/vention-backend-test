const router = require("express").Router();

const MaterialService = require("../services/materialService.js");
const WeaponService = require("../services/weaponService.js");

// IMPLEMENT CRUD FOR MATERIAL
router.get("/:id", async (req, res) => {
  try {
    const material = await MaterialService().getMaterial(req.params.id);
    res.status(200).json({ data: material, message: "Material found" });
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
    const updatedWeapons = await WeaponService().updateWeaponPowerLevel(
      req.params.id
    );
    res.status(201).json({
      data: { updatedMaterial, updatedWeapons },
      message: "Material and related Weapons power level updated",
    });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

//ROUTE FOR DELETING MATERIALS BASED ON CHILD ID. ALSO SETS WEAPON TO BROKEN IF WEAPON IS COMPOSED OF MATERIAL IN QUESTION
router.delete("/:id", async (req, res) => {
  try {
    //get deleted material
    const deletedMaterials = await MaterialService().deleteMaterial(
      req.params.id
    );
    //get broken weapon if any
    const brokenWeapons = await WeaponService().updateWeaponStatus(
      req.params.id,
      "broken"
    );
    res.status(200).json({ deletedMaterials, brokenWeapons });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

//POST NEW MATERIAL
//BODY(PAYLOAD): {
// id,
// power_level,
// qty,
// deleted at
//}
router.post("", async (req, res) => {
  try {
    //get created Material
    const createdMaterial = await MaterialService().createMaterial(req.body);
    //update weapon status if necessary (uses createdMaterial.id, to be sure that the weapon only gets updated if the material was succesfully created)
    if (!createdMaterial) {
      throw new Error(
        "ID must be between 1 and 12. Cannot yet create other IDs"
      );
    }
    const updatedWeapon = await WeaponService().updateWeaponStatus(
      createdMaterial.id,
      "new"
    );
    res.status(201).json({
      data: { createdMaterial, updatedWeapon },
      message: "Material created successfully",
    });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});
module.exports = router;
