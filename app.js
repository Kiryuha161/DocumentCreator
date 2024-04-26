const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const path = require('path');
const logger = require('./logger.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, pragma, cache-control'); 
    next();
  });


app.post('/create-doc', async (req, res) => {
    try {
        const documentContent = fs.readFileSync(path.resolve(__dirname, "./Document.docx"), "binary");
        const zip = new PizZip(documentContent);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true
        });

        const firstName = req.body.firstName;
        const secondName = req.body.secondName;
        const middleName = req.body.middleName;

        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth();
        const year = today.getFullYear().toString().slice(-2);
        const months = [
            "января",
            "февраля",
            "марта",
            "апреля",
            "мая",
            "июня",
            "июля",
            "августа",
            "сентября",
            "октября",
            "ноября",
            "декабря"
        ];

        doc.render({
            firstName: firstName,
            secondName: secondName,
            middleName: middleName,
            num: day,
            month: months[month],
            y: year
        });

        const buf = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });
        fs.writeFileSync(path.resolve(__dirname, `./Documents/Doc${uuidv4()}.docx`), buf);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=doc-${uuidv4()}.docx`);
        logger.infoLogger('Документ успешно создан', 'create-doc', `${secondName} ${firstName}${middleName}`);
        res.send(buf);
    } catch (error) {
        logger.errorLogger(error, 'create-doc'); 
        res.status(500).send('Произошла ошибка при создании документа');
    }
});

const PORT = 3000; 

app.listen(PORT, () => {
    logger.startLogger(`Сервер запущен на порту ${PORT}`, PORT);
});