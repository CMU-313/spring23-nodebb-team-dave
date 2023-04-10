'use strict';

const helpers = require('../helpers');
const user = require('../../user');
const db = require('../../database');

const Career = module.exports;

Career.register = async (req, res) => {
  const userData = req.body;
  try {
    const userCareerData = {
      student_id: userData.student_id,
      major: userData.major,
      age: userData.age,
      gender: userData.gender,
      gpa: userData.gpa,
      extra_curricular: userData.extra_curricular,
      num_programming_languages: userData.num_programming_languages,
      num_past_internships: userData.num_past_internships,
    };

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userCareerData),
      redirect: 'follow'
    };

    // Call the microservice and retrieve the prediction
    try {
      const response = await fetch('https://career-microservice.fly.dev/predict', requestOptions)
        .then(response => response.json());
      userCareerData.prediction = response.good_employee
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'An error occurred while calling the ML microservice' });
    }

    await user.setCareerData(req.uid, userCareerData);
    db.sortedSetAdd('users:career', req.uid, req.uid);
    res.json({});
  } catch (err) {
    console.log(err);
    helpers.noScriptErrors(req, res, err.message, 400);
  }
};
