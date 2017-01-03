'use strict';

const {expect} = require('../../test-utils/chai');
const xslt = require('../../server/lib/article-xslt');

describe('video transform', () => {
	it('should transform video.ft.com links to amp-brightcove with account and player from parameters', async () => {
		expect(
			await xslt('<a href="http://video.ft.com/video-id"></a>', 'main', {
				brightcoveAccountId: 'account-id',
				brightcovePlayerId: 'player-id',
			})
		).dom.to.equal(`<amp-brightcove
				data-account="account-id"
				data-player="player-id"
				data-embed="default"
				data-video-id="video-id"
				layout="responsive"
				width="480" height="270">
		</amp-brightcove>`);
	});

	describe('youtube', () => {
		it('should transform youtube.com/watch links to amp-youtube', async () => {
			expect(
				await xslt('<a href="http://youtube.com/watch?v=dQw4w9WgXcQ"></a>')
			).dom.to.equal(`<amp-youtube
				data-videoid="dQw4w9WgXcQ"
				layout="responsive"
				width="480" height="270"></amp-youtube>`);
		});

		it('should transform youtube.com/watch links and unwrap paragraph', async () => {
			expect(
				await xslt('<p><a href="http://youtube.com/watch?v=dQw4w9WgXcQ"></a></p>')
			).dom.to.equal(`<amp-youtube
				data-videoid="dQw4w9WgXcQ"
				layout="responsive"
				width="480" height="270"></amp-youtube>`);
		});

		it('should transform youtube.com/watch links with videoid not as last parameter', async () => {
			expect(
				await xslt('<p><a href="http://youtube.com/watch?v=dQw4w9WgXcQ&foo=bar"></a></p>')
			).dom.to.equal(`<amp-youtube
				data-videoid="dQw4w9WgXcQ"
				layout="responsive"
				width="480" height="270"></amp-youtube>`);
		});

		it('should transform video-container divs', async () => {
			expect(
				await xslt('<div class="video-container video-container-youtube"><div data-asset-ref="dQw4w9WgXcQ"></a></p>')
			).dom.to.equal(`<amp-youtube
				data-videoid="dQw4w9WgXcQ"
				layout="responsive"
				width="480" height="270"></amp-youtube>`);
		});
	});
});
