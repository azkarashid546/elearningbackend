const redis = require("../utils/redis");
const User = require("../models/user").default;

// get user by id
const getUserById = async (id, res) => {
  const userJson = await redis.get(id);
  console.log(userJson)
  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(201).json({
      success: true,
      user,
    });
  }
};

// Get All Users
const getAllUsersService = async () => {
  const users = await User.find().sort({ createdAt: -1 });
  return users;
};


// update User Role 

const updateUserRoleService = async (id, role) => {
  try {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw new Error(`Error updating user role: ${error.message}`);
  }
};

module.exports = { getUserById, getAllUsersService, updateUserRoleService };
