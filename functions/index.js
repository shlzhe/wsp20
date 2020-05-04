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
    const iCount = req.session.interested ? req.session.interested.length : 0
    const coll = firebase.firestore().collection(Constants.COLL_BOOKS)
    try {
        let books = []
        const snapshot = await coll.orderBy("title").get()
        snapshot.forEach(doc => {
            books.push({ id: doc.id, data: doc.data() })
        })
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs', { error: false, books, user: req.decodedIdToken, iCount })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs', { error: e, user: req.decodedIdToken, iCount })
    }
})

app.post('/b/book', auth, async (req, res) => {
    const iCount = req.session.interested ? req.session.interested.length : 0
    const coll1 = firebase.firestore().collection(Constants.COLL_PRODUCTS)
    const coll2 = firebase.firestore().collection(Constants.COLL_ORDERS)
    const id = req.body.docId

    try {
        let product = []
        const snapshot = await coll1.get()
        snapshot.forEach(doc => {
            if (doc.id === id) product.push({ id: doc.id, data: doc.data() })
        })
        if (req.user) {
            var times = 0, qty = 0
            const snapshot2 = await coll2.where("uid", "==", req.user.uid).get()
            snapshot2.forEach(doc => {
                for (let i = 0; i < doc.data().cart.length; i++)
                    if (doc.data().cart[i].product.id === id) {
                        times++
                        qty += parseInt(doc.data().cart[i].qty)
                    }
            })
        }
        res.setHeader('Cache-Control', 'private')
        res.render('book.ejs', { product, times, qty, user: req.user, iCount })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs', { error: e, user: req.user, iCount })
    }
})

app.get('/b/about', auth, (req, res) => {
    const iCount = req.session.interested ? req.session.interested.length : 0
    res.setHeader('Cache-Control', 'private')
    res.render('about.ejs', { user: req.decodedIdToken, iCount })
})

app.get('/b/contact', auth, (req, res) => {
    const iCount = req.session.interested ? req.session.interested.length : 0
    res.setHeader('Cache-Control', 'private')
    res.render('contact.ejs', { user: req.decodedIdToken, iCount })
})

app.get('/b/signin', (req, res) => {
    res.setHeader('Cache-Control', 'private')
    res.render('signin.ejs', { error: false, user: req.decodedIdToken, iCount: 0 })
})

