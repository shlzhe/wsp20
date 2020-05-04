const functions = require('firebase-functions');
const express = require('express')
const path = require('path')
const app = express()

exports.httpReq = functions.https.onRequest(app);

app.use(express.urlencoded({ extended: false }))
app.use('/public', express.static(path.join(__dirname, '/static')))

//set template engine
app.set('view engine', 'ejs')
//location of ejs files
app.set('views', './ejsviews')

//frontend programming

function frontendHandler(req, res) {
    res.sendFile(path.join(__dirname, '/librarian/librarian.html'))
}

app.get('/login', frontendHandler);
app.get('/logout', frontendHandler)
app.get('/home', frontendHandler);
app.get('/add', frontendHandler);
app.get('/show', frontendHandler);

//backend programming

const session = require('express-session')
app.use(session(
    {
        secret: 'anysecretstring',
        name: '__session',
        saveUninitialized: false,
        resave: false,
        secure: true,
        maxAge: 1000 * 60 * 60 * 2,
        rolling: true,
    }
))

const firebase = require('firebase')

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBUtfYOxG-obasSkho91RhaXYszFzUFh2s",
    authDomain: "renjianl-wsp20.firebaseapp.com",
    databaseURL: "https://renjianl-wsp20.firebaseio.com",
    projectId: "renjianl-wsp20",
    storageBucket: "renjianl-wsp20.appspot.com",
    messagingSenderId: "979888716047",
    appId: "1:979888716047:web:013ddb7e52b0aaef8f267a"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const adminUtil = require('./adminUtil.js')
const Constants = require('./myconstants.js')

app.get('/', auth, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    const coll = firebase.firestore().collection(Constants.COLL_BOOKS)
    try {
        let books = []
        const snapshot = await coll.orderBy("title").get()
        snapshot.forEach(doc => {
            books.push({ bookId: doc.id, data: doc.data() })
        })
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs',
            { error: false, books, user: req.decodedIdToken, iCount, bCount })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs',
            { error: e, user: req.decodedIdToken, iCount, bCount })
    }
})

app.post('/b/book', auth, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    const coll1 = firebase.firestore().collection(Constants.COLL_BOOKS)
    // const coll2 = firebase.firestore().collection(Constants.COLL_BORROWED)
    const bookId = req.body.bookId

    try {
        let books = []
        const snapshot = await coll1.get()
        snapshot.forEach(doc => {
            if (doc.id === bookId) books.push({ bookId: doc.id, data: doc.data() })
        })
        /*if (req.user) {
            var times = 0, qty = 0
            const snapshot2 = await coll2.where("uid", "==", req.user.uid).get()
            snapshot2.forEach(doc => {
                for (let i = 0; i < doc.data().cart.length; i++)
                    if (doc.data().cart[i].product.id === id) {
                        times++
                        qty += parseInt(doc.data().cart[i].qty)
                    }
            })
        }*/
        res.setHeader('Cache-Control', 'private')
        res.render('book.ejs', { books, user: req.decodedIdToken, iCount, bCount })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs', { error: e, user: req.decodedIdToken, iCount, bCount })
    }
})

app.get('/b/about', auth, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    res.setHeader('Cache-Control', 'private')
    res.render('about.ejs', { user: req.decodedIdToken, iCount, bCount })
})

app.get('/b/contact', auth, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    res.setHeader('Cache-Control', 'private')
    res.render('contact.ejs', { user: req.decodedIdToken, iCount, bCount })
})

app.get('/b/signin', async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    res.setHeader('Cache-Control', 'private')
    res.render('signin.ejs', { error: false, user: req.decodedIdToken, iCount, bCount })
})

app.post('/b/signin', async (req, res) => {
    const iCount = await getiCount(req)
    const email = req.body.email
    const password = req.body.password
    const auth = firebase.auth()
    try {
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE)
        const userRecord = await auth.signInWithEmailAndPassword(email, password)
        const idToken = await userRecord.user.getIdToken()
        await auth.signOut()

        req.session.idToken = idToken

        /*if (userRecord.user.email === Constants.SYSADMINEMAIL) {
            res.setHeader('Cache-Control', 'private')
            res.redirect('/admin/sysadmin')
        } else {*/

        if (!req.session.temp) {
            res.setHeader('Cache-Control', 'private')
            res.redirect('/')
        } else {
            req.decodedIdToken = await adminUtil.verifyIdToken(idToken)
            req.session.temp.forEach(async bookId => {
                const data = {
                    uid: req.decodedIdToken.uid,
                    bookId
                }
                await adminUtil.interested(data)
                temp.remove(bookId)
            })
            res.setHeader('Cache-Control', 'private')
            res.redirect('/b/interested')
        }
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.render('signin', { error: e, user: null, iCount })
    }
})

