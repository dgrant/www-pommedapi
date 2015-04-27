module.exports = function(grunt) {
	var wwwDir = "../www/";
	var parentGuideDir = "../doc/parentGuide";
	var volunteerGuideDir = "../doc/volunteerGuide";

	var p = require("path"); // Load the path manipulation module
	var fs = require("fs"); // Load the filesystem module
	var imgSize = require("image-size"); // image-size tells us the size of images. Go figure!

	// Read variables.json
	var sharedVariables = grunt.file.readJSON('config/variables.json');
	// Infer the end year and school year from the startYear definition
	sharedVariables.endYear = sharedVariables.startYear + 1;
	sharedVariables.schoolYear = sharedVariables.startYear + "-" + sharedVariables.endYear;
	sharedVariables.nextSchoolYear = sharedVariables.endYear + "-" + (sharedVariables.endYear + 1);
	
	var parentGuideLocation = {
		// Where the Markdown files go
		"md": {
			"en": p.join(parentGuideDir, 'markdown', 'parent_guide.en.md'),
			"fr": p.join(parentGuideDir, 'markdown', 'parent_guide.fr.md')
		},
		// Where the PDF files go
		"pdf": {
			"en": p.join(parentGuideDir, 'pdf', 'parent_guide_' + sharedVariables.startYear + '.en.pdf'),
			"fr": p.join(parentGuideDir, 'pdf', 'parent_guide_' + sharedVariables.startYear + '.fr.pdf')
		}
	};

	var volunteerGuideLocation = {
		// Where the Markdown files go
		"md": {
			"en": p.join(volunteerGuideDir, 'markdown', 'volunteer_guide.en.md'),
			"fr": p.join(volunteerGuideDir, 'markdown', 'volunteer_guide.fr.md')
		},
		// Where the PDF files go
		"pdf": {
			"en": p.join(volunteerGuideDir, 'pdf', 'volunteer_guide.en.pdf'),
			"fr": p.join(volunteerGuideDir, 'pdf', 'volunteer_guide.fr.pdf')
		}
	};

	// In general, Pandoc handles this for us. We go into raw LaTeX sometimes (for e.g., tables)
	// so this does come in handy.
	function texEscape(t) {
		return t.replace(/\\/g, "\\textbackslash").replace(/[{}]/g, "\\$&").
		// Convert Markdown to LaTeX, since we're putting everything into a TeX directive.
		// We only deal with italic and bold currently, plus new paragraphs.
		replace(/_([^_]+?)_(?!_)/g, "\\textit{$1}").replace(/__([^_]+?)__(?!_)/g, "\\textbf{$1}").
		replace(/[&%$#_]/g, "\\$&").
		replace(/~/g, "\\textasciitilde").
		replace(/\^/g, "\\textasciicircum");
	}

	// Get a suitable replacement regular expression for a given variable name.
	function getReplacementRegexp(v) {
		return new RegExp('{%\\s*' + v + '\\s*%}','g');
	}

	// Swap a language path from English to French (or vice versa). Useful for the language picker.
	function swapLanguagePath(path, from, to) {
		var match = path.match(new RegExp('\\/' + from + '\\/(.+)$'));
		if (match) {
			return '../' + to + '/' +match[1];
		}
		grunt.fail.fatal("No match for "+path+" ("+from+", "+to+")");
		return '';
	}

	// Shared variables and asset/media information; we keep these global for ease of access.
	// Populated by the getVariables task.
	var media, assets;

	// Read the navigation structure
	var navJSON = grunt.file.readJSON('config/www.json');
	var pgJSON = grunt.file.readJSON('config/parent_guide.json');
	var vgJSON = grunt.file.readJSON('config/volunteer_guide.json');

	function getFileId(file) {
		var match = file.match(/([^\/.]+)(\.html)?$/);
		if (!match) {
			grunt.fail.fatal("Could not find a file ID for " + file);
		}
		return match[1];
	}

	function getParentPage(currentPage, pages) {
		var i,j;
		var page, child;
		for (i=0; i<pages.length; i++) {
			page = pages[i];
			if (getFileId(page.page) === currentPage) {
				return null;
			}
			if (page.pages) {
				for (j=0; j<page.pages.length; j++) {
					child = page.pages[j];
					if (getFileId(child.page) === currentPage) {
						return page;
					}
				}
			}
		}
		grunt.log.warn("Could not find file " + currentPage + " in the navigation structure.");
		return null;
	}

	// Build the navigation HTML
	function getNavHtml(file, language, parentPage) {
		var currentPage = getFileId(file);
		var pages, css, pageId, parentPageId;

		if (!parentPage) {
			pages = navJSON.pages;
			parentPage = getParentPage(currentPage, pages);
		} else {
			pages = parentPage.pages;
		}

		if (parentPage) {
			parentPageId = getFileId(parentPage.page);
		}

		var html = '<ul class="nav nav-list">';
		pages.forEach(function(page){
			pageId = getFileId(page.page);
			css = [];
			if (currentPage === pageId) {
				css.push('active');
			}
			if (page.pages) {
				css.push('group');
			}
			if (parentPage && (parentPageId === pageId)) {
				css.push('active-group');
			}
			var flattenedPage = page.page.split('/').pop();
			html += (css.length ? '<li class="'+css.join(' ')+'">' : '<li>');
			html += '<a href="' + flattenedPage + '.html">'+page[language]+'</a>';

			// If page is the current page and has children, OR
			// if the current page is a child of page,
			// show page's children in the nav
			if (((currentPage === pageId) && page.pages) ||
				(parentPage && (parentPageId === pageId))) {
				html += getNavHtml(file, language, page);
			}
			html += '</li>';
		});
		html += '</ul>';
		return html;
	}

	// Function to replace all replacement variables with their calculated values.
	function replaceVariables(file, language, options) {
		grunt.verbose.writeln("Replacing variables in " + file);
		
		var r, v;
		var fileContent = grunt.file.read(file);
		var frPath = '', enPath = '', scriptsPath, fileId;

		if (options) {
			frPath = options.frPath || '';
			enPath = options.enPath || '';
			fileId = options.fileId;
		}

		r = getReplacementRegexp('@fr_path');
		fileContent = fileContent.replace(r, frPath);

		r = getReplacementRegexp('@en_path');
		fileContent = fileContent.replace(r, enPath);

		r = getReplacementRegexp('@show_menu');
		if (fileContent.match(r)) {
			fileContent = fileContent.replace(r, getNavHtml(file, language));
		}

		for (v in sharedVariables) {
			r = getReplacementRegexp(v);
			fileContent = fileContent.replace(r, sharedVariables[v]);
		}

		// Media
		for (v in media) {
			r = getReplacementRegexp("@media:"+v);
			fileContent = fileContent.replace(r, options.ignoreMedia ? '' : media[v].link[language]);
		}

		// Assets
		for (v in assets) {
			r = getReplacementRegexp("@asset:"+v);
			fileContent = fileContent.replace(r, options.ignoreAssets ? '' : assets[v].tag[language]);
		}

		// Scripts
		if (fileId) {
			scriptsPath = p.join('./scripts', fileId + '.script');
			r = getReplacementRegexp("@scripts");
			if (grunt.file.exists(scriptsPath)) {
				fileContent = fileContent.replace(r, grunt.file.read(scriptsPath));
			} else {
				fileContent = fileContent.replace(r, '');
			}
		}

		// Non-standard formatting
		// infoBox
		r = new RegExp('<!--\\s*infoBox\\s*-->([\\s\\S]+?)<!--\\s*\/infoBox\\s*-->','gm');
		fileContent = fileContent.replace(r, options.infoBoxMarkup);
		// section
		var beginSection = new RegExp('<!--\\s*section1\\s*-->','gm');
		var endSection = new RegExp('<!--\\s*\/section1\\s*-->','gm');
		fileContent = fileContent.replace(beginSection, options.sectionMarkup.begin).replace(endSection, options.sectionMarkup.end);

		var unreplaced = fileContent.match(/{%.*%}/);
		if (unreplaced) {
			// If we haven't replaced all the variables, raise an error; that indicates a typo'd variable somewhere.
			grunt.fail.fatal("Found an unreplaced variable (" + unreplaced[0] + ") in file " + file + ".");
		}

		return fileContent;
	}

	function parseTableRow(row) {
		return row.match(/[^|\r\n]+/g);
	}

	// Are you ready for some LaTeX command codes? I hope you are, because here they come!
	function tweakMarkdownforPandoc(content) {
		var ti, ri, ci, header, divider, rows, row, columns, column, columnWidths, boundingLine;
		var table, tweakedTable, tweakedTableWidth;
		var tables = content.match(/^\|[\s\S]+?\n[^|]/gm);
		var tableRows, tableColumns;

		function writeRow(r) {
			return r.map(function(t) { return texEscape(t); }).join(" & ") + " \\\\" + grunt.util.linefeed;
		}

		if (tables) {
			for (ti = 0; ti < tables.length; ti++) {
				table = tables[ti];
				tableRows = table.match(/^[\s\S]+?\n/gm);
				tableColumns = parseTableRow(tableRows[0]);

				header = [], rows = [], columnWidths = [];
				for (ci = 0; ci < tableColumns.length; ci++) {
					column = tableColumns[ci].trim();
					
					columnWidths.push(column.length);
					header.push(column);
				}

				// ignore the last line; it's not part of the table
				for (ri = 2; ri < tableRows.length; ri++) {
					row = [];
					columns = parseTableRow(tableRows[ri]);
					for (ci = 0; ci < columns.length; ci++) {
						column = columns[ci].trim();
						row.push(column);
						if (columnWidths[ci] < column.length) {
							columnWidths[ci] = column.length;
						}
					}
					rows.push(row);
				}

				tweakedTable = "\\begingroup \\renewcommand{\\arraystretch}{1.5}" + grunt.util.linefeed;
				tweakedTable += "\\begin{tabularx}{\\textwidth}{ *{" + columnWidths.length+ "}{P} } \\hline" + grunt.util.linefeed;
				//tweakedTable += "\\noindent\\begin{tabular*}{\\columnwidth}{@{\\extracolsep{\\stretch{1}}}*{"+columnWidths.length+"}{P}@{}}  \\hline"
				tweakedTable += writeRow(header);
				tweakedTable += "\\hline" + grunt.util.linefeed;
				// Churn through each row
				for (ri = 0; ri < rows.length; ri++) {
					tweakedTable += writeRow(rows[ri]);
				}
				tweakedTable += "\\hline \\end{tabularx} \\endgroup" + grunt.util.linefeed;

				// Check what the trailing character was; if it's a blank line, add some vertical space.
				// If it's not a blank line, add the character in question with no added space.
				var trailer = table.match(/\n([^|])/m);
				if (trailer[1].match(/[\r\n]/)) {
					tweakedTable += " \\vspace{\\baselineskip} " + trailer[1];
				} else {
					tweakedTable += trailer[1];
				}

				// Replace the table with our tweaked version
				content = content.replace(table, tweakedTable);
			}
		}
		return content;
	}


	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			www: {
				options: { force: true },
				src: [wwwDir]
			},
			parentGuide: {
				options: { force: true },
				src: [parentGuideLocation.md.en, parentGuideLocation.md.fr, parentGuideLocation.pdf.en, parentGuideLocation.pdf.fr]
			},
			volunteerGuide: {
				options: { force: true },
				src: [volunteerGuideLocation.md.en, volunteerGuideLocation.md.fr, volunteerGuideLocation.pdf.en, volunteerGuideLocation.pdf.fr]
			}
		},
		md2html: {
			options: {},
			en: {
				options: {
					layout: 'templates/main.en.html'
				},
				files: [{
					expand: true,
					flatten: true,
					src: flattenPages(navJSON.pages).map(function(page) { return p.join('content', page.page + '.en.md'); }),
					dest: p.join(wwwDir,'en'),
					ext: '.html'
				}]
			},
			fr: {
				options: {
					layout: 'templates/main.fr.html'
				},
				files: [{
					expand: true,
					flatten: true,
					src: flattenPages(navJSON.pages).map(function(page) { return p.join('content', page.page + '.fr.md'); }),
					dest: p.join(wwwDir,'fr'),
					ext: '.html'
				}]
			}
		},
		postProcHtml: {
			options: {},
			en: {
				files: [{
					expand: true,
					src: p.join(wwwDir,'en','*.html'),
					dest: '.',
					ext: '.html'
				}]
			},
			fr: {
				files: [{
					expand: true,
					src: p.join(wwwDir,'fr','*.html'),
					dest: '.',
					ext: '.html'
				}]
			}
		},
		copy: {
			media: {
				files: [
					{expand: true, flatten: true, src: [parentGuideLocation.pdf.en, parentGuideLocation.pdf.fr], dest: 'media'},
					{expand: true, flatten: true, src: [volunteerGuideLocation.pdf.en, volunteerGuideLocation.pdf.fr], dest: 'media'},
					{expand: true, src: ['media/**'], dest: wwwDir},
				]
			},
			assets: {
				files: [{expand: true, src: ['assets/**'], dest: wwwDir}]
			},
			stylesheets: {
				files: [{expand: true, src: ['css/**'], dest: wwwDir}]
			}
		},
		watch: {
			build: {
				files: ['Gruntfile.js','config/variables.json','media/media.json','assets/assets.json','content/*.md','content/www/*.md','templates/*.html','scripts/*'],
				tasks: ['getVariables', 'md2html', 'postProcHtml']
			},
			styles: {
				files: ['css/**'],
				tasks: ['copy:stylesheets']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-md2html');
	grunt.registerMultiTask('postProcHtml', 'Substitute variables in our generated HTML', function() {
		var language = this.target, content, frPath, enPath, src;
		var infoBoxMarkup = '<div class="infoBox">$1</div>';
		var sectionMarkup = {begin: '', end: ''};
		this.files.forEach(function(file) {
			src = file.src[0];
			if (language === 'fr') {
				frPath = src;
				enPath = swapLanguagePath(frPath,'fr','en');
			} else if (language === 'en') {
				enPath = src;
				frPath = swapLanguagePath(enPath,'en','fr');
			}
			var content = replaceVariables(src, language, {enPath: enPath, frPath: frPath, fileId: getFileId(src), infoBoxMarkup: infoBoxMarkup, sectionMarkup: sectionMarkup});
			grunt.file.write(file.dest, content);
			grunt.verbose.writeln('Processed "' + file.dest + '".');
		});
	});
	function postProcDocMarkdown(outputLocation) {
		var content;
		var infoBoxMarkup = function(a,s) { return '\\vspace{8pt} \\setlength{\\fboxsep}{6pt} \\framebox {\\parbox {\\linewidth} {\\textbf{NOTE: }' +
			texEscape(s).replace(/\r?\n\r?\n/gm, "\\\\\\\\") + // replace double newlines with 4 backslashes, which we define here using 8 backslashes
			'}} \\vspace{8pt}'; };
		var sectionMarkup = {begin: '\\noindent\\begin{minipage}{\\linewidth}', end: '\\end{minipage}'};
		content = replaceVariables(
			outputLocation.md.en,
			'en',
			{ignoreAssets: true, ignoreMedia: true, infoBoxMarkup: infoBoxMarkup, sectionMarkup: sectionMarkup}
		);
		content = tweakMarkdownforPandoc(content);
		grunt.file.write(outputLocation.md.en, content);
		content = replaceVariables(
			outputLocation.md.fr,
			'fr',
			{ignoreAssets: true, ignoreMedia: true, infoBoxMarkup: infoBoxMarkup, sectionMarkup: sectionMarkup}
		);
		content = tweakMarkdownforPandoc(content);
		grunt.file.write(outputLocation.md.fr, content);
	}
	grunt.registerTask('postProcParentGuideMarkdown', 'Substitute variables in our Markdown and generate a PDF', function() {
		postProcDocMarkdown(parentGuideLocation);
	});
	grunt.registerTask('postProcVolunteerGuideMarkdown', 'Substitute variables in our Markdown and generate a PDF', function() {
		postProcDocMarkdown(volunteerGuideLocation);
	});

	grunt.registerTask('getVariables', function() {
		// Read the media information
		media = grunt.file.readJSON('media/media.json');
		assets = grunt.file.readJSON('assets/assets.json');

		// Update the path info for the parent guide
		media.parent_guide_en.path = p.basename(parentGuideLocation.pdf.en);
		media.parent_guide_fr.path = p.basename(parentGuideLocation.pdf.fr);

		var v, mediaInfo, assetInfo, stats, fileSizeInBytes, dimensions;

		function buildMediaLink(mediaInfo, language) {
			var link = "<a href=\"../media/"+mediaInfo.path+"\">";
			if (mediaInfo.icon) {
				link += '<img src="../assets/media/' + mediaInfo.icon + '.png" class="fileIcon">';
			}
			link += mediaInfo[language] + ' (' + mediaInfo.fileSize + ((language === 'en') ? 'kB' : 'ko') + ')';
			link += "</a>";

			return link;
		}

		function buildAssetTag(assetInfo, language) {
			var img = '<img src="../assets/' + assetInfo.path + '" width="' + assetInfo.width + '" height="' + assetInfo.height + '"';
			return img + ' alt="' + assetInfo[language] + '">';
		}

		// Get the media metadata
		for (v in media) {
			mediaInfo = media[v];
			try {
				stats = fs.statSync(p.join('./media', mediaInfo.path));
			} catch (e) {
				grunt.log.warn("Could not retrieve file statistics for " + mediaInfo.path + " in media.json");
				stats = {size: 1024};
			}
			fileSizeInBytes = stats["size"];
			// Convert the file size to kB
			mediaInfo.fileSize = Math.ceil(fileSizeInBytes / 1024);

			mediaInfo.link = {
				en: buildMediaLink(mediaInfo, "en"),
				fr: buildMediaLink(mediaInfo, "fr")
			}
		}

		// Get the asset metadata
		for (v in assets) {
			assetInfo = assets[v];
			if (['png','jpeg','gif'].indexOf(assetInfo.type) < 0) {
				grunt.fail.fatal("There's no logic to deal with non-image assets... yet.");
			}
			dimensions = imgSize(p.join('./assets', assetInfo.path));
			assetInfo.width = dimensions.width;
			assetInfo.height = dimensions.height;

			assetInfo.tag = {
				en: buildAssetTag(assetInfo, "en"),
				fr: buildAssetTag(assetInfo, "fr")
			}
		}
	});

	function flattenPages(pages, level) {
		if (!level) {
			level = 1;
		}
		var retval = [];
		pages.forEach(function(page) {
			retval.push({page: page.page, concat: page.concat, level: level});
			if (page.pages) {
				retval = retval.concat(flattenPages(page.pages, level + 1));
			}
		});
		return retval;
	}

	var fileSep = grunt.util.linefeed + grunt.util.linefeed;
	function prepMdForAppend(content, filename) {
		if (content) {
			// Clean up trailing whitespace and separate from the preceding document
			content = content.replace(/[\s\r\n]+$/, '');
			content += fileSep;
		}
		return content;
	}

	function concatMarkdown(pageJSON, outputLocation) {
		var pages = flattenPages(pageJSON.pages);
		[{dest: outputLocation.md.en, language: 'en'}, {dest: outputLocation.md.fr, language: 'fr'}].forEach(function(o) {
			var language = o.language, dest = o.dest;
			var content = '', fileContent = '';
			pages.forEach(function(page) {
				content = prepMdForAppend(content);

				fileContent = grunt.file.read(p.join('content', page.page + '.' + language + '.md'));
				if (page.level > 1) {
					// Move all headers down a level
					fileContent = fileContent.replace(/^#/gm, '##');
				} else {
					content += "\\newpage" + grunt.util.linefeed + grunt.util.linefeed;
				}
				content += fileContent;
			});
			grunt.file.write(dest, content);
		});
	}

	grunt.registerTask('concatParentGuide', function() {
		concatMarkdown(pgJSON, parentGuideLocation);
	});

	grunt.registerTask('concatVolunteerGuide', function() {
		concatMarkdown(vgJSON, volunteerGuideLocation);
	});

	grunt.registerTask('concatWww', function() {
		var pages = flattenPages(navJSON.pages);
		pages.forEach(function(page) {
			if (page.concat) {
				var enContent = '', frContent = '';

				page.concat.forEach(function(toConcat) {
					// Clean up trailing whitespace and separate from the preceding document
					enContent = prepMdForAppend(enContent);
					frContent = prepMdForAppend(frContent);

					enContent += grunt.file.read(p.join('content', toConcat + '.en.md'));
					frContent += grunt.file.read(p.join('content', toConcat + '.fr.md'));
				});

				grunt.file.write(p.join('content', page.page + '.en.md'), enContent);
				grunt.file.write(p.join('content', page.page + '.fr.md'), frContent);
			}
		});
	});

	var childProcess = require('child_process');

	function spawnPandoc(done, language, outputLocation, options) {
		if (language) {
			var pandocMd2Pdf, pandocTex2Pdf, fileContent;

			// Create a dummy file; this makes sure the directory is created before pandoc tries to interact with it
			grunt.file.write(outputLocation.pdf[language], '');

			// --smart converts straight quotes/apostrophes to curly ones
			// --latex-engine=xelatex gets accented characters working as expected
			var cmd = 'pandoc -s -o {dest} {src} --template pandoc.template --smart --latex-engine=xelatex -V geometry:"top=1in, bottom=1in, width=5in"';
			if (options && options.toc) {
				cmd += " --toc"
			}

			pandocMd2Pdf = childProcess.exec(cmd.replace(/\{src\}/g, outputLocation.md[language]).replace(/\{dest\}/g, outputLocation.pdf[language]),
				function (error, stdout, stderr) {
				if (error) {
					console.log(error.stack);
					console.log('Error code: '+error.code);
					console.log('Signal received: '+error.signal);
				}
			});
			pandocMd2Pdf.on('exit', function (code) {
				if (code != 0) {
					grunt.verbose.writeln('Pandoc process exited with error code '+code);
				}
				done(code == 0);
			});
		} else {
			grunt.fail.fatal("Couldn't determine language for pandoc task.");
		}
	}
	grunt.registerTask('spawnParentGuidePandoc', function() {
		options = {toc: true};
		var done = this.async();
		var codes = {};
		spawnPandoc(function(code) {codes.en = code; if (codes.fr !== undefined) {done(codes.en && codes.fr);}}, 'en', parentGuideLocation, options);
		spawnPandoc(function(code) {codes.fr = code; if (codes.en !== undefined) {done(codes.en && codes.fr);}}, 'fr', parentGuideLocation, options);
	});
	grunt.registerTask('spawnVolunteerGuidePandoc', function() {
		var done = this.async();
		var codes = {};
		spawnPandoc(function(code) {codes.en = code; if (codes.fr !== undefined) {done(codes.en && codes.fr);}}, 'en', volunteerGuideLocation);
		spawnPandoc(function(code) {codes.fr = code; if (codes.fr !== undefined) {done(codes.en && codes.fr);}}, 'fr', volunteerGuideLocation);
	});
	
	grunt.registerTask('buildDocs', ['concatParentGuide', 'concatVolunteerGuide',
		'postProcParentGuideMarkdown', 'postProcVolunteerGuideMarkdown',
		'spawnParentGuidePandoc', 'spawnVolunteerGuidePandoc']);

	grunt.registerTask('buildWebsite', ['copy','getVariables','concatWww','md2html','postProcHtml']);

	// Default task(s).
	grunt.registerTask('default', ['clean','buildDocs','buildWebsite']);
};