function add_page() {
    auth('prodadmin@test.com', add_page_secured, '/')
}

let glImageFile2Add;

function add_page_secured() {
    glPageContent.innerHTML = '<h1>Add Page</h1>'
    glPageContent.innerHTML += `
        <a href='/home' class="btn btn-primary">Home</a>    
        <a href='/show' class="btn btn-primary">Show Products</a>
        <div class="form-group">
            Title: <input class="form-control" type="text" id="title" />
            <p id="title_error" style="color:red" />
        </div>

        <div class="form-group">
            Author<input class="form-control" type="text" id="author"></>
            <p id="author_error" style="color:red" />
        </div>

        <div class="form-group">
            Publisher<input class="form-control" type="text" id="publisher" ></>
            <p id="publisher_error" style="color:red" />
        </div>

        <div class="form-group">
            Summary<textarea class="form-control" id="summary" cols="40" rows="4"></textarea>
            <p id="summary_error" style="color:red" />
        </div>

        <div class="form-group">
            Year: <input class="form-control" type="number" id="year" />
            <p id="year_error" style="color:red" />
        </div>

        <div class="form-group">
            ISBN: <input class="form-control" type="number" id="isbn" />
            <p id="isbn_error" style="color:red" />
        </div>

        <div class="form-group">
            Image: <input type="file" id="imageButton" value="upload" />
            <p id="image_error" style="color:red" />
        </div>
        <button class="btn btn-primary" type="button" onclick="addBook()">Add Book</button>
        <a href='/home' class="btn btn-danger">Cancel</a>    
    `;

    const imageButton = document.getElementById('imageButton')
    imageButton.addEventListener('change', e => {
        glImageFile2Add = e.target.files[0]
        // console.log('file upload', e.target.files[0])
    })
}

// const Constants = require('../../myconstants.js')

async function addBook() {

    const status = 0
    const title = document.getElementById('title').value
    const author = document.getElementById('author').value
    const publisher = document.getElementById('publisher').value
    const summary = document.getElementById('summary').value
    let year = document.getElementById('year').value
    let isbn = document.getElementById('isbn').value

    const titleErrorTag = document.getElementById('title_error')
    const authorErrorTag = document.getElementById('author_error')
    const publisherErrorTag = document.getElementById('publisher_error')
    const summaryErrorTag = document.getElementById('summary_error')
    const yearErrorTag = document.getElementById('year_error')
    const isbnErrorTag = document.getElementById('isbn_error')
    const imageErrorTag = document.getElementById('image_error')

    titleErrorTag.innerHTML = validate_title(title)
    authorErrorTag.innerHTML = validate_author(author)
    publisherErrorTag.innerHTML = validate_publisher(publisher)
    summaryErrorTag.innerHTML = validate_summary(summary)
    yearErrorTag.innerHTML = validate_year(year)
    isbnErrorTag.innerHTML = validate_isbn(isbn)
    imageErrorTag.innerHTML = !glImageFile2Add ? 'Error: No image selected' : null

    if (titleErrorTag.innerHTML || authorErrorTag.innerHTML || publisherErrorTag.innerHTML ||
        summaryErrorTag.innerHTML || yearErrorTag.innerHTML || isbnErrorTag.innerHTML ||
        imageErrorTag.innerHTML) {
        return
    }

    try {
        const image = Date.now() + glImageFile2Add.name
        const ref = firebase.storage().ref(IMAGE_FOLDER + image)
        const taskSnapshot = await ref.put(glImageFile2Add)
        const image_url = await taskSnapshot.ref.getDownloadURL()

        year = Number(year)
        isbn = Number(isbn)

        await firebase.firestore().collection(COLLECTION).doc().set({ status, title, author, publisher, summary, year, isbn, image, image_url })

        glPageContent.innerHTML = `
            <h1>${title} has been added!</h1>
            <a href="/show" class="btn btn-outline-primary">Show All</a>
        `

    } catch (e) {
        glPageContent.innerHTML = `
            <h1>Cannot add a product</h1>
            ${JSON.stringify(e)}
        `
        console.log(e)
    }
}