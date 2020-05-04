var admin = require("firebase-admin");
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

var serviceAccount = require("./renjianl-wsp20-firebase-adminsdk-hoq0l-85a8204f99.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://renjianl-wsp20.firebaseio.com"
});

// var transporter = nodemailer.createTransport({
//     host: 'smtp.sendgrid.net',
//     port: 465,
//     secure: true,
//     auth: {
//         user: 'apikey',
//         pass: 'asdasd123'
//     }
// });

// function sendEmail(toemail, msg) {
//     const mailOptions = {
//         from: `softauthor1@gmail.com`,
//         to: snap.data().email,
//         subject: 'contact form message',
//         html: `<h1>Order Confirmation</h1>
//      <p> <b>Email: </b>${snap.data().email} </p>`
//     };

//     return transporter.sendMail(mailOptions, (error, data) => {
//         if (error) {
//             console.log(error)
//             return
//         }
//         console.log("Sent!")
//     });
// }

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

async function listUsers(req, res, iCount, bCount) {
    try {
        const userRecords = await admin.auth().listUsers()
        res.render('admin/listUsers.ejs', {
            user: req.decodedIdToken, users: userRecords.users, error: false,
            iCount, bCount
        })
    } catch (e) {
        res.render('admin/listUsers.ejs', {
            user: req.decodedIdToken, users: false, error: false,
            iCount, bCount
        })
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

async function getInterested(uid) {
    try {
        const collection = admin.firestore().collection(Constants.COLL_INTERESTED)
        let interested = []
        const snapshot = await collection.where("uid", "==", uid).orderBy("timestamp").get()
        snapshot.forEach(doc => {
            interested.push({ id: doc.id, data: doc.data() })
        })
        return interested
    } catch (e) {
        return null
    }
}

async function interested(data) {
    const tdate = new Date()
    data.timestamp = admin.firestore.Timestamp.fromMillis(tdate.setDate(tdate.getDate() + 0))
    try {
        let found = false
        const interested = await getInterested(data.uid)
        interested.forEach(i => {
            if (i.data.bookId === data.bookId) {
                found = true
            }
        })
        if (!found) {
            const collection = admin.firestore().collection(Constants.COLL_INTERESTED)
            await collection.doc().set(data)
        }
    } catch (e) {
        console.log("================" + e)
        throw e
    }
}

async function uninterested(interestedId) {
    try {
        const collection = admin.firestore().collection(Constants.COLL_INTERESTED)
        await collection.doc(interestedId).delete()
    } catch (e) {
        throw e
    }
}

async function getWaitlist(uid) {
    try {
        const collection = admin.firestore().collection(Constants.COLL_WAITLIST)
        let waitlist = []
        const snapshot = await collection.where("uid", "==", uid).orderBy("timestamp").get()
        snapshot.forEach(doc => {
            waitlist.push({ id: doc.id, data: doc.data() })
        })
        return waitlist
    } catch (e) {
        console.log("================" + e)
        return null
    }
}

async function waitlist(data) {
    const tdate = new Date()
    data.timestamp = admin.firestore.Timestamp.fromMillis(tdate.setDate(tdate.getDate() + 0))
    try {
        let found = false
        const waitlist = await getWaitlist(data.uid)
        waitlist.forEach(i => {
            if (i.data.bookId === data.bookId) {
                found = true
            }
        })
        if (!found) {
            const collection = admin.firestore().collection(Constants.COLL_WAITLIST)
            await collection.doc().set(data)
        }
    } catch (e) {
        console.log("================" + e)
        throw e
    }
}

async function getBorrowed(decodedIdToken) {
    try {
        const collection = admin.firestore().collection(Constants.COLL_BORROWED)
        let borrowed = []
        const snapshot = await collection.where("uid", "==", decodedIdToken.uid).orderBy("timestamp").get()
        snapshot.forEach(doc => {
            borrowed.push({ id: doc.id, data: doc.data() })
        })
        return borrowed
    } catch (e) {
        return null
    }
}

async function borrow(bookId, data) {
    const tdate = new Date()
    data.timestamp = admin.firestore.Timestamp.fromMillis(tdate.setDate(tdate.getDate() + 0))
    data.duedate = admin.firestore.Timestamp.fromMillis(tdate.setDate(tdate.getDate() + 2))

    try {
        const books = admin.firestore().collection(Constants.COLL_BOOKS)
        await books.doc(bookId).update({ status: Constants.STATUS_UNAVAILABLE })

        const collection = admin.firestore().collection(Constants.COLL_BORROWED)
        await collection.doc().set(data)
    } catch (e) {
        throw e
    }
}

async function unborrow(bookId, borrowId) {
    try {
        const books = admin.firestore().collection(Constants.COLL_BOOKS)
        await books.doc(bookId).update({ status: Constants.STATUS_AVAILABLE })

        const collection = admin.firestore().collection(Constants.COLL_BORROWED)
        await collection.doc(borrowId).delete()
    } catch (e) {
        console.log("===========================", e)
        throw e
    }
}

module.exports = {
    createUser,
    listUsers,
    verifyIdToken,
    getInterested,
    interested,
    uninterested,
    getBorrowed,
    borrow,
    unborrow,
    getWaitlist,
    waitlist
}