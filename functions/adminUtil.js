const admin = require("firebase-admin");
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

var serviceAccount = require("./renjianl-wsp20-firebase-adminsdk-hoq0l-85a8204f99.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://renjianl-wsp20.firebaseio.com"
});

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'wsp20library@gmail.com',
        pass: 'wsplibrary20'
    }
});

function sendEmail(to, msg, title, image, date, duedate, latefee) {

    var mailOptions = {
        from: `no-reply@wsp20.com`,
        to,
        subject: '',
        html: ``,
    };

    if (msg === "return") {
        mailOptions = {
            from: `no-reply@wsp20.com`,
            to,
            subject: 'Book Return Confirmation',
            html: `
                <head>
                <h4>${date}</h4>
                <h2>This email verifies that you have successfully returned: </h2><br>
                </head>
                <body>
                <img src="${image}" width="170"/>
                <h3>Title: ${title} </h3>
                </body>`
        };
    }

    else if (msg === "returnlate") {
        mailOptions = {
            from: `no-reply@wsp20.com`,
            to,
            subject: 'LATE - Book Return Confirmation',
            html: `
                <head>
                <h4>${date}</h4>
                <h2>This email verifies that you have returned a book late </h2><br>
                <h3>You have been charged $${latefee} to your account!</h3>
                <h3>Due date: ${duedate} </h3>
                </head>
                <body>
                <img src="${image}" width="170"/>
                <h3>Title: ${title} </h3>
                </body>`
        };
    }

    else if (msg === "borrow") {
        mailOptions = {
            from: `no-reply@wsp20.com`,
            to,
            subject: 'Book Borrow Confirmation',
            html: `
                <head>
                <h4>${date}</h4>
                <h2>This email verifies that you have successfully borrowed: </h2><br>
                </head>
                <body>
                <img src="${image}" width="170"/>
                <h3>Title: ${title} </h3>
                <h3>Due date: ${duedate} </h3>
                </body>`
        };
    }

    else if (msg === "lost") {
        mailOptions = {
            from: `no-reply@wsp20.com`,
            to,
            subject: 'LOST - Book Return Confirmation',
            html: `
                <head>
                <h4>${date}</h4>
                <h2>This email verifies that you reported the loss of a book: </h2><br>
                <h3>You have been charged $${latefee} to your account!</h3>
                </head>
                <body>
                <img src="${image}" width="170"/>
                <h3>Title: ${title} </h3>
                </body>`
        };
    }

    else if (msg === "admin") {
        console.log("SENDING ++++++++++++++++++++ admin")
        mailOptions = {
            from: `no-reply@wsp20.com`,
            to,
            subject: 'Message from System Admin',
            html: `
                <head>
                <h2>This message is from System Admin of wsp20library: </h2><br>
                </head>
                <body>
                <h3>${title} </h3>
                </body>`
        };
    }

    else if (msg === "waitlist") {
        mailOptions = {
            from: `no-reply@wsp20.com`,
            to,
            subject: 'Borrow Waitlisted Book',
            html: `
                <head>
                <h4>${date}</h4>
                <h2>This email is to inform you that you are next in line to borrow: </h2><br>
                </head>
                <body>
                <img src="${image}" width="170"/>
                <h3>Title: ${title} </h3><br>
                <h2>Please log on to https://renjianl-wsp20.web.app to borrow the book</h2>
                </body>`
        };
    }

    return transporter.sendMail(mailOptions, (error, data) => {
        if (error) {
            console.log("======================", error)
            return
        }
        console.log(data);
        // return res.send(`Email Sent! ${data}`);
    });
}

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
        res.render('signin.ejs', { page: 'signin', user: false, error: 'Account created: Sign in please', iCount: 0, bCount: 0 })
    } catch (e) {
        console.log(JSON.stringify(e))
        res.render('signup.ejs', { error: e, user: false, page: 'signup', iCount: 0, bCount: 0 })
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

async function waitlist(uid, bookId) {
    try {
        console.log(uid, "^^^^^^^^^^^^^^^^^^", bookId)
        const books = admin.firestore().collection(Constants.COLL_BOOKS)
        book = await books.doc(bookId).get()
        fullwaitlist = book.data().waitlist
        if (fullwaitlist) fullwaitlist.push(uid)
        else fullwaitlist = [uid]
        await books.doc(bookId).update({ waitlist: fullwaitlist })
    } catch (e) {
        console.log("===========================", e)
        throw e
    }
}

async function unwaitlist(uid, bookId) {
    try {
        console.log(uid, "^^^^^^^^^^^^^^^^^^", bookId)
        const books = admin.firestore().collection(Constants.COLL_BOOKS)
        book = await books.doc(bookId).get()
        fullwaitlist = book.data().waitlist
        if (fullwaitlist) {
            fullwaitlist.forEach(item => {
                if (item === uid) fullwaitlist.splice(fullwaitlist.indexOf(item), 1)
            })
            await books.doc(bookId).update({ waitlist: fullwaitlist })
        }
        else {
            console.log("==================FAILED TO UNWAITLIST")
        }
    } catch (e) {
        console.log("===========================", e)
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
    data.duedate = admin.firestore.Timestamp.fromMillis(tdate.setDate(tdate.getDate() + parseInt(Constants.SETTINGS.DURATION)))

    try {
        const books = admin.firestore().collection(Constants.COLL_BOOKS)
        const book = await books.doc(bookId).get()
        if (book.data().status !== Constants.STATUS_AVAILABLE && (!book.data().waitlist || book.data().waitlist[0] !== data.uid)) {
            return false
        }
        await books.doc(bookId).update({ status: Constants.STATUS_UNAVAILABLE })

        const collection = admin.firestore().collection(Constants.COLL_BORROWED)
        await collection.doc().set(data)

        return true
    } catch (e) {
        throw e
    }
}

async function unborrow(bookId, borrowId, msg, title, image_url, date) {
    try {
        const books = admin.firestore().collection(Constants.COLL_BOOKS)
        await books.doc(bookId).update({ status: Constants.STATUS_WAITLISTED })

        const collection = admin.firestore().collection(Constants.COLL_BORROWED)
        await collection.doc(borrowId).delete()
        book = await books.doc(bookId).get()
        fullwaitlist = book.data().waitlist

        if (!fullwaitlist || fullwaitlist.length === 0) {
            await books.doc(bookId).update({ status: Constants.STATUS_AVAILABLE })
        }
        else {
            userRecord = await admin.auth().getUser(fullwaitlist[0])
            to = userRecord.email
            sendEmail(to, msg, title, image_url, date)

            var waitlistInterval = setInterval(async () => {
                fullwaitlist.splice(0, 1)
                console.log("===========================timesup")
                if (fullwaitlist.length === 0) {
                    await books.doc(bookId).update({ status: Constants.STATUS_AVAILABLE })
                    clearInterval(waitlistInterval)
                    return
                }
                book = await books.doc(bookId).get()
                fullwaitlist = book.data().waitlist
                userRecord = await admin.auth().getUser(fullwaitlist[0])
                to = userRecord.email
                sendEmail(to, msg, title, image_url, date)
                await books.doc(bookId).update({ waitlist: fullwaitlist })
            }, 1000 * 60 * parseInt(Constants.SETTINGS.WAITLIST))
        }
    } catch (e) {
        console.log("===========================", e)
        throw e
    }
}

async function review(bookId, rating) {
    if (rating < 1 || rating > 5) return
    try {
        console.log(bookId, "^^^^^^^^^^^^^^^^^^", rating)
        const books = admin.firestore().collection(Constants.COLL_BOOKS)
        book = await books.doc(bookId).get()
        totalrating = book.data().rating
        if (totalrating) totalrating.push(rating)
        else totalrating = [rating]
        await books.doc(bookId).update({ rating: totalrating })
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
    sendEmail,
    getWaitlist,
    waitlist,
    unwaitlist,
    review,
}