const { ProfileInteraction, ProfileTask, Profile, Sequelize } = require("../models");
const { touchLastInteraction } = require("./profile.service");
const { Op } = Sequelize;

/* ---------------- INTERACTIONS ---------------- */

exports.createInteraction = async (data) => {
  // console.log(data);
  const prof = await Profile.findOne({
    where: {
      orgid: data.orgid,
      client_id: data.clientid
    }
  });

  if (prof) {
    data.profileid = prof.id;
    const interaction = await ProfileInteraction.create(data);
    if (data.profileid) await touchLastInteraction(data.profileid);
    return interaction;
  } else {
    throw new Error(`No profile found for client_id ${data.clientid}`);
  }
};

exports.listByProfile = async (profileid) => {
  return ProfileInteraction.findAll({
    where: { profileid, is_deleted: 0 },
    include: [
      {
        model: Profile,
        as: "profile",
        attributes: ["id", "firstname", "lastname", "client_id", "orgid"],
      },
    ],
    order: [["createdat", "DESC"]],
  });
};

exports.search = async ({ from, to, profileid, staffid, orgid, status }) => {
  const where = { is_deleted: 0 };

  if (from && to) {
    where.createdat = {
      [Op.between]: [
        new Date(`${from}T00:00:00`),
        new Date(`${to}T23:59:59`)
      ]
    };
  }

  if (profileid) {
    const prof = await Profile.findOne({
      where: {
        client_id: profileid,
        orgid: orgid
      }
    });

    if (prof) {
      where.profileid = prof.id;
    } else {
      throw new Error(`No profile found for client_id ${profileid}`);
    }
  } 
  if (staffid) where.userid = staffid;

  return ProfileInteraction.findAll({
    where,
    include: [
      {
        model: Profile,
        as: "profile",
        attributes: ["id", "firstname", "lastname", "client_id", "orgid" ],
      },
    ],
    order: [["createdat", "DESC"]],
  });
};

/* UPDATE INTERACTION DATE */
exports.updateInteractionDate = async (id, createdat) => {
  const interaction = await ProfileInteraction.findByPk(id);
  if (!interaction) return;

  const datetime = new Date(createdat);

  await ProfileInteraction.update(
    { createdat: datetime },
    { where: { id } }
  );

  if (interaction.profileid) await touchLastInteraction(interaction.profileid);
};

/* ---------------- TASKS ---------------- */

exports.createTask = async (data) => {
  // console.log(data);
  const prof = await Profile.findOne({
    where: {
      orgid: data.orgid,
      client_id: data.clientid
    }
  });

  if (prof) {
    data.profileid = prof.id;
    const task = await ProfileTask.create(data);
    if (data.profileid) await touchLastInteraction(data.profileid);
    return task;
  } else {
    throw new Error(`No profile found for client_id ${data.clientid}`);
  };
};

exports.listTasks = async (profileid) => {
  return ProfileTask.findAll({
    where: { profileid, is_deleted: 0 },
    include: [
      {
        model: Profile,
        as: "profile",
        attributes: ["id", "firstname", "lastname", "client_id", "orgid"],
      },
    ],
    order: [["createdat", "DESC"]],
  });
};

exports.searchTasks = async ({ from, to, profileid, staffid, status, notes, client_id, orgid }) => {
  const where = { is_deleted: 0 };
  if (from && to) {
    where.createdat = {
      [Op.between]: [
        new Date(`${from}T00:00:00`),
        new Date(`${to}T23:59:59`)
      ]
    };
  }

  
  if (profileid) {
    const prof = await Profile.findOne({
      where: { client_id: profileid, orgid: orgid }
    });
    if (prof) {
      where.profileid = prof.id;
    } else {
      throw new Error(`No profile found for client_id ${profileid}`);
    }
  }

  if (staffid) where.createdby = staffid;

  if (status) {
    where.status = { [Op.in]: status.split(",").map(Number) };
  }
  if (notes) {
    where.description = { [Op.like]: `%${notes}%` };
  }

  return ProfileTask.findAll({
    where,
    include: [
      {
        model: Profile,
        as: "profile",
        attributes: ["id", "firstname", "lastname", "client_id", "orgid"],
      },
    ],
    order: [["createdat", "DESC"]],
  });
};

exports.updateTask = async (id, payload) => {
  const task = await ProfileTask.findByPk(id);
  if (!task) return;

  const updateData = {};

  if (payload.status !== undefined)
    updateData.status = payload.status;

  if (payload.reason !== undefined)
    updateData.reason = payload.reason;

  if (payload.duedate !== undefined)
    updateData.duedate = payload.duedate || null;

  await ProfileTask.update(updateData, {
    where: { id }
  });

  if (task.profileid) await touchLastInteraction(task.profileid);
};