'use strict';

const {expect} = require('../utils/chai');
const transformBody = require('../../server/lib/transform-body');

describe('ft-content transform', () => {
	it('should replace ft-content tags with contents', async () => {
		expect(
			await transformBody('<ft-content>hello</ft-content>')
		).dom.to.equal('hello');
	});
});
