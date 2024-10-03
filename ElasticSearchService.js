const { Client } = require('@elastic/elasticsearch');

/**
 * Сервис по работе с индексами Elasticsearch
 */
class ElasticsearchService {
    constructor(config) {
        this.client = new Client(config);
    }

    /**
     * Создание индекса с указанной структурой, если такого индекса ещё не существует
     * @param {*} indexName название индекса
     * @param {*} mappings структура полей данных в индексе
     */
    async createIndexIfNotExists(indexName, mappings) {
        try {
            console.log(indexName);
            const exists = await this.client.indices.exists({ index: indexName });
            if (!exists) {
                await this.client.indices.create({
                    index: indexName,
                    body: { mappings }
                });
                console.log(`Индекс ${indexName} создан успешно`);
            } else {
                console.log(`Индекс ${indexName} уже существует`);
            }
        } catch (error) {
            console.error(`Ошибка создания индекса ${indexName}:`, error);
            throw error;
        }
    }

    /**
     * Индексирование документа в указанном индексе (если документ есть - обновление, если нет - создание)
     * @param {*} indexName название индекса
     * @param {*} document документ
     * @returns 
     */
    async indexDocument(indexName, document) {
        try {
            const result = await this.client.index({
                index: indexName,
                body: document
            });
            console.log(`Документ успешно проиндексирован в индексе ${indexName}`);
            return result;
        } catch (error) {
            console.error(`Ошибка индексации документа в индексе${indexName}:`, error);
            throw error;
        }
    }

    /**
     * Поиск документов указанных в запросе документов в указанном индексе
     * @param {*} indexName название индекса
     * @param {*} query запрос
     * @returns 
     */
    async searchDocuments(indexName, query) {
        try {
            const result = await this.client.search({
                index: indexName,
                body: query
            });
            console.log(result.hits.hits);
            return result.hits.hits;
        } catch (error) {
            console.error(`Ошибка поиска документа в индексе ${indexName}:`, error);
            throw error;
        }
    }

    /**
     * Удаление индекса по названию
     * @param {*} indexName название индекса
     */
    async deleteIndex(indexName) {
        try {
            await this.client.indices.delete({ index: indexName });
            console.log(`Индекс ${indexName} удалён успешно`);
        } catch (error) {
            console.error(`Ошибка удаление индекса ${indexName}:`, error);
            throw error;
        }
    }

    /**
 * Удаление документа из указанного индекса по его идентификатору
 * @param {*} indexName название индекса
 * @param {*} documentId идентификатор документа
 */
    async deleteDocument(indexName, documentId) {
        try {
            const result = await this.client.delete({
                index: indexName,
                id: documentId
            });
            console.log(`Документ с идентификатором ${documentId} успешно удалён из индекса ${indexName}`);
            return result;
        } catch (error) {
            console.error(`Ошибка удаления документа с идентификатором ${documentId} из индекса ${indexName}:`, error);
            throw error;
        }
    }
}

module.exports = ElasticsearchService;