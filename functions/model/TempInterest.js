class TempInterest {
    constructor() {
        this.contents = []
    }

    add(id) {
        let found = false
        for (const item of this.contents) {
            if (item === id) {
                found = true
            }
        }
        if (!found) {
            this.contents.push(id)
        }
    }

    remove(id) {
        for (const item of this.contents) {
            if (item === id) {
                this.contents.splice(this.contents.indexOf(item), 1)
            }
        }
    }

    serialize() {
        return this.contents
    }

    static deserialize(sdata) {
        const temp = new TempInterest()
        temp.contents = sdata
        return temp
    }
}
module.exports = TempInterest