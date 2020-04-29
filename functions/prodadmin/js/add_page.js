function add_page() {
    auth('prodadmin@test.com', add_page_secured, '/login')
}

let glImageFile2Add;

function add_page_secured() {
    glPageContent.innerHTML = '<h1>Add Page</h1>'
    glPageContent.innerHTML += `
        <a href='/home' class="btn btn-outline-primary">Home</a>    
        <a href='/show' class="btn btn-outline-primary">Show Products</a>
        <div class="form-group">
            Title: <input class="form-control" type="text" id="title" />
            <p id="title_error" style="color:red" />
        </div>

        <div class="form-group">
            Author<input class="form-control" type="text" id="author"></>
            <p id="author_error" style="color:red" />
        </div>

        <div class="form-group">
            Publisher<input class="form-control" type="text" id="pub" ></>
            <p id="pub_error" style="color:red" />
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
        <button class="btn btn-primary" type="button" onclick="addBook()">Add</button>
    `;

    const imageButton = document.getElementById('imageButton')
    imageButton.addEventListener('change', e => {
        glImageFile2Add = e.target.files[0]
        // console.log('file upload', e.target.files[0])
    })
}

async function addBook() {

    const status = 0;
    const title = document.getElementById('title').value
    const author = document.getElementById('author').value
    const pub = document.getElementById('pub').value
    const summary = document.getElementById('summary').value
    let year = document.getElementById('year').value
    let isbn = document.getElementById('isbn').value

    const titleErrorTag = document.getElementById('title_error')
    const authorErrorTag = document.getElementById('author_error')
    const pubErrorTag = document.getElementById('pub_error')
    const summaryErrorTag = document.getElementById('summary_error')
    const yearErrorTag = document.getElementById('year_error')
    const isbnErrorTag = document.getElementById('isbn_error')
    const imageErrorTag = document.getElementById('image_error')

    titleErrorTag.innerHTML = validate_title(title)
    authorErrorTag.innerHTML = validate_author(author)
    pubErrorTag.innerHTML = validate_pub(pub)
    summaryErrorTag.innerHTML = validate_summary(summary)
    yearErrorTag.innerHTML = validate_year(year)
    isbnErrorTag.innerHTML = validate_isbn(isbn)
    imageErrorTag.innerHTML = !glImageFile2Add ? 'Error: No image selected' : null

    if (titleErrorTag.innerHTML || authorErrorTag.innerHTML || pubErrorTag.innerHTML || 
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

        await firebase.firestore().collection(COLLECTION).doc().set({ status, title, author, pub, summary, year, isbn, image, image_url })

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