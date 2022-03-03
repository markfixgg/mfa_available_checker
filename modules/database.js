const Errors = {
    FileNotExists: new Error('File not exists.'),
    WriteError: new Error(`Can't write to file.`),
}

class DatabaseFile {
    constructor(dirname, path) {
        this.path = `${dirname}/${path}`
    }

    async checkExisting() {
        try {
            return fs.existsSync(this.path);
        } catch (e) {
            // TODO: Log to file
            return false;
        }
    }

    async set(payload) {
        try {
            const exists = this.checkExisting();
            if(exists) {

            }
        } catch (e) {
            throw Errors.WriteError;
        }
    }

    async get() {

    }

    async remove() {

    }
}

module.exports = new DatabaseFile();