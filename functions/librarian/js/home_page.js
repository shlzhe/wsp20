function home_page() {
    auth('prodadmin@test.com', home_page_secured, '/')
}

async function home_page_secured() {
    glPageContent.innerHTML = '<h1>Home Page</h1>'
    glPageContent.innerHTML += `
        <a href='/add' class="btn btn-primary">Add a Product</a>    
        <a href='/show' class="btn btn-primary">Show Products</a>
        <a href='/' class="btn btn-primary">Back to Library</a>
        <a href='/logout' class="btn btn-primary">Log Out</a>
        <button class="btn btn-danger" type="button" onclick="logOut()">Log Out Everything</button>
        `
}

async function logOut() {
    try {
        await firebase.auth().signOut()
        window.location.href = '/b/signout'
    } catch (e) {
        window.location.href = '/'
    }
}