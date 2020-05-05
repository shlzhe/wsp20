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
    // const page = req.body.page

    try {
        let books = []
        const snapshot = await coll.orderBy("title").get()

        snapshot.forEach(doc => {
            books.push({ bookId: doc.id, data: doc.data() })
        })
        // let last = snapshot.docs[snapshot.docs.length - 1]
        // let lastDoc = last.data().title
        // console.log('lastDoc+=================', lastDoc)
        // books = books.slice(0,2)
        // console.log("====================",books)
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs',
            { error: false, books, user: req.decodedIdToken, iCount, bCount})
    }
    catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs',
            { error: e, user: req.decodedIdToken, iCount, bCount })
        console.log("/erorr+++++++++++++++++++++++", e)
    }
})

app.post('/', auth, async (req, res) => {
    const query = req.body.query
    const sortBy = req.body.sortBy
    const order = req.body.order;
    const search = req.body.search
    // const page = req.body.page
    // const lastDoc = req.body.lastDoc

    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    const coll = firebase.firestore().collection(Constants.COLL_BOOKS)

    if (query === "sort") {
        try {
            let books = []
            const snapshot = await coll.orderBy(sortBy, order).get()
            snapshot.forEach(doc => {
                books.push({ id: doc.id, data: doc.data() })
            })
            res.setHeader('Cache-Control', 'private')
            res.render('storefront.ejs', { error: false, books, user: req.decodedIdToken, iCount, bCount })
        } catch (e) {   
            res.setHeader('Cache-Control', 'private')
            res.render('storefront.ejs', { error: e, user: req.decodedIdToken, iCount, bCount })
        }
    }
    else if (query === "search") {
        try {
            let books = []
            console.log("search: ================", search)
            const snapshot = await coll.where("title", '>=', search).where("title", '<=', search + '\uf8ff').get()
            const snapshot2 = await coll.where("author", '>=', search).where("author", '<=', search + '\uf8ff').get()
            const snapshot3 = await coll.where("isbn", '==', parseInt(search)).get()
            snapshot.forEach(doc => {
                books.push({ id: doc.id, data: doc.data() })
            })
            snapshot2.forEach(doc => {
                books.push({ id: doc.id, data: doc.data() })
            })
            snapshot3.forEach(doc => {
                books.push({ id: doc.id, data: doc.data() })
            })
            res.setHeader('Cache-Control', 'private')
            res.render('storefront.ejs', { error: false, books, user: req.decodedIdToken, iCount, bCount })
        } catch (e) {
            console.log('++++++++++=', e)
            res.setHeader('Cache-Control', 'private')
            res.render('storefront.ejs', { error: e, user: req.decodedIdToken, iCount, bCount })
        }
    }

//     if(page === "previous") {
//         try {
//             let books = []
//             // const osnapshot = await coll.orderBy("title").get()
//             let lastDoc = req.body.lastDoc -1 
//             // let last= osnapshot.docs[osnapshot.docs.length - 1]
//             // lastDoc = last.data().title
//             const snapshot = await coll.orderBy("title").startAt(lastDoc).limit(2).get()
            

//             snapshot.forEach(doc => {
//                 books.push({ bookId: doc.id, data: doc.data() })
//             })
//             console.log("lastDoc====================",)
//             res.setHeader('Cache-Control', 'private')
//             res.render('storefront.ejs',
//                 { error: false, books, user: req.decodedIdToken, iCount, bCount, lastDoc })
//         } 
//         catch (e) {
//             res.setHeader('Cache-Control', 'private')
//             res.render('storefront.ejs',
//                 { error: e, user: req.decodedIdToken, iCount, bCount, lastDoc })
//                 console.log("prev error=========", e)
//         }
//     }
    
//     else if(page === "next") {
//         try {
//             let books = []
//             let lastDoc = req.body.lastDoc
//             const snapshot = await coll.orderBy("title").startAfter(lastDoc).limit(2).get()

//             let last= snapshot.docs[snapshot.docs.length - 1]
//             lastDoc = last.data().title

//             snapshot.forEach(doc => {
//                 books.push({ bookId: doc.id, data: doc.data() })
//             })
            
//             console.log("====================",lastDoc)
//             res.setHeader('Cache-Control', 'private')
//             res.render('storefront.ejs',
//                 { error: false, books, user: req.decodedIdToken, iCount, bCount, lastDoc})
//         } 
//         catch (e) {
//             res.setHeader('Cache-Control', 'private')
//             res.render('storefront.ejs',
//                 { error: e, user: req.decodedIdToken, iCount, bCount, lastDoc})
//             console.log("next error=========", e)
//         }
//     }
})