app.get('/b/signout', async (req, res) => {
    const decodedIdToken = await adminUtil.verifyIdToken(req.session.idToken)
    const email = decodedIdToken.email
    console.log("==============^^^^^^^^^^^^^^^^^^" + email)
    req.session.destroy(err => {
        if (err) {
            console.log("=========== session.destroy error: ", err)
            req.session = null
            res.send('Error: sign out (session.destroy error)')
        } else {
            if (email === Constants.LIBRARIANEMAIL) res.redirect("/logout")
            else res.redirect('/')
        }
    })
})

app.get('/b/profile', authAndRedirectSignIn, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    res.setHeader('Cache-Control', 'private')
    res.render('profile', { user: req.decodedIdToken, iCount, bCount })
})

app.get('/b/signup', (req, res) => {
    res.render('signup.ejs', { page: 'signup', user: null, error: false, iCount: 0, bCount: 0 })
})

const TempInterest = require('./model/TempInterest.js')

app.get('/b/interested', authAndRedirectSignIn, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    let interested = []
    try {
        const b = await adminUtil.getInterested(req.decodedIdToken.uid)
        const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
        for (let i = 0; i < b.length; i++) {
            const doc = await collection.doc(b[i].data.bookId).get()
            interested.push({ interestedId: b[i].id, bookId: doc.id, book: doc.data() })
        }
        res.setHeader('Cache-Control', 'private')
        res.render('interested.ejs', { message: false, interested, user: req.decodedIdToken, iCount, bCount })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send('<h1>Interested List Error</h1>' + e)
    }
})

app.post('/b/add2interested', auth, async (req, res) => {
    const bookId = req.body.bookId
    try {
        if (req.decodedIdToken) {
            const data = {
                uid: req.decodedIdToken.uid,
                bookId
            }
            await adminUtil.interested(data)
        } else {
            if (!req.session.temp) {
                // first time add to list
                temp = new TempInterest()
            } else {
                temp = TempInterest.deserialize(req.session.temp)
            }
            temp.add(bookId)
            req.session.temp = temp.serialize(temp)
        }
        res.setHeader('Cache-Control', 'private')
        res.redirect('/')
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send(e)
    }
})

app.post('/b/remove', async (req, res) => {
    const bookId = req.body.bookId
    const interestedId = req.body.interestedId
    try {
        await adminUtil.uninterested(interestedId)
        res.setHeader('Cache-Control', 'private')
        res.redirect('/b/interested')
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send(JSON.stringify(e))
    }
})

app.get('/b/borrowed', authAndRedirectSignIn, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    let borrowed = []
    try {
        const b = await adminUtil.getBorrowed(req.decodedIdToken)
        const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
        for (let i = 0; i < b.length; i++) {
            const doc = await collection.doc(b[i].data.bookId).get()
            const duedate = b[i].data.duedate.toDate()
            borrowed.push({
                borrowId: b[i].id, bookId: doc.id, book: doc.data(), duedate,
                late: new Date().getTime() - duedate.getTime() > 0 ? true : false
            })
        }
        res.setHeader('Cache-Control', 'private')
        res.render('borrowed.ejs', { message: false, borrowed, user: req.decodedIdToken, iCount, bCount })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send('<h1>Borrowed List Error</h1>' + e)
    }
})

app.post('/b/borrow', authAndRedirectSignIn, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    const bookId = req.body.bookId
    const interestedId = req.body.interestedId
    const tdate = new Date()
    const duedate = firebase.firestore.Timestamp.fromMillis(tdate.setDate(tdate.getDate() + 2)).toDate()
    let toBorrow = []
    try {
        const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
        const doc = await collection.doc(bookId).get()
        toBorrow.push({ interestedId, bookId: doc.id, data: doc.data(), duedate })
        res.setHeader('Cache-Control', 'private')
        res.render('borrow.ejs', { message: false, books: toBorrow, user: req.decodedIdToken, iCount, bCount })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send("Failed to borrow" + e)
    }
})

app.post('/b/confirmborrow', authAndRedirectSignIn, async (req, res) => {
    const bookId = req.body.bookId
    const interestedId = req.body.interestedId
    try {
        const data = {
            uid: req.decodedIdToken.uid,
            bookId
        }
        await adminUtil.borrow(bookId, data)
        await adminUtil.uninterested(interestedId)
        res.setHeader('Cache-Control', 'private')
        res.redirect('/b/borrowed')
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send("Failed to borrow" + e)
    }
})

