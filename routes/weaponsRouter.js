const router = require("express").Router();

const WeaponService = require("../services/weaponService.js");

router.get("/:id/maxquantity", async (req, res) => {
  try {
    const quantity = await WeaponService().getWeaponQuantity(req.params.id);
    res.status(200).json(quantity);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