app.post('/b/book', auth, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    const coll1 = firebase.firestore().collection(Constants.COLL_BOOKS)
    const bookId = req.body.bookId

    try {
        let books = []
        const snapshot = await coll1.get()
        snapshot.forEach(doc => {
            if (doc.id === bookId) {
                avgRating = getAverage(doc.data().rating)
                books.push({ bookId: doc.id, data: doc.data(), avgRating })
            }
        })
        res.setHeader('Cache-Control', 'private')
        res.render('book.ejs', { books, user: req.decodedIdToken, iCount, bCount })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        console.log("&&&&&&&&&&&&&&&&", e)
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

app.post('/b/contact', auth, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    try {
        await adminUtil.sendEmail('sting7@uco.edu')
        res.setHeader('Cache-Control', 'private')
        res.render('contact.ejs', { user: req.decodedIdToken, iCount, bCount })
    }
    catch (e) {
        console.log(e)
        res.send("Email error" + e)
    }
})

app.get('/b/signin', async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    res.setHeader('Cache-Control', 'private')
    res.render('signin.ejs', { error: false, user: req.decodedIdToken, iCount, bCount })
})

app.post('/b/signin', async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
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
        res.render('signin', { error: e, user: null, iCount, bCount })
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
        const m = await adminUtil.getBorrowed(req.decodedIdToken)
        const maxed = m.length >= Constants.SETTINGS.BOOKCOUNT ? true : false
        const b = await adminUtil.getInterested(req.decodedIdToken.uid)
        const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
        const snapshot = await collection.get()
        snapshot.forEach(doc => {
            for (let i = 0; i < b.length; i++) {
                if (b[i].data.bookId === doc.id)
                    interested.push({ interestedId: b[i].id, bookId: doc.id, book: doc.data() })
            }
        })
        /*for (let i = 0; i < b.length; i++) {
            const doc = await collection.doc(b[i].data.bookId).get()
            interested.push({ interestedId: b[i].id, bookId: doc.id, book: doc.data() })
        }*/
        res.setHeader('Cache-Control', 'private')
        res.render('interested.ejs', { message: false, interested, user: req.decodedIdToken, iCount, bCount, maxed })
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

app.post('/b/remove', authAndRedirectSignIn, async (req, res) => {
    const bookId = req.body.bookId
    const interestedId = req.body.interestedId
    try {
        await adminUtil.uninterested(interestedId)
        await adminUtil.unwaitlist(req.decodedIdToken.uid, bookId)
        res.setHeader('Cache-Control', 'private')
        res.redirect('/b/interested')
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        console.log("===========================", e)
        res.send(JSON.stringify(e))
    }
})

app.get('/b/borrowed', authAndRedirectSignIn, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    const tdate = new Date()
    const ddate = tdate.setDate(tdate.getDate() + parseInt(Constants.SETTINGS.FASTFORWARD))
    const curdate = firebase.firestore.Timestamp.fromMillis(ddate).toDate()
    let borrowed = []
    try {
        const b = await adminUtil.getBorrowed(req.decodedIdToken)
        const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
        const snapshot = await collection.get()
        snapshot.forEach(doc => {
            for (let i = 0; i < b.length; i++) {
                if (b[i].data.bookId === doc.id) {
                    const duedate = b[i].data.duedate.toDate()
                    borrowed.push({
                        borrowId: b[i].id, bookId: doc.id, book: doc.data(), duedate,
                        late: curdate.getTime() - duedate.getTime() > 0 ? true : false
                        //late: new Date().getTime() - duedate.getTime() > 0 ? true : false
                    })
                }
            }
        })
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
    const ddate = tdate.setDate(tdate.getDate() + parseInt(Constants.SETTINGS.DURATION))
    const duedate = firebase.firestore.Timestamp.fromMillis(ddate).toDate()
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
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    const bookId = req.body.bookId
    const title = req.body.title
    const duedate = req.body.duedate
    const tdate = new Date()
    const date = firebase.firestore.Timestamp.fromMillis(tdate.setDate(tdate.getDate())).toDate()
    const msg = req.body.msg
    const interestedId = req.body.interestedId
    try {
        const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
        const doc = await collection.doc(bookId).get()
        const image = doc.data().image_url
        const data = {
            uid: req.decodedIdToken.uid,
            bookId
        }
        avail = await adminUtil.borrow(bookId, data)
        if (!avail) {
            const message = "Book is currently unavailable. Waitlist to get notified when it is available"
            const m = await adminUtil.getBorrowed(req.decodedIdToken)
            const maxed = m.length >= Constants.SETTINGS.BOOKCOUNT ? true : false
            let interested = []
            const b = await adminUtil.getInterested(req.decodedIdToken.uid)
            const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
            const snapshot = await collection.get()
            snapshot.forEach(doc => {
                for (let i = 0; i < b.length; i++) {
                    if (b[i].data.bookId === doc.id)
                        interested.push({ interestedId: b[i].id, bookId: doc.id, book: doc.data() })
                }
            })
            res.setHeader('Cache-Control', 'private')
            res.render('interested.ejs', { message, interested, user: req.decodedIdToken, iCount, bCount, maxed })
        } else {
            adminUtil.sendEmail(req.decodedIdToken.email, msg, title, image, date, duedate, null)
            await adminUtil.uninterested(interestedId)
            await adminUtil.unwaitlist(req.decodedIdToken.uid, bookId)
            res.setHeader('Cache-Control', 'private')
            res.redirect('/b/borrowed')
        }
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
    const ddate = tdate.setDate(tdate.getDate() + parseInt(Constants.SETTINGS.FASTFORWARD))
    const currentdate = firebase.firestore.Timestamp.fromMillis(ddate).toDate()
    const latefee = Constants.SETTINGS.LATEFEE
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
        res.render('return.ejs', { message: false, books: toReturn, user: req.decodedIdToken, iCount, bCount, latefee })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send("Failed to return " + e)
    }
})

app.post('/b/review', authAndRedirectSignIn, async (req, res) => {
    const iCount = await getiCount(req)
    const title = req.body.title
    const tdate = new Date()
    const date = firebase.firestore.Timestamp.fromMillis(tdate.setDate(tdate.getDate())).toDate()
    const image_url = req.body.image_url
    const bookId = req.body.bookId
    const borrowId = req.body.borrowId
    const msg = req.body.msg
    const latefee = req.body.latefee
    const duedate = req.body.duedate
    try { 
        await adminUtil.unborrow(bookId, borrowId, msg, title, image_url, date)
        await adminUtil.sendEmail(req.decodedIdToken.email, msg, title, image_url, date, duedate, latefee)
        const bCount = await getbCount(req) // bCount updated because of return
        res.setHeader('Cache-Control', 'private')
        return res.render('review.ejs', { image_url, title, bookId, borrowId, user: req.decodedIdToken, iCount, bCount })
    } catch (e) {
        console.log('++++++++++++++++++++', e)
        res.setHeader('Cache-Control', 'private')
        return res.render('borrowed.ejs',
            { message: 'Return Failed. Try Again Later!', borrowed, user: req.decodedIdToken, iCount, bCount }
        )
    }
})

app.post('/b/confirmreturn', authAndRedirectSignIn, async (req, res) => {
    const bookId = req.body.bookId
    const rating = req.body.rating
    try {
        await adminUtil.review(bookId, rating)
        res.setHeader('Cache-Control', 'private')
        res.redirect('/b/borrowed')
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send("Failed to Review " + e)
    }
})

app.post('/b/waitlist', authAndRedirectSignIn, async (req, res) => {
    const bookId = req.body.bookId
    try {
        /*const data = {
            uid: req.decodedIdToken.uid,
            bookId
        }
        await adminUtil.waitlist(data)*/
        await adminUtil.waitlist(req.decodedIdToken.uid, bookId)
        res.setHeader('Cache-Control', 'private')
        res.redirect('/b/interested')
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send(e)
    }
})

app.post('/b/lost', authAndRedirectSignIn, async (req, res) => {
    const iCount = await getiCount(req)
    const image_url = req.body.image_url
    const title = req.body.title
    const tdate = new Date()
    const date = firebase.firestore.Timestamp.fromMillis(tdate.setDate(tdate.getDate())).toDate()
    const ddate = tdate.setDate(tdate.getDate() + parseInt(Constants.SETTINGS.FASTFORWARD))
    const curdate = firebase.firestore.Timestamp.fromMillis(ddate).toDate()
    const bookId = req.body.bookId
    const borrowId = req.body.borrowId
    const msg = req.body.msg
    const latefee = parseInt(req.body.latefee) + 300
    try {
        await adminUtil.unborrow(bookId, borrowId)
        await adminUtil.sendEmail(req.decodedIdToken.email, msg, title, image_url, date, null, latefee)
        const bCount = await getbCount(req) // bCount updated because of return
        const b = await adminUtil.getBorrowed(req.decodedIdToken)
        const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
        const snapshot = await collection.get()
        let borrowed = []
        snapshot.forEach(doc => {
            for (let i = 0; i < b.length; i++) {
                if (b[i].data.bookId === doc.id) {
                    const duedate = b[i].data.duedate.toDate()
                    borrowed.push({
                        borrowId: b[i].id, bookId: doc.id, book: doc.data(), duedate,
                        late: curdate.getTime() - duedate.getTime() > 0 ? true : false
                        //late: new Date().getTime() - duedate.getTime() > 0 ? true : false
                    })
                }
            }
        })
        res.setHeader('Cache-Control', 'private')
        return res.render('borrowed.ejs', { message: "Reported loss, charged $300 + late fees", borrowed, user: req.decodedIdToken, iCount, bCount })
    } catch (e) {
        console.log('++++++++++++++++++++', e)
        res.setHeader('Cache-Control', 'private')
        return res.render('borrowed.ejs',
            { message: 'Return Failed. Try Again Later!', borrowed, user: req.decodedIdToken, iCount, bCount }
        )
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
    const settings = Constants.SETTINGS
    res.render('admin/sysadmin.ejs', { message: false, user: req.decodedIdToken, iCount, bCount, settings })
})

app.get('/admin/listUsers', authSysAdmin, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    return adminUtil.listUsers(req, res)
})

app.post('/admin/sysadmin', authSysAdmin, async (req, res) => {
    const iCount = await getiCount(req)
    const bCount = await getbCount(req)
    const s1 = req.body.s1
    const s2 = req.body.s2
    const s3 = req.body.s3
    const s4 = req.body.s4
    const s5 = req.body.s5
    Constants.SETTINGS = { BOOKCOUNT: s1, DURATION: s2, FASTFORWARD: s3, LATEFEE: s4, WAITLIST: s5 }
    const settings = Constants.SETTINGS
    res.render('admin/sysadmin.ejs', { message: "Updated Successfully!", user: req.decodedIdToken, iCount, bCount, settings })
})

app.post('/admin/email', authSysAdmin, async (req, res) => {
    console.log(req.body.to)
    console.log(req.body.content)
    adminUtil.sendEmail(req.body.to, "admin", req.body.content, null, null, null, null)
    res.redirect('/admin/listUsers')
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

app.get('/test3', (req, res) => {
    res.render('test.ejs')
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

function getAverage(array) {
    if (!array) return "No reviews yet"
    let total = 0
    array.forEach(element => {
        total += parseInt(element)
    });
    let avg = total / array.length
    return avg * 20
}