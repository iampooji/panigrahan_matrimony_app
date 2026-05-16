const addressService = require("../services/address.service");
const profileService = require("../services/profile.service");
const familyService = require("../services/familydetail.service");

/* ── Allowed address columns (matches `address` table exactly) ── */
const ADDRESS_FIELDS = ["addone", "addtwo", "addthree", "city", "district", "state", "country", "zipcode"];

/* ── Strip any non-column fields before inserting ── */
function pickAddressFields(data) {
  const clean = {};
  for (const key of ADDRESS_FIELDS) {
    if (data[key] !== undefined) clean[key] = data[key];
  }
  return clean;
}

/* ── Get distinct cities from address table ── */
exports.getCities = async (req, res, next) => {
  try {
    const cities = await addressService.getDistinctCities();
    res.json(cities);
  } catch (err) {
    next(err);
  }
};

/* ── Get addresses for a profile ── */
exports.getForProfile = async (req, res, next) => {
  try {
    const { profileid } = req.params;
    const profile = await profileService.findById(profileid, req.user?.role);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const ids = [
      profile.current_address_id,
      profile.permanent_address_id,
      profile.work_address_id
    ];

    const addresses = await addressService.findByIds(ids);

    const result = {
      current:   addresses.find(a => a.id === profile.current_address_id)   || null,
      permanent: addresses.find(a => a.id === profile.permanent_address_id) || null,
      work:      addresses.find(a => a.id === profile.work_address_id)      || null
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* ── Get addresses for a family member ── */
exports.getForFamily = async (req, res, next) => {
  try {
    const { familyid } = req.params;
    const member = await familyService.findById(familyid);
    if (!member) return res.status(404).json({ message: "Family member not found" });

    const ids = [
      member.current_address_id,
      member.permanent_address_id,
      member.work_address_id
    ];

    const addresses = await addressService.findByIds(ids);

    const result = {
      current:   addresses.find(a => a.id === member.current_address_id)   || null,
      permanent: addresses.find(a => a.id === member.permanent_address_id) || null,
      work:      addresses.find(a => a.id === member.work_address_id)      || null
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* ── Save address for profile ── */
exports.saveForProfile = async (req, res, next) => {
  try {
    const { profileid } = req.params;
    const { address_type, ...addressData } = req.body;

    const newAddress = await addressService.create({
      ...pickAddressFields(addressData),
      relationtype: "profile",
      relationid: profileid
    });

    const columnMap = {
      current:   "current_address_id",
      permanent: "permanent_address_id",
      work:      "work_address_id"
    };

    const column = columnMap[address_type];
    if (!column) return res.status(400).json({ message: "Invalid address_type" });

    await profileService.update(profileid, { [column]: newAddress.id });

    res.json(newAddress);
  } catch (err) {
    next(err);
  }
};

/* ── Save bulk addresses for profile (handles same-as-current sharing one row) ──
   Accepts array of { address_type, ...fields }.
   If current and permanent have the same data (sameAsCurrent),
   caller sends both with the same fields — we create ONE row and
   point both FKs at it.
── */
exports.saveBulkForProfile = async (req, res, next) => {
  try {
    const { profileid } = req.params;
    const items = req.body; // array

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Expected array of address items" });
    }

    const columnMap = {
      current:   "current_address_id",
      permanent: "permanent_address_id",
      work:      "work_address_id"
    };

    const updates = {};

    const current   = items.find(i => i.address_type === "current");
    const permanent = items.find(i => i.address_type === "permanent");
    const work      = items.find(i => i.address_type === "work");

    const isSame = current && permanent && JSON.stringify(
      Object.fromEntries(
        Object.entries(current).filter(([k]) => k !== "address_type")
      )
    ) === JSON.stringify(
      Object.fromEntries(
        Object.entries(permanent).filter(([k]) => k !== "address_type")
      )
    );

    if (isSame) {
      const newAddress = await addressService.create({
        ...pickAddressFields(current),
        relationtype: "profile",
        relationid: profileid
      });
      updates.current_address_id   = newAddress.id;
      updates.permanent_address_id = newAddress.id;
    } else {
      for (const item of [current, permanent].filter(Boolean)) {
        const newAddress = await addressService.create({
          ...pickAddressFields(item),
          relationtype: "profile",
          relationid: profileid
        });
        updates[columnMap[item.address_type]] = newAddress.id;
      }
    }

    if (work) {
      const newAddress = await addressService.create({
        ...pickAddressFields(work),
        relationtype: "profile",
        relationid: profileid
      });
      updates[columnMap.work] = newAddress.id;
    }

    await profileService.update(profileid, updates);

    res.json({ success: true, updates });
  } catch (err) {
    next(err);
  }
};

/* ── Save address for family member ── */
exports.saveForFamily = async (req, res, next) => {
  try {
    const { familyid } = req.params;
    const { address_type, ...addressData } = req.body;

    const newAddress = await addressService.create({
      ...pickAddressFields(addressData),
      relationtype: "family",
      relationid: familyid
    });

    const columnMap = {
      current:   "current_address_id",
      permanent: "permanent_address_id",
      work:      "work_address_id"
    };

    const column = columnMap[address_type];
    if (!column) return res.status(400).json({ message: "Invalid address_type" });

    await familyService.update(familyid, { [column]: newAddress.id });

    res.json(newAddress);
  } catch (err) {
    next(err);
  }
};

/* ── Save bulk addresses for family (handles same-as-current) ── */
exports.saveBulkForFamily = async (req, res, next) => {
  try {
    const { familyid } = req.params;
    const items = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Expected array of address items" });
    }

    const columnMap = {
      current:   "current_address_id",
      permanent: "permanent_address_id",
      work:      "work_address_id"
    };

    const updates = {};

    const current   = items.find(i => i.address_type === "current");
    const permanent = items.find(i => i.address_type === "permanent");
    const work      = items.find(i => i.address_type === "work");

    const isSame = current && permanent && JSON.stringify(
      Object.fromEntries(
        Object.entries(pickAddressFields(current))
      )
    ) === JSON.stringify(
      Object.fromEntries(
        Object.entries(pickAddressFields(permanent))
      )
    );

    if (isSame) {
      const newAddress = await addressService.create({
        ...pickAddressFields(current),
        relationtype: "family",
        relationid: familyid
      });
      updates.current_address_id   = newAddress.id;
      updates.permanent_address_id = newAddress.id;
    } else {
      for (const item of [current, permanent].filter(Boolean)) {
        const newAddress = await addressService.create({
          ...pickAddressFields(item),
          relationtype: "family",
          relationid: familyid
        });
        updates[columnMap[item.address_type]] = newAddress.id;
      }
    }

    if (work) {
      const newAddress = await addressService.create({
        ...pickAddressFields(work),
        relationtype: "family",
        relationid: familyid
      });
      updates[columnMap.work] = newAddress.id;
    }

    await familyService.update(familyid, updates);

    res.json({ success: true, updates });
  } catch (err) {
    next(err);
  }
};

/* ── Edit address for profile ── */
exports.editForProfile = async (req, res, next) => {
  try {
    const { profileid } = req.params;
    const { address_type, id, ...addressData } = req.body;

    const newAddress = await addressService.create({
      ...pickAddressFields(addressData),
      relationtype: "profile",
      relationid: profileid
    });

    const columnMap = {
      current:   "current_address_id",
      permanent: "permanent_address_id",
      work:      "work_address_id"
    };

    const column = columnMap[address_type];
    if (!column) return res.status(400).json({ message: "Invalid address_type" });

    await profileService.update(profileid, { [column]: newAddress.id });

    res.json(newAddress);
  } catch (err) {
    next(err);
  }
};

/* ── Edit address for family member ── */
exports.editForFamily = async (req, res, next) => {
  try {
    const { familyid } = req.params;
    const { address_type, id, ...addressData } = req.body;

    const newAddress = await addressService.create({
      ...pickAddressFields(addressData),
      relationtype: "family",
      relationid: familyid
    });

    const columnMap = {
      current:   "current_address_id",
      permanent: "permanent_address_id",
      work:      "work_address_id"
    };

    const column = columnMap[address_type];
    if (!column) return res.status(400).json({ message: "Invalid address_type" });

    await familyService.update(familyid, { [column]: newAddress.id });

    res.json(newAddress);
  } catch (err) {
    next(err);
  }
};

/* ── Edit merged (current-permanent) address for profile ──
   If address_type === "current-permanent", creates ONE new row
   and points both current_address_id and permanent_address_id at it.
   If dataOrArray is an array (user unchecked "same as current"),
   creates two separate rows.
── */
exports.editMergedForProfile = async (req, res, next) => {
  try {
    const { profileid } = req.params;
    const body = req.body;

    if (Array.isArray(body)) {
      const columnMap = {
        current:   "current_address_id",
        permanent: "permanent_address_id"
      };
      const updates = {};
      for (const item of body) {
        const { address_type } = item;
        const newAddress = await addressService.create({
          ...pickAddressFields(item),
          relationtype: "profile",
          relationid: profileid
        });
        updates[columnMap[address_type]] = newAddress.id;
      }
      await profileService.update(profileid, updates);
      return res.json({ success: true, updates });
    }

    const { address_type } = body;
    const newAddress = await addressService.create({
      ...pickAddressFields(body),
      relationtype: "profile",
      relationid: profileid
    });
    await profileService.update(profileid, {
      current_address_id:   newAddress.id,
      permanent_address_id: newAddress.id
    });

    res.json(newAddress);
  } catch (err) {
    next(err);
  }
};

/* ── Edit merged (current-permanent) address for family member ── */
exports.editMergedForFamily = async (req, res, next) => {
  try {
    const { familyid } = req.params;
    const body = req.body;

    if (Array.isArray(body)) {
      const columnMap = {
        current:   "current_address_id",
        permanent: "permanent_address_id"
      };
      const updates = {};
      for (const item of body) {
        const { address_type } = item;
        const newAddress = await addressService.create({
          ...pickAddressFields(item),
          relationtype: "family",
          relationid: familyid
        });
        updates[columnMap[address_type]] = newAddress.id;
      }
      await familyService.update(familyid, updates);
      return res.json({ success: true, updates });
    }

    const { address_type } = body;
    const newAddress = await addressService.create({
      ...pickAddressFields(body),
      relationtype: "family",
      relationid: familyid
    });
    await familyService.update(familyid, {
      current_address_id:   newAddress.id,
      permanent_address_id: newAddress.id
    });

    res.json(newAddress);
  } catch (err) {
    next(err);
  }
};