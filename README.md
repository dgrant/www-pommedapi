Authoring the Pomme d’Api website
=================================

Besides the basic technologies of the web (HTML, CSS, JavaScript),
you’ll need to familiarize yourself with a couple other technologies:
Markdown and Grunt. You'll also need to install a couple pieces of software
(Pandoc and LaTex) to generate the Parent Guide PDFs.

Don’t worry, it’ll all be pretty painless.

Markdown
========

The website and documents use a simple formatting syntax called “Markdown” to define
their formatting. If you’re familiar with wiki-style markup, you’ll feel
quite at home with Markdown. The two main reasons for using Markdown
are:

1.  It’s simpler than raw HTML. Since non-technical people will be
    providing content for the website, it’s kinder on them to provide a
    text file rather than nicely-formatted HTML.
2.  It provides more consistent styling than user-provided HTML. If
    someone is using something like Microsoft Word to edit HTML, it adds
    all sorts of funky inline CSS styles that can be hard to remove. If we pull
    everything in via Markdown, we end up with a much simpler structure
    (unstyled \<h1\>s and \<ul\>s and so forth) that we can control via
    stylesheets.

You can find the Markdown syntax at [Daring Fireball][].

You can find all the Markdown files the website uses in the `src/content`
directory. Each file comes in English (.en.md) and French (.fr.md)
flavors.

Markdown extensions
-------------------

Some formatting we need in our documents isn't supported by Markdown. The
Grunt build will interpret these commands and format appropriately in
HTML and PDF:

### Info Boxes

`&lt;-- infoBox --&gt;` content `&lt;-- /infoBox --&gt;`  

Putting content between the above tags will put it in a callout box to
call special attention to it.

### Tables

You can create tables by using multiple lines starting and ending with a pipe |.
Each column of the table should be separated by a pipe.

The first row of the table will be used as the table header. The second row should
be a series of pipe-separated hyphens. The following rows should be the table content
(again, each column separated with a pipe).

See tuition.en.md for an example.

Pandoc
======

[Pandoc] is a program that can convert a variety of document types to a variety of
other document types. The two types we're interested in here are Markdown and PDF.

Install [Pandoc].

Unfortunately, Pandoc can't create PDF files without help from LaTeX, a powerful
document formatting language. Which brings us to...

MikTex
======

[MikTex] is a Windows implementation of LaTeX. You'll need to install it in order to
generate PDF files using Pandoc.

Assuming you install with the default options, the first time you run the documentation
Grunt task (see below) you'll see a bunch of install confirmation dialogs as MikTex
installs the various modules it needs. This will only happen the one time.

If you're not running Windows (e.g., Linux, OSX) you probably already have LaTex
installed so just use the one that comes bundled with your OS.

Grunt
=====

Grunt is a very handy (and cross-platform) build tool for web
application projects. It’s based on [Node.js][] and, while you’ll need
to install Node, you don’t really need to know how it works.

Installing Grunt
----------------

1.  Install Node.js. The [Node.js website][] should lead you through the
    steps. Make sure that the option to add Node.js to your PATH is
    selected, or do it yourself after the install I guess.
2.  Install the Grunt CLI (command-line interface). Run
    `npm install -g grunt-cli` from the command line / terminal.
    “npm” is the node package manager, the -g means “install globally”,
    and grunt-cli is Grunt’s command-line interface.
3.  And… that’s it.

Build
-----

Now that you’ve got everything installed, you can build the website and documents!
From the command line / terminal, navigate to the Pomme D’Api project
directory (under `src/`).

1.  Run `npm install` to install all the components you’ll need
    before you can build.
2.  Run `grunt`. Grunt will run through the various build
    commands in Gruntfile.js, the end result of which will be a
    freshly-built version of the website in the `www/` directory
    and the parent guide PDFs in `doc/parentGuide/pdf`; they'll be
    copied to the appropriate directory in `www/` as well, so
    when you deploy the website it'll always link to the latest
    version of the docs.

Build the website
-----------------

We’ve configured a “watch” task that will monitor the source directories
and rebuild the site when files change. Run `grunt watch` to take
advantage of this. The watch won't rebuild the PDFs (since this is a pretty
heavy process); you can rebuild just the docs with `grunt buildDocs` (see below).

Build the Parent Guide
----------------------

Follow the build instructions, but instead of running `grunt` run `grunt buildDocs`.

