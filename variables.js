// Структура послей данных
const defaultMappping = {
    properties: {
        //id: { type: 'text' }, //возможно добавить сюда link, id для удаления
        name: { type: 'text' },
        content: { type: 'text' },
        link: { type: 'text' },
        dateCreatd: { type: 'date' }
    }
}

const defaultQuery = {
    query: {
        match_all: {}
    }
}

const authElastic = {
    node: "https://elastic.viomitra.ru/",
    auth: {
        username: 'elastic',
        password: '3uV8U8btGcONRUkVzaaW'
    }
}

/**
 * Получение запроса поиска по умолчанию
 * @param {*} query указанный в параметрах запрос
 * @returns объект query с параметрами запроса
 */
const getDefaultSearchQuery = (query) => {
    return {
        query: {
            multi_match: {
                query: query,
                fields: ['content', 'link', 'name']
            }
        }
    } 
}

module.exports = {
    mapping: defaultMappping,
    getDefaultSearchQuery: getDefaultSearchQuery,
    defaultQuery: defaultQuery,
    authElastic: authElastic
};