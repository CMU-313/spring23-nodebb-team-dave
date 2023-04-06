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

        // Call the microservice and retrieve the prediction
        try {
            const response = await axios.post('http://career-model-microservice.fly.dev/predict', userCareerData);
            const prediction = response.data.prediction;
            userCareerData.prediction = prediction;
          } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'An error occurred while calling the ML microservice' });
          }

        userCareerData.prediction = prediction;
        
        await user.setCareerData(req.uid, userCareerData);
        db.sortedSetAdd('users:career', req.uid, req.uid);
        res.json({});
    } catch (err) {
        console.log(err);
        helpers.noScriptErrors(req, res, err.message, 400);
    }
};
