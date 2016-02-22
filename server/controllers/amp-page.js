const getArticle = require('../lib/getArticle');
const getRelatedContent = require('../lib/related-content/recommended-reads');
const renderArticle = require('../lib/render-article');
const transformArticle = require('../lib/transformEsV3Item.js');
const isFree = require('../lib/article-is-free');
const errors = require('http-errors');


module.exports = (req, res, next) => {
	getArticle(req.params.uuid)
		.then(response => response._source ? transformArticle(response._source) : Promise.reject(new errors.NotFound()))
		.then(article => isFree(article, req) ? article : Promise.reject(new errors.NotFound()))
		.then(article => {
			return getRelatedContent(req.params.uuid, req.raven)
				.then(related => {
					article.relatedContent = related;
					return article;
				});
		})
		.then(data => {
			data.SOURCE_PORT = (req.app.get('env') === 'production') ? '' : ':5000';
			return data;
		})
		.then(data => renderArticle(data, {
			precompiled: req.app.get('env') === 'production'
		}))
		.then(content => {
			res.setHeader('cache-control', 'public, max-age=30');
			res.send(content);
		})
		.catch(next);
};

