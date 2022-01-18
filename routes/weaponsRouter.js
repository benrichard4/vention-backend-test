const router = require("express").Router();

const WeaponService = require("../services/weaponService.js");

//ROUTE FOR GETTING THE MAX QUANTITY OF A WEAPON THAT COULD BE BUILT BASED ON MATERIAL
router.get("/:id/maxquantity", async (req, res) => {
  try {
    const maxQuantity = await WeaponService().getWeaponQuantity(req.params.id);
    res.status(200).json({
      data: { maxQuantity },
      message: "Quantity successfully calculated",
    });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
