const User = require('../models/User');

const rankingsController = {};

rankingsController.getRankings = async (req, res) => {
    r = await User.find();
    //TO FIX
    return res.status(200).json({ r });
};

module.exports = rankingsController;
