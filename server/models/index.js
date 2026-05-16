const Sequelize = require("sequelize");
const sequelize = require("../config/db");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

/* ================= LOAD MODELS ================= */

db.User = require("./user")(sequelize, Sequelize.DataTypes);
db.Customer = require("./Customer")(sequelize, Sequelize.DataTypes);
db.Product = require("./Product")(sequelize, Sequelize.DataTypes);
db.Attachment = require("./attachment")(sequelize, Sequelize.DataTypes);

//db.ActivityLog = require("./activitylog.model")(sequelize, Sequelize.DataTypes);

db.Profile = require("./profile")(sequelize, Sequelize);
db.FamilyDetail = require("./familydetail.model")(sequelize, Sequelize);
db.Address = require("./address.model")(sequelize, Sequelize.DataTypes);
db.Occupation = require("./occupation.model")(sequelize, Sequelize.DataTypes);
db.Education = require("./education.model")(sequelize, Sequelize.DataTypes);

db.EnumType = require("./enumtype.model")(sequelize, Sequelize);
db.FormEnumMap = require("./formEnumMap.model")(sequelize, Sequelize);

db.ProfilePreference = require("./profilepreference.model")(sequelize, Sequelize.DataTypes);
db.ProfileStarPreference = require("./profilestarpreference.model")(sequelize, Sequelize.DataTypes);
db.ProfileQuestion = require("./Profilequestions.model")(sequelize, Sequelize.DataTypes);
db.profileanswers = require("./profileanswers.model")(sequelize, Sequelize.DataTypes);
// db.ProfileRejection = require("./profilerejection.model")(sequelize, Sequelize.DataTypes);
db.ProfileMatch = require("./profilematch.model")(sequelize, Sequelize.DataTypes);

db.ProfileInteraction = require("./profileinteraction.model")(sequelize, Sequelize.DataTypes);
db.ProfileTask = require("./profiletask.model")(sequelize, Sequelize.DataTypes);
db.ProfilePlan = require("./profilePlan.model")(sequelize, Sequelize.DataTypes);


db.gothras = require("./gothras.model")(sequelize, Sequelize);


/* ================= EXISTING ASSOCIATIONS ================= */

db.Profile.hasOne(db.ProfilePreference, { foreignKey: "profileid" });
db.Profile.hasOne(db.gothras, { sourceKey: "swagothra", foreignKey: "id", as: "swagothranm" });
db.Profile.hasOne(db.gothras, { sourceKey: "mamagothra", foreignKey: "id", as: "mamagothranm" });
db.Profile.hasMany(db.ProfileStarPreference, { foreignKey: "profileid" });
db.Profile.hasMany(db.Occupation, { foreignKey: "parentid", as: "occupations", scope: {parenttype: "profile"} });
db.Profile.hasMany(db.Education, { foreignKey: "profile_id", as: "educations" });

db.gothras.belongsTo(db.Profile, { as: "swagothranm", foreignKey: "swagothra"});
db.gothras.belongsTo(db.Profile, { as: "mamagothranm", foreignKey: "mamagothra"});

db.Occupation.belongsTo(db.Profile, { foreignKey: "parentid", as: "profile", scope: {parenttype: "profile"} });

db.Education.belongsTo(db.Profile, { foreignKey: "profile_id", as: "profile" });

db.FormEnumMap.belongsTo(db.EnumType, {
  foreignKey: "enumtype",
  targetKey: "enumtype",
  as: "enum"
});

/* ================= NEW FIXED ASSOCIATIONS ================= */

// Interactions → Profile
db.ProfileInteraction.belongsTo(db.Profile, {
  foreignKey: "profileid",
  as: "profile",
});

db.Profile.hasMany(db.ProfileInteraction, {
  foreignKey: "profileid",
});

// Tasks → Profile
db.ProfileTask.belongsTo(db.Profile, {
  foreignKey: "profileid",
  as: "profile",
});

db.Profile.hasMany(db.ProfileTask, {
  foreignKey: "profileid",
});

/* ================= POLYMORPHIC ATTACHMENTS ================= */

// Product ↔ Attachments
db.Product.hasMany(db.Attachment, {
  as: "attachments",
  foreignKey: "attachable_id",
  constraints: false,
  scope: {
    attachable_type: "Product"
  }
});

// Customer ↔ Attachments
db.Customer.hasMany(db.Attachment, {
  as: "attachments",
  foreignKey: "attachable_id",
  constraints: false,
  scope: {
    attachable_type: "Customer"
  }
});

// Reverse associations
db.Attachment.belongsTo(db.Product, {
  foreignKey: "attachable_id",
  constraints: false
});

db.Attachment.belongsTo(db.Customer, {
  foreignKey: "attachable_id",
  constraints: false
});

/* ================= PROFILE EXTRA ================= */

db.Profile.belongsTo(db.Attachment, {
  foreignKey: "profilePictureId",
  as: "profilePicture"
});

db.Profile.hasMany(db.FamilyDetail, {
  foreignKey: "profileid",
  as: "familyMembers"
});

db.FamilyDetail.belongsTo(db.Profile, {
  foreignKey: "profileid"
});

db.Profile.hasMany(db.ProfileMatch, {
  foreignKey: "profileid"
});

db.ProfileMatch.belongsTo(db.Profile, {
  foreignKey: "profileid"
});




module.exports = db;