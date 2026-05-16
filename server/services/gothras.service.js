const db = require("../models");

const Gothras = db.gothras;
//console.log(db.gothras);

exports.getAllGothras = async () => {
  try {

    const gothras = await Gothras.findAll({
      attributes: ["id", "gothraname", "gothrarushi", "gothranum"],
      order: [["gothraname", "ASC"]],
    });

    return gothras;
    

  } catch (error) {
    throw error;
  }
};