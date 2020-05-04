class Interested {
    // book: {id, title, author, publisher, summary, year, isbn, image, image_url}
    // no need for quantity
    // contents
    constructor() {
        this.contents = []

    }

    add(book) {
        let found = false
        for (const item of this.contents) {
            if (item.book.id === book.id) {
                found = true
                ++item.qty
            }
        }
        if (!found) {
            this.contents.push({ book })
        }
    }

    remove(id) {
        for (const item of this.contents) {
            if (item.book.id === id) {
                this.contents.splice(this.contents.indexOf(item), 1)
            }
        }
    }

    getTotal() {
        let sum = 0
        for (const item of this.contents) {
            sum += item.qty * item.book.price
        }
        return sum
    }

    serialize() {
        return this.contents
    }

    static deserialize(sdata) {
        const interested = new Interested()
        interested.contents = sdata
        return interested
    }
}
module.exports = Interested