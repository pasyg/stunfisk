const fs = require('fs')

let n = 0


function checkFileExists(file) {
    return fs.promises.access(file, fs.constants.F_OK)
                .then(() => true)
                .catch(() => false)
}

let flag
void (async () => {
    await checkFileExists('./data0.txt')
})()

console.log(flag)