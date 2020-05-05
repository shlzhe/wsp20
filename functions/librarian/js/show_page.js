function show_page() {
    auth('prodadmin@test.com', show_page_secured, '/')
}

let products

async function show_page_secured() {
    glPageContent.innerHTML = '<h1>Show Books</h1>'
    glPageContent.innerHTML += `
        <a href='/home' class="btn btn-primary">Home</a>    
        <a href='/add' class="btn btn-primary">Add Book</a>
        <br><br>
        `

    try {
        products = []
        const snapshot = await firebase.firestore().collection(COLLECTION).orderBy("title").get()
        snapshot.forEach(doc => {
            const { title, author, publisher, summary, year, isbn, image, image_url } = doc.data()
            const p = { docId: doc.id, title, author, publisher, summary, year, isbn, image, image_url }
            products.push(p)
        })
    } catch (e) {
        glPageContent.innerHTML = 'Firestore access error. Try again later!<br>' + e
        return
    }

    //console.log(products)

    if (products.length === 0) {
        glPageContent.innerHTML += '<h1>No books in the database</h1>'
        return
    }

    for (let index = 0; index < products.length; index++) {
        const p = products[index]
        if (!p) continue
        glPageContent.innerHTML += `
        <div id="${p.docId}" class="card" style="width: 18rem; display: inline-block">
            <img src="${p.image_url}" class="card-img-top" style="height:18rem; object-fit: contain;">
            <div class="card-body">
            <h5 class="card-title" style="white-space:nowrap; overflow:hidden">${p.title}</h5>
            <p class="card-text">${p.author}</p>
            <button class="btn btn-primary" type="button"
                onclick="editProduct(${index})">Edit</button>
            <button class="btn btn-danger" type="button"
                onclick="deleteProduct(${index})">Delete</button>
            </div>
        </div>
        `
    }
}

let cardOriginal
let imageFile2Update

function editProduct(index) {
    const p = products[index]
    const card = document.getElementById(p.docId)
    cardOriginal = card.innerHTML
    card.innerHTML = `
    <div class="form-group">
        Title: <input class="form-control" type="text" id="title" value="${p.title}"/>
        <p id="title_error" style="color:red" />
    </div>
    <div class="form-group">
        Author: <input class="form-control" type="text" id="author" value="${p.author}"/>
        <p id="author_error" style="color:red" />
    </div>
    <div class="form-group">
        Publisher: <input class="form-control" type="text" id="publisher" value="${p.publisher}"/>
        <p id="publisher_error" style="color:red" />
    </div>
    <div class="form-group">
        Summary:<br>
        <textarea class="form-control" id="summary" cols="40" rows="4">${p.summary}</textarea>
        <p id="summary_error" style="color:red" />
    </div>
    <div class="form-group">
        Year: <input class="form-control" type="number" id="year" value="${p.year}"/>
        <p id="year_error" style="color:red" />
    </div> 
    <div class="form-group">
        ISBN: <input class="form-control" type="number" id="isbn" value="${p.isbn}"/>
        <p id="isbn_error" style="color:red" />
    </div>
    Current Image:<br>
    <img src="${p.image_url}" style="width:18rem"><br>
    <div class="form-group">
        New Image: <input type="file" id="imageButton" value="upload" />
    </div>
    <button class="btn btn-danger" type="button" onclick="update(${index})">Update</button>
    <button class="btn btn-secondary" type="button" onclick="cancel(${index})">Cancel</button>
    `

    const imageButton = document.getElementById('imageButton')
    imageButton.addEventListener('change', e => {
        imageFile2Update = e.target.files[0]
    })
}

async function update(index) {
    const p = products[index]
    const newTitle = document.getElementById('title').value
    const newAuthor = document.getElementById('author').value
    const newPublisher = document.getElementById('publisher').value
    const newSummary = document.getElementById('summary').value
    const newYear = document.getElementById('year').value
    const newISBN = document.getElementById('isbn').value

    const titleErrorTag = document.getElementById('title_error')
    const authorErrorTag = document.getElementById('author_error')
    const publisherErrorTag = document.getElementById('publisher_error')
    const summaryErrorTag = document.getElementById('summary_error')
    const yearErrorTag = document.getElementById('year_error')
    const isbnErrorTag = document.getElementById('isbn_error')
    titleErrorTag.innerHTML = validate_title(newTitle)
    authorErrorTag.innerHTML = validate_author(newAuthor)
    publisherErrorTag.innerHTML = validate_publisher(newPublisher)
    summaryErrorTag.innerHTML = validate_summary(newSummary)
    yearErrorTag.innerHTML = validate_year(newYear)
    isbnErrorTag.innerHTML = validate_isbn(newISBN)

    if (titleErrorTag.innerHTML || authorErrorTag.innerHTML || publisherErrorTag.innerHTML || 
        summaryErrorTag.innerHTML || yearErrorTag.innerHTML || isbnErrorTag.innerHTML) {
        return
    }

    let updated = false
    const newInfo = {}
    if (p.title !== newTitle) {
        newInfo.title = newTitle
        updated = true
    }
    if (p.author !== newAuthor) {
        newInfo.author = newAuthor
        updated = true
    }
    if (p.publisher !== newPublisher) {
        newInfo.publisher = newPublisher
        updated = true
    }
    if (p.summary !== newSummary) {
        newInfo.summary = newSummary
        updated = true
    }
    if (p.year !== newYear) {
        newInfo.year = Number(Number(newYear))
        updated = true
    }
    if (p.isbn !== newISBN) {
        newInfo.isbn= Number(Number(newISBN))
        updated = true
    }
    if (imageFile2Update) {
        updated = true
    }
    if (!updated) {
        cancel(index)
        return
    }

    try {
        if (imageFile2Update) {
            const imageRef2del = firebase.storage().ref().child(IMAGE_FOLDER + p.image)
            await imageRef2del.delete()

            const image = Date.now() + imageFile2Update.name
            const newImageRef = firebase.storage().ref(IMAGE_FOLDER + image)
            const taskSnapshot = await newImageRef.put(imageFile2Update)
            const image_url = await taskSnapshot.ref.getDownloadURL()
            newInfo.image = image
            newInfo.image_url = image_url
        }

        await firebase.firestore().collection(COLLECTION).doc(p.docId).update(newInfo)
        window.location.href = '/show'
    } catch (e) {
        glPageContent.innerHTML = 'Firestore/Storage update error<br>' + JSON.stringify(e)
    }
}

function cancel(index) {
    const p = products[index]
    const card = document.getElementById(p.docId)
    card.innerHTML = cardOriginal
}

async function deleteProduct(index) {
    try {
        const p = products[index]
        await firebase.firestore().collection(COLLECTION).doc(p.docId).delete()
        const imageRef = firebase.storage().ref().child(IMAGE_FOLDER + p.image)
        await imageRef.delete()

        const card = document.getElementById(p.docId)
        card.parentNode.removeChild(card)

        delete products[index]

    } catch (e) {
        glPageContent.innerHTML = 'Delete Error: <br>' + JSON.stringify(e)
    }
}