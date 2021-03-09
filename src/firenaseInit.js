var admin = require("firebase-admin");

var serviceAccount = require("../sa.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://paitum.firebaseio.com"
});

module.exports = admin;