app.post('/b/return', authAndRedirectSignIn, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    const bookId = req.body.bookId
    const borrowId = req.body.borrowId
    //const duedate = req.body.duedate
    const tdate = new Date()
    const currentdate = firebase.firestore.Timestamp.fromMillis(tdate.setDate(tdate.getDate() + 4)).toDate()
    let toReturn = []
    try {
        const borrowed = firebase.firestore().collection(Constants.COLL_BORROWED)
        const bdoc = await borrowed.doc(borrowId).get()
        const duedate = bdoc.data().duedate.toDate()
        const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
        const doc = await collection.doc(bookId).get()
        toReturn.push({
            borrowId, bookId: doc.id, data: doc.data(), duedate, currentdate,
            difference: Math.ceil((currentdate.getTime() - duedate.getTime()) / (1000 * 60 * 60 * 24))
        })
        res.setHeader('Cache-Control', 'private')
        res.render('return.ejs', { message: false, books: toReturn, user: req.decodedIdToken, iCount, bCount })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send("Failed to return " + e)
    }
})

app.post('/b/confirmreturn', authAndRedirectSignIn, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    const bookId = req.body.bookId
    const borrowId = req.body.borrowId
    let borrowed = []
    try {
        await adminUtil.unborrow(bookId, borrowId)
        res.setHeader('Cache-Control', 'private')
        res.redirect('/b/borrowed')
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        return res.render('borrowed.ejs',
            { message: 'Return Failed. Try Again Later!', borrowed, user: req.decodedIdToken, iCount, bCount }
        )
    }
})

app.post('/b/waitlist', auth, async (req, res) => {
    const bookId = req.body.bookId
    try {
        const data = {
            uid: req.decodedIdToken.uid,
            bookId
        }
        await adminUtil.waitlist(data)
        res.setHeader('Cache-Control', 'private')
        res.redirect('/b/interested')
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send(e)
    }
})

//middleware
async function authAndRedirectSignIn(req, res, next) {
    try {
        const decodedIdToken = await adminUtil.verifyIdToken(req.session.idToken)
        if (decodedIdToken.uid) {
            req.decodedIdToken = decodedIdToken
            return next()
        }
    } catch (e) {
        console.log("========= authAndRedirect error", e)
    }

    res.setHeader('Cache-Control', 'private')
    return res.redirect('/b/signin')
}

async function auth(req, res, next) {
    try {
        if (req.session && req.session.idToken) {
            const decodedIdToken = await adminUtil.verifyIdToken(req.session.idToken)
            req.decodedIdToken = decodedIdToken
        } else {
            req.decodedIdToken = null
        }
    } catch (e) {
        req.decodedIdToken = null
    }
    next()
}

//adminapi
app.post('/admin/signup', (req, res) => {
    return adminUtil.createUser(req, res)
})

app.get('/admin/sysadmin', authSysAdmin, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    res.render('admin/sysadmin.ejs', { user: req.decodedIdToken, iCount, bCount })
})

app.get('/admin/listUsers', authSysAdmin, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    return adminUtil.listUsers(req, res)
})

async function authSysAdmin(req, res, next) {
    try {
        const decodedIdToken = await adminUtil.verifyIdToken(req.session.idToken)
        if (!decodedIdToken || !decodedIdToken.email || decodedIdToken.email !== Constants.SYSADMINEMAIL) {
            return res.send('<h1>System Admin Page: Access Denied!</h1>')
        }
        if (decodedIdToken.uid) {
            req.decodedIdToken = decodedIdToken
            return next()
        }
        return res.send('<h1>System Admin Page: Access Denied!</h1>')
    } catch (e) {
        return res.send('<h1>System Admin Page: Access Denied!</h1>')
    }
}

// test code
app.get('/testlogin', (req, res) => {
    res.sendFile(path.join(__dirname, '/static/html/login.html'))
})

app.post('/testsignIn', (req, res) => {
    const email = req.body.email
    const password = req.body.pass
    // let page = `
    //     (POST) You entered: ${email} and ${password}
    // `
    // res.send(page)
    const obj = {
        a: email,
        b: password,
        c: '<h1>login success</h1>',
        d: '<h1>login success</h1>',
        start: 1,
        end: 10,
    }
    res.render('home', obj)
})

app.get('/testsignIn', (req, res) => {
    const email = req.query.email
    const password = req.query.pass
    let page = `
        You entered: ${email} and ${password}
    `
    res.send(page)
})

app.get('/test', (req, res) => {
    const time = new Date().toString()
    let page = `
        <h1>Current Time at Server: ${time}</h1>    
    `
    res.header('refresh', 1)
    res.send(page)
})

app.get('/test2', (req, res) => {
    res.redirect('http://www.uco.edu')
})

async function getiCount(req) {
    if (!req.decodedIdToken) {
        iCount = req.session.temp ? req.session.temp.length : 0
        return iCount
    } else {
        try {
            const b = await adminUtil.getInterested(req.decodedIdToken.uid)
            return b.length
        } catch (e) {
            return 0
        }
    }
}

async function getbCount(req) {
    try {
        const b = await adminUtil.getBorrowed(req.decodedIdToken)
        return b.length
    } catch (e) {
        return 0
    }
}