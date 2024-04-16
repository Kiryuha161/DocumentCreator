const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/create-doc', async (req, res) => {
    const documentContent = fs.readFileSync(path.resolve(__dirname, "./Document.docx"), "binary");
    const zip = new PizZip(documentContent);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true
    });

    const firstName = req.body.firstName;
    const secondName = req.body.secondName;
    const middleName = req.body.middleName ;

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
    res.send(buf);
});

const PORT = 3000; // Порт, на котором будет работать сервер


app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});