Project structure
=================

As previously mentioned, most of the site content is in the `content`
directory in Markdown format. If a file is specific to the website or
parent guide, it'll be in `www` or `parentGuide`, respectively.
There are some other important files to be aware of, though.

Templates
---------

The website page template is in the `templates` directory in English and
French flavors. The LaTex template used in the PDF generation is a file
called `pandoc.template` in the root `src` directory.

Variables
---------

Variables shared between files should go in `variables.json`. Putting
shared values here can be really helpful when, say, the school’s phone
number changes, or the registration fee changes. Both of these events
happened recently, and we updated the information on some pages and
missed others. Hopefully `variables.json` will help mitigate this
problem in the future.

To use a variable in your markdown, enclose it in `{% %}`. For example,
if you want to write Pomme d’Api’s phone number to the page, you’d write
`{% telephoneNumber %}`. If/when the value is changed in variables.json
and the website and docs are rebuilt, all references to `{% telephoneNumber %}`
will reflect the new value.

Navigation
----------

The web site’s navigation structure is in `config/www.json`. There’s a
`pages` property that contains an array of the top-level pages. Each of
these pages can have an array of sub-pages. Each page has a page ID
(`page`), and English and French strings to describe the page (`en` and
`fr` respectively). The build process will inspect this file to generate
the left-hand nav on each HTML page. Note: the current build process
assumes there are only two “levels” of pages.

The Parent Guide's structure is likewise stored in `config/parent_guide.json`.
This file doesn't require description strings as in www.json (the page
titles are used directly) and it supports more than two navigation
levels.

Assets
------

`assets.json` has information about the assets we use in the Markdown
which, at the time I’m writing this, is two image files. Since the only
assets we have are images, the code only handles images… and will choke
if you pass anything else through. Assets have a `path` (relative to the
`assets` directory, English and French descriptive strings (`en` and
`fr` respectively), and a `type` (png, jpeg, and gif).

Include assets in your Markdown using the `{% @asset:... %}` replacement
variable (replace `...` with the asset name). Assets are rendered
in-place in the page.

Media
-----

Assets that we don’t directly display (e.g., PDF documents) are listed
in `media.json`. Media files have a `path` (relative to the `media`
directory, English and French descriptive strings (`en` and `fr`
respectively), and an `icon`, assumed to be a 32x32 png in the
`assets/media` directory.

Include media files in your Markdown using the `{% @media:... %}`
replacement variable (replace `...` with the asset name). Media files
are rendered as links.

JavaScript
==========

This rewrite obviated the need to use JavaScript, but we might need to
do fancy things in the future. There’s a directory called `scripts` that
we can use to include arbitrary script in our pages; if there’s a
`xyz.script` file in that directory that matches a `xyz.[en|fr].md` file
in the `content` directory, it’ll be included verbatim at the end of
`xyz.html`. If script is required by ALL pages, then put that in the
templates.

Troubleshooting
===============

I get a weird error in the clean step
-------------------------------------

The clean step tries to delete the old files before generating the new files,
but it can easily run into problems if you, say, have the PDF directory open
in an Explorer window or have the PDF file open in Adobe Reader. The error
should give you enough information on what went wrong so that you can fix it.
If it's the aforementioned Explorer problem, rerunning the command will
result in success. If it's the aforementioned Adobe Reader problem, you'll need
to close the document before the build can succeed.

Accents/apostrophes don't show up in the PDF
--------------------------------------------

You need to save the .md file with a `UTF-8` encoding. How you go about this
depends on the editor you're using, but pretty much any text editor will have
an Encoding menu somewhere.

PDF formatting isn't quite right
--------------------------------

Generating a PDF automatically turns out to be pretty difficult, and tweaking
the output to get things just right is even more difficult. In general, if
you ignore things that are just a little bit off, you'll lead a much happier
life than if you try to change things...

If you absolutely must change something, Pandoc allows you to embed LaTex
directives in the Markdown files. These directives are ignored in the HTML
output, so you shouldn't end up with \\newpage lines scattered around the
website.

  [Daring Fireball]: https://daringfireball.net/projects/markdown/syntax
  [Node.js]: http://nodejs.org
  [Node.js website]: http://nodejs.org/
  [Pandoc]: http://johnmacfarlane.net/pandoc/installing.html
  [MikTex]: http://miktex.org/
