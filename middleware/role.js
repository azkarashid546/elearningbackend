const { authorizeRoles } = require("./auth");

const adminRole = authorizeRoles(["admin"]);

module.exports = adminRole;