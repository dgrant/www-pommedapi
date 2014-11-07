module.exports = function(grunt) {
	var wwwDir = "../www/";
	var parentGuideDir = "../doc/parentGuide";

	var p = require("path"); // Load the path manipulation module
	var fs = require("fs"); // Load the filesystem module
	var imgSize = require("image-size"); // image-size tells us the size of images. Go figure!
	
	// RO: parent guide support is not in yet. Just placeholder right now
	var parentGuideLocation = {
		"en": p.join(parentGuideDir, 'parent_guide.en.md'),
		"fr": p.join(parentGuideDir, 'parent_guide.fr.md')
	};

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
	var sharedVariables, media, assets;

	// Read the navigation structure
	var navJSON = grunt.file.readJSON('config/www.json');
	var pgJSON = grunt.file.readJSON('config/parent_guide.json');

	function getParentPage(currentPage, pages) {
		var i,j;
		var page, child;
		for (i=0; i<pages.length; i++) {
			page = pages[i];
			if (page.page === currentPage) {
				return null;
			}
			if (page.pages) {
				for (j=0; j<page.pages.length; j++) {
					child = page.pages[j];
					if (child.page === currentPage) {
						return page;
					}
				}
			}
		}
		grunt.fail.fatal("Could not find file " + currentPage + " in the navigation structure.");
		return null;
	}

	function getFileId(file) {
		var match = file.match(/([^\/]+)\.html$/);
		if (!match) {
			grunt.fail.fatal("Could not find a file ID for " + file);
		}
		return match[1];
	}

	// Build the navigation HTML
	function getNavHtml(file, language, parentPage) {
		var currentPage = getFileId(file);
		var pages, css;

		if (!parentPage) {
			pages = navJSON.pages;
			parentPage = getParentPage(currentPage, pages);
		} else {
			pages = parentPage.pages;
		}

		var html = '<ul class="nav nav-list">';
		pages.forEach(function(page){
			css = [];
			if (currentPage === page.page) {
				css.push('active');
			}
			if (page.pages) {
				css.push('group');
			}
			if (parentPage && (parentPage.page === page.page)) {
				css.push('active-group');
			}
			html += (css.length ? '<li class="'+css.join(' ')+'">' : '<li>');
			html += '<a href="' + page.page + '.html">'+page[language]+'</a>';

			// If page is the current page and has children, OR
			// if the current page is a child of page,
			// show page's children in the nav
			if (((currentPage === page.page) && page.pages) ||
				(parentPage && (parentPage.page === page.page))) {
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

		r = getReplacementRegexp('fr_path');
		fileContent = fileContent.replace(r, frPath);

		r = getReplacementRegexp('en_path');
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
			fileContent = fileContent.replace(r, media[v].link[language]);
		}

		// Assets
		for (v in assets) {
			r = getReplacementRegexp("@asset:"+v);
			fileContent = fileContent.replace(r, assets[v].tag[language]);
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

		var unreplaced = fileContent.match(/{%.*%}/);
		if (unreplaced) {
			// If we haven't replaced all the variables, raise an error; that indicates a typo'd variable somewhere.
			grunt.fail.fatal("Found an unreplaced variable (" + unreplaced[0] + ") in file " + file + ".");
		}

		return fileContent;
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
				src: [parentGuideDir]
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
					src: 'content/*.en.md',
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
					src: 'content/*.fr.md',
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
				files: [{expand: true, src: ['media/**'], dest: wwwDir}]
			},
			assets: {
				files: [{expand: true, src: ['assets/**'], dest: wwwDir}]
			},
			stylesheets: {
				files: [{expand: true, src: ['css/**'], dest: wwwDir}]
			}
		},
		concat: {
			parentGuide: {
				options: { separator: grunt.util.linefeed + grunt.util.linefeed },
				files: [
					{src: pgJSON.pages.map(function(v) { return p.join('content', v + '.en.md'); }), dest: parentGuideLocation.en},
					{src: pgJSON.pages.map(function(v) { return p.join('content', v + '.fr.md'); }), dest: parentGuideLocation.fr}
				]
			}
		},
		watch: {
			build: {
				files: ['Gruntfile.js','config/variables.json','media/media.json','assets/assets.json','content/*.md','templates/*.html','scripts/*'],
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
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-md2html');
	grunt.registerMultiTask('postProcHtml', 'Substitute variables in our generated HTML', function() {
		var language = this.target, content, frPath, enPath, src;
		grunt.log.writeln('language = ' + language);
		this.files.forEach(function(file) {
			src = file.src[0];
			if (language === 'fr') {
				frPath = src;
				enPath = swapLanguagePath(frPath,'fr','en');
			} else if (language === 'en') {
				enPath = src;
				frPath = swapLanguagePath(enPath,'en','fr');
			}
			var content = replaceVariables(src, language, {enPath: enPath, frPath: frPath, fileId: getFileId(src)});
			grunt.file.write(file.dest, content);
			grunt.verbose.writeln('Processed "' + file.dest + '".');
		});
	});
	grunt.registerTask('postProcDocMarkdown', 'Substitute variables in our Markdown and generate a docx/PDF', function() {
		var content;
		content = replaceVariables(parentGuideLocation.en, 'en');
		grunt.file.write(parentGuideLocation.en, content);
		content = replaceVariables(parentGuideLocation.fr, 'fr');
		grunt.file.write(parentGuideLocation.fr, content);
	});
	grunt.registerTask('getVariables', function() {
		// Read the shared variables, media information
		sharedVariables = grunt.file.readJSON('config/variables.json');
		media = grunt.file.readJSON('media/media.json');
		assets = grunt.file.readJSON('assets/assets.json');

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
			stats = fs.statSync(p.join('./media', mediaInfo.path));
			if (!stats) {
				grunt.fail.fatal("Could not retrieve file statistics for " + mediaInfo.path + " in media.json");
			}
			fileSizeInBytes = stats["size"];
			// Convert the file size to kB
			mediaInfo.fileSize = Math.round(fileSizeInBytes / 1024);

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
	
	grunt.registerTask('buildDocs', ['getVariables','concat:parentGuide','postProcDocMarkdown']);

	// Default task(s).
	grunt.registerTask('default', ['clean','getVariables','copy','md2html','postProcHtml']);
};