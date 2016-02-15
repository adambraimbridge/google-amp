const scss = require('node-sass');
const path = require('path');
const renderScss = require('@quarterto/promisify')(scss.render);
const fs = require('fs-promise');

const scssPath = path.resolve('scss');
const cssPath = path.resolve('css');
const bowerPath = path.resolve('bower_components');

module.exports = () => renderScss({
	file: `${scssPath}/style.scss`,
	includePaths: [scssPath, bowerPath]
}).then(result => result.css);

if(module === require.main) {
	module.exports()
		.then(css => fs.writeFile(`${cssPath}/style.css`, css, 'utf8'))
		.then(
			() => console.log(`written ${cssPath}/style.css`),
			e => { console.error(e.stack); process.exit(1); }
		);
}