app.post('/b/signin', async (req, res) => {
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
        if (!req.session.interested) {
            res.setHeader('Cache-Control', 'private')
            res.redirect('/')
        } else {
            res.setHeader('Cache-Control', 'private')
            res.redirect('/b/interested')
        }
        //}
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.render('signin', { error: e, user: null, iCount: 0 })
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

app.get('/b/profile', authAndRedirectSignIn, (req, res) => {
    const iCount = req.session.interested ? req.session.interested.length : 0
    res.setHeader('Cache-Control', 'private')
    res.render('profile', { user: req.decodedIdToken, iCount, orders: false })
})

app.get('/b/signup', (req, res) => {
    res.render('signup.ejs', { page: 'signup', user: null, error: false, iCount: 0 })
})

const Interested = require('./model/Interested.js')

app.post('/b/add2interested', async (req, res) => {
    const id = req.body.docId
    const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
    try {
        const doc = await collection.doc(id).get()
        let interested
        if (!req.session.interested) {
            // first time add to list
            interested = new Interested()
        } else {
            interested = Interested.deserialize(req.session.interested)
        }
        const { title, author, publisher, summary, year, isbn, image, image_url } = doc.data()
        interested.add({ id, title, author, publisher, summary, year, isbn, image, image_url })
        req.session.interested = interested.serialize()
        res.setHeader('Cache-Control', 'private')
        res.redirect('/')
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send(JSON.stringify(e))
    }
})

app.get('/b/interested', authAndRedirectSignIn, (req, res) => {
    let interested
    if (!req.session.interested) {
        interested = new Interested()
    } else {
        interested = Interested.deserialize(req.session.interested)
    }
    res.setHeader('Cache-Control', 'private')
    res.render('interested.ejs', {
        message: false, interested, user: req.decodedIdToken,
        iCount: interested.contents.length
    })
})

app.post('/b/saveinterested', authAndRedirectSignIn, async (req, res) => {
    if (!req.session.interested) {
        res.setHeader('Cache-Control', 'private')
        return res.send('There is nothing on the Interested list!')
    }

    // data format to store in firestore
    // collection: orders
    // {uid, timestamp, interested}
    // interested = [{ ...}] // contents in interested

    const data = {
        uid: req.decodedIdToken.uid,
        interested: req.session.interested
    }

    try {
        await adminUtil.saveInterested(data)
        req.session.cart = null
        res.setHeader('Cache-Control', 'private')
        return res.render('interested.ejs',
            { message: 'Saved Successfully', interested, user: req.decodedIdToken, iCount: interested.contents.length })
    } catch (e) {
        const interested = Interested.deserialize(req.session.interested)
        res.setHeader('Cache-Control', 'private')
        return res.render('interested.ejs',
            { message: 'Failed to save changes. Try Again Later!', interested, user: req.decodedIdToken, iCount: interested.contents.length }
        )
    }
})

app.post('/b/remove', async (req, res) => {
    const id = req.body.docId
    //const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
    try {
        let interested = Interested.deserialize(req.session.interested)
        interested.remove(id)
        req.session.interested = interested.serialize()
        res.setHeader('Cache-Control', 'private')
        res.redirect('/b/interested')
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        console.log("===================" + e)
        res.send(JSON.stringify(e))
    }
})

app.post('/b/borrow', authAndRedirectSignIn, async (req, res) => {
    // change field in books
    // add to borrow collection
    // remove from interested
    const id = req.body.bookId
    const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
    //const book = await collection.doc(id).get()
    try {
        const data = {
            uid: req.decodedIdToken.uid,
            id
        }
        await adminUtil.borrow(id, data)
        let interested = Interested.deserialize(req.session.interested)
        interested.remove(id)
        res.setHeader('Cache-Control', 'private')
        return res.render('interested.ejs',
            { message: 'Borrowed Successfully', interested, user: req.decodedIdToken, iCount: 0 })
    } catch (e) {
        const interested = Interested.deserialize(req.session.interested)
        res.setHeader('Cache-Control', 'private')
        return res.render('interested.ejs',
            { message: 'Borrow Failed. Try Again Later!', interested, user: req.decodedIdToken, iCount: interested.contents.length }
        )
    }
})

app.get('/b/borrowed', authAndRedirectSignIn, async (req, res) => {
    const iCount = req.session.interested ? req.session.interested.length : 0
    let borrowed = []
    try {
        const b = await adminUtil.getBorrowed(req.decodedIdToken)
        const collection = firebase.firestore().collection(Constants.COLL_BOOKS)
        for (let i = 0; i < b.length; i++) {
            const doc = await collection.doc(b[i].id).get()
            borrowed.push({ book: doc.data() })
        }
        res.setHeader('Cache-Control', 'private')
        res.render('borrowed.ejs', { message: false, borrowed, user: req.decodedIdToken, iCount })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.send('<h1>Borrowed List Error</h1>' + e)
    }
})

app.get('/b/orderhistory', authAndRedirectSignIn, async (req, res) => {
    try {
        const orders = await adminUtil.getOrderHistory(req.decodedIdToken)
        res.setHeader('Cache-Control', 'private')
        res.render('profile.ejs', { user: req.decodedIdToken, iCount: 0, orders })
    } catch (e) {
        console.log('======', e)
        res.setHeader('Cache-Control', 'private')
        res.send('<h1>Order History Error</h1>')
    }
})

app.post('/b/sortBy', auth, async (req, res) => {
    const sortBy = req.body.sortBy
    const order = req.body.order;
    const iCount = req.session.interested ? req.session.interested.length : 0
    const coll = firebase.firestore().collection(Constants.COLL_BOOKS)
    try {
        let books = []
        const snapshot = await coll.orderBy(sortBy, order).get()
        snapshot.forEach(doc => {
            books.push({ id: doc.id, data: doc.data() })
        })
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs', { error: false, books, user: req.decodedIdToken, iCount })
    } catch (e) {
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs', { error: e, user: req.decodedIdToken, iCount })
    }
})

app.post('/b/search', auth, async (req, res) => {
    const search = req.body.textBoxSearch
    const iCount = req.session.interested ? req.session.interested.length : 0
    const coll = firebase.firestore().collection(Constants.COLL_BOOKS)

    try {
        let books = []
        console.log("search: ================", search)
        const snapshot = await coll.where("title", '>=', search).where("title", '<=', search + '\uf8ff').get()
        const snapshot2 = await coll.where("author", '==', search).get()
        const snapshot3 = await coll.where("isbn", '==', search).get()
        snapshot.forEach(doc => {
            books.push({ id: doc.id, data: doc.data() })
        })        
        snapshot2.forEach(doc => {
            books.push({ id: doc.id, data: doc.data() })
        })
        snapshot3.forEach(doc => {
            books.push({ id: doc.id, data: doc.data() })
        }) 

        console.log('============books[]', books)
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs', { error: false, books, user: req.decodedIdToken, iCount })
    } catch (e) {
        console.log('++++++++++=', e)
        res.setHeader('Cache-Control', 'private')
        res.render('storefront.ejs', { error: e, user: req.decodedIdToken, iCount })
    }
})

app.post('/b/textBoxSearch', auth, async (req, res) => {
    const coll = firebase.firestore().collection(Constants.COLL_BOOKS)
    const textBoxSearch = req.body.textBoxSearch
    try {
        // document.addEventListener('DOMContentLoaded', async function() {
        console.log('started')
            // const searchByName = async ({
            //   search = '',
            //   limit = 50,
            //   lastNameOfLastPerson = ''
            // } = {}) => {
              const snapshot = await coll
                .where('keywords', 'array-contains', textBoxSearch.toLowerCase())
                // .orderBy('name.last')
                // .startAfter(lastNameOfLastPerson)
                // .limit(limit)
                .get();
              return snapshot.docs.reduce((acc, doc) => {
                books.push({ id: doc.id, data: doc.data() })
                console.log('+++++++++++++++', books)
                // return acc.concat(`
                //   <tr>
                //     <td>${name.last}</td>
                //     <td>${name.first}</td>
                //     <td>${name.middle}</td>
                //     <td>${name.suffix}</td>
                //   </tr>`);
                res.setHeader('Cache-Control', 'private')
                res.render('storefront.ejs', { error: false, books, user: req.decodedIdToken, iCount })
           
              }, '');
            // };
    
            // const textBoxSearch = document.querySelector('#textBoxSearch');
        //    // const textBoxSearch = req.body.textBoxSearch;    
            // const searchList = firebase.firestore().collection(Constants.COLL_BOOKS)
            // searchList.innerHTML = await searchByName();
    
            // textBoxSearch.addEventListener('keyup', async (e) =>  await searchByName({search: e.target.value}));
    
            // async function lazyLoad() {
            //   const scrollIsAtTheBottom = (document.documentElement.scrollHeight - window.innerHeight) === window.scrollY; 
            //   if (scrollIsAtTheBottom) {
            //     const lastNameOfLastPerson = searchList.lastChild.firstElementChild.textContent;
    
            //     searchList.innerHTML += await searchByName({
            //       search: textBoxSearch.value,
            //       lastNameOfLastPerson: lastNameOfLastPerson
            //     });
            //   }
            // }
            // window.addEventListener('scroll', lazyLoad);
        //   });
    }
    catch(e) {
        console.log('++++++++============+=', textBoxSearch)
        console.log('++++++++++=', e)

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

app.get('/admin/sysadmin', authSysAdmin, (req, res) => {
    res.render('admin/sysadmin.ejs')
})

app.get('/admin/listUsers', authSysAdmin, (req, res) => {
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