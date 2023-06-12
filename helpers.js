// Lookup helper which returns the user object (nested within 'users') if the provided email address is found within it
// This is referred to as "getUserByEmail" function in compass
const userIdLookup = function(userEmail, userRecords) {
  for (const user in userRecords) {
    if (userRecords[user].email === userEmail) {
      return userRecords[user];
    }
  }
  return null;
};

module.exports = { userIdLookup };
