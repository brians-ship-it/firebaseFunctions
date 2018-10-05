const functions = require('firebase-functions');
const os = require('os');
const path = require('path');
const cors = require('cors')({ origin: true });
const fs = require('fs');

const Busboy = require('busboy'); 

// const gcconfig = {
//     projectId: "fileuploader-787db",
//     keyFilename: "my-fb-key.json"
// };

const gcs = require('@google-cloud/storage');
gcs.projectId = "fileuploader-787db";
gcs.keyFilename = "my-fb-key.json";

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.uploadFile = functions.https.onRequest((req, res) => {
    console.log('FUNCTION EXCECUTED');
    cors(req, res, () => {
        if (req.method !== 'POST') {
            return res.status(500).json({
                message: 'not allowed'
            });
        }

        const busboy = new Busboy({ headers: req.headers });
        let uploadData = null;

        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            const filepath = path.join(os.tmpdir(), filename);
            uploadData = { file: filepath, type: mimetype };
            file.pipe(fs.createStream(filepath));
        });

        busboy.finish('finish', () => {
            const bucket = gcs.bucket('fileuploader-787db.appspot.com');
            bucket.upload(uploadData.file, {
                uploadType: 'media',
                metadata: {
                    metadata: {
                        contentType: uploadData.type
                    }
                }
            })
            .then(() => {
                res.status(200).json({
                    message: 'successful'
                });
            })
            .catch(err => {
                res.status(500).json({
                    error: err
                });
            });
        });
        busboy.end(req.rawBody);
    });
});