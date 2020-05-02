function validate_title(title) {
    if (!title || title.length < 4) return 'Error: min 4 chars'
    else return null
}

function validate_author(author) {
    if (!author || author.length < 4) return 'Error: min 4 chars'
    else return null
}

function validate_pub(pub) {
    if (!pub || pub.length < 4) return 'Error: min 4 chars'
    else return null
}

function validate_summary(summary) {
    if (!summary || summary.length < 5) return 'Error: min 5 chars'
    else return null
}

function validate_year(year) {
    if (!year || year.length !== 4) return `Invalid year`
    else return null
}

function validate_isbn(isbn) {
    if (!isbn || isbn.length !== 13) return `Invalid ISBN number (13 digits)`
    else return null
}