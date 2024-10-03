const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const path = require('path');
const logger = require('./logger.js');
const multer = require('multer');
const { Client } = require('@elastic/elasticsearch');

const upload = multer();
const client = new Client({
    node: "https://elastic.viomitra.ru/",
    auth: {
        username: 'elastic',
        password: '3uV8U8btGcONRUkVzaaW'
    }
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, pragma, cache-control, x-goog-authuser');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); 
  
    // Обработка предварительных запросов
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
});

app.post('/create-doc', upload.none(), async (req, res) => {
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
        logger.infoLogger('Документ успешно создан', 'create-doc', `${secondName} ${firstName} ${middleName}`);
        res.send(buf);
    } catch (error) {
        logger.errorLogger(error, 'create-doc'); 
        res.status(500).send('Произошла ошибка при создании документа');
    }
});

// Маршрут для индексации данных в Elasticsearch
app.post('/index', async (req, res) => {
    const { link, title, data } = req.body;

    try {
        // Индексируем данные в Elasticsearch
        await client.index({
            index: 'step_pages',
            body: {
                link,
                title,
                data
            }
        });

        res.status(200).send({ message: 'Data indexed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error indexing data' });
    }
});

// Маршрут для поиска данных в Elasticsearch
app.get('/search', async (req, res) => {
    const { query } = req.query;

    try {
        // Выполняем поиск в Elasticsearch
        const result = await client.search({
            index: 'articles',
            body: {
              query: {
                multi_match: {
                  query: query,  // Укажите текст для поиска
                  fields: ['document', 'link'] // Укажите поля, по которым будет производиться поиск
                }
              }
            }
        });

        res.status(200).send(result.body.hits.hits);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error searching data' });
    }
});

// Маршрут для создания индекса articles
app.post('/create-index-articles', async (req, res) => {
    try {
        await client.indices.create({
            index: 'articles',
            body: {
                mappings: {
                    properties: {
                        title: { type: 'text' },
                        content: { type: 'text' },
                        link: { type: 'text' },
                        tags: { type: 'text' },
                        dateCreatd: { type: 'date' }
                    }
                }
            }
        });

        res.status(200).send({ message: 'Index articles created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error creating index articles' });
    }
});

// Маршрут для удаления индекса articles
app.delete('/delete-index-articles', async (req, res) => {
    try {
        await client.indices.delete({
            index: 'articles'
        });

        res.status(200).send({ message: 'Index articles deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error deleting index articles' });
    }
});

// Маршрут для добавления документа в индекс articles
app.post('/add-document-articles', async (req, res) => {
    const { title, content, link, tags, dateCreatd } = req.body;

    try {
        await client.index({
            index: 'articles',
            id: '1',
            body: {
                title,
                content,
                link,
                tags,
                dateCreatd
            }
        });

        res.status(200).send({ message: 'Document added to articles index successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error adding document to articles index' });
    }
});

// Маршрут для получения содержимого индекса articles
app.get('/get-index-articles', async (req, res) => {
    try {
        const result = await client.search({
            index: 'articles',
            body: {
                query: {
                    match_all: {}
                }
            }
        });

        console.log(JSON.stringify(result.hits.hits));
        res.status(200).send(result.hits.hits);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error getting index articles' });
    }
});

// Маршрут для создания индекса documents
app.post('/create-index-documents', async (req, res) => {
    try {
        await client.indices.create({
            index: 'documents',
            body: {
                mappings: {
                    properties: {
                        name: { type: 'text' },
                        content: { type: 'text' },
                        link: { type: 'text' },
                        dateCreatd: { type: 'date' }
                    }
                }
            }
        });

        res.status(200).send({ message: 'Index documents created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error creating index documents' });
    }
});

// Маршрут для удаления индекса documents
app.delete('/delete-index-documents', async (req, res) => {
    try {
        await client.indices.delete({
            index: 'documents'
        });

        res.status(200).send({ message: 'Index documents deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error deleting index documents' });
    }
});

// Маршрут для добавления документа в индекс documents
app.post('/add-document-documents', async (req, res) => {
    const { name, content, link, dateCreatd } = req.body;

    try {
        await client.index({
            index: 'documents',
            id: '1',
            body: {
                name,
                content,
                link,
                dateCreatd
            }
        });

        res.status(200).send({ message: 'Document added to documents index successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error adding document to documents index' });
    }
});

// Маршрут для получения содержимого индекса documents
app.get('/get-index-documents', async (req, res) => {
    try {
        const result = await client.search({
            index: 'documents',
            body: {
                query: {
                    match_all: {}
                }
            }
        });

        res.status(200).send(result.body.hits.hits);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error getting index documents' });
    }
});

const PORT = 3000; 

app.listen(PORT, () => {
    logger.startLogger(`Сервер запущен на порту ${PORT}`, PORT);
});