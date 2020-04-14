var admin = require("firebase-admin");

var serviceAccount = require("./renjianl-wsp20-firebase-adminsdk-hoq0l-85a8204f99.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://renjianl-wsp20.firebaseio.com"
});

const Constants = require('./myconstants.js')

async function createUser(req, res) {
    const email = req.body.email
    const password = req.body.password
    const displayName = req.body.displayName
    const phoneNumber = req.body.phoneNumber
    const photoURL = req.body.photoURL

    try {
        await admin.auth().createUser(
            { email, password, displayName, phoneNumber, photoURL }
        )
        res.render('signin.ejs', { page: 'signin', user: false, error: 'Account created: Sign in please', cartCount: 0 })
    } catch (e) {
        console.log(JSON.stringify(e))
        res.render('signup.ejs', { error: e, user: false, page: 'signup', cartCount: 0 })
    }
}

async function listUsers(req, res) {
    try {
        const userRecords = await admin.auth().listUsers()
        res.render('admin/listUsers.ejs', { users: userRecords.users, error: false })
    } catch (e) {
        res.render('admin/listUsers.ejs', { users: false, error: false })
    }
}

async function verifyIdToken(idToken) {
    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken)
        return decodedIdToken
    } catch (e) {
        return null
    }
}

async function getOrderHistory(decodedIdToken) {
    try {
        const collection = admin.firestore().collection(Constants.COLL_ORDERS)
        let orders = []
        const snapshot = await collection.where("uid", "==", decodedIdToken.uid).orderBy("timestamp").get()
        snapshot.forEach(doc => {
            orders.push(doc.data())
        })
        return orders
    } catch (e) {
        return null
    }
}

async function checkOut(data) {
    data.timestamp = admin.firestore.Timestamp.fromDate(new Date())
    try {
        const collection = admin.firestore().collection(Constants.COLL_ORDERS)
        await collection.doc().set(data)
    } catch (e) {
        throw e
    }
}

module.exports = {
    createUser,
    listUsers,
    verifyIdToken,
    getOrderHistory,
    checkOut
}