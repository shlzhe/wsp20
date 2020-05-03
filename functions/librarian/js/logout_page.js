async function logout_page() {
    try {
        await firebase.auth().signOut()
        window.location.href = '/'  
    } catch (e) {
        window.location.href = '/'
    }
}