const { profileanswers } = require("../models");


exports.getanswers = (profileid) => {
  return profileanswers.findAll({
    where: { profileid }
  });
};



exports.saveanswers = async (profileid, answers = [], usr) => {
  // await profileanswers.saveAnswers(profileid, answers);
  await profileanswers.destroy({
    where: { profileid }
  });


  return profileanswers.bulkCreate(
    answers.map(a => ({
      profileid,
      questionid: a.questionid,
      answer: a.answer,
      createdby: usr
    }))
  );
};
