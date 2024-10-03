const { Client } = require('@elastic/elasticsearch');

class ElasticsearchService {
    constructor(config) {
        this.client = new Client(config);
    }

    async createIndexIfNotExists(indexName, mappings) {
        try {
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

    async searchDocuments(indexName, query) {
        try {
            const result = await this.client.search({
                index: indexName,
                body: query
            });
            return result.body.hits.hits;
        } catch (error) {
            console.error(`Ошибка поиска документа в индексе ${indexName}:`, error);
            throw error;
        }
    }

    async deleteIndex(indexName) {
        try {
            await this.client.indices.delete({ index: indexName });
            console.log(`Индекс ${indexName} удалён успешно`);
        } catch (error) {
            console.error(`Ошибка удаление индекса ${indexName}:`, error);
            throw error;
        }
    }
}

module.exports = ElasticsearchService;