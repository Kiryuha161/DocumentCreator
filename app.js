const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const path = require('path');
const logger = require('./logger.js');
const multer = require('multer');
const ElasticsearchService = require('./ElasticSearchService.js');

const upload = multer();
const elasticsearchService = new ElasticsearchService({
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

//#region Создание документа
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
//#endregion

//#region Elasticsearch
// Маршрут для индексации данных в Elasticsearch
app.post('/index', async (req, res) => { //+
    const { indexName, link, title, data } = req.body;

    try {
        await elasticsearchService.createIndexIfNotExists(indexName, {
            properties: {
                name: { type: 'text' },
                content: { type: 'text' },
                link: { type: 'text' },
                dateCreatd: { type: 'date' }
            }
        });

        await elasticsearchService.indexDocument(indexName, { link, title, data });

        res.status(200).send({ message: `Данные индексированы успешно. Добавлен индекс ${indexName}` });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Ошибка индексации данных' });
    }
});

// Маршрут для поиска данных в Elasticsearch /search?query="step.ru"&index=documents
app.get('/search', async (req, res) => { // +
    const { query, index } = req.query;

    try {
        const result = await elasticsearchService.searchDocuments(index, {
            query: {
                multi_match: {
                    query: query,
                    fields: ['content', 'link', 'name']
                }
            }
        });

        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Ошибка поиска данных' });
    }
});

// Маршрут для удаления указанного индекса 
app.delete('/delete-index', async (req, res) => { //+
    const { query } = req.body;

    try {
        await elasticsearchService.deleteIndex(query);
        res.status(200).send({ message: 'Индекс успешно удалён' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Ошибка удаления индекса' });
    }
});

// Маршрут для добавления документа в указанный индекс 
app.post('/add-document', async (req, res) => { 
    const { index, title, content, link, tags, dateCreatd } = req.body;

    try {
        await elasticsearchService.indexDocument(index, { title, content, link, tags, dateCreatd });
        res.status(200).send({ message: `Документ успешно добавлен к индексу ${index}` });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: `Ошибка добавления документа к индексу ${index}` });
    }
});

// Маршрут для получения содержимого указанного индекса /get-index?query=articles, /get-index?query=documents
app.get('/get-index', async (req, res) => { 
    try {
        const { query } = req.query; 
        const result = await elasticsearchService.searchDocuments(query, {
            query: {
                match_all: {}
            }
        });

        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: `Ошибка получения индекса ${query}` });
    }
});

//#endregion

const PORT = 3000; 

app.listen(PORT, () => {
    logger.startLogger(`Сервер запущен на порту ${PORT}`, PORT);
});