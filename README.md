Authoring the Pomme D’Api website
=================================

Besides the basic technologies of the web (HTML, CSS, JavaScript),
you’ll need to familiarize yourself with a couple other technologies:
Markdown and Grunt. Don’t worry, it’ll all be pretty painless.

Markdown
========

The website uses a simple formatting syntax called “Markdown” to define
its formatting. If you’re familiar with wiki-style markup, you’ll feel
quite at home with Markdown. The two main reasons for using Markdown
are:

1.  It’s simpler than raw HTML. Since non-technical people will be
    providing content for the website, it’s kinder on them to provide a
    text file rather than nicely-formatted HTML.
2.  It provides more consistent styling than user-provided HTML. If
    someone is using something like Microsoft Word to edit HTML, it adds
    all sorts of funky inline CSS that can be hard to remove. If we pull
    everything in via Markdown, we end up with a much simpler structure
    (unstyled \<h1\>s and \<ul\>s and so forth) that we can control via
    stylesheets.

</p>
You can find the Markdown syntax at [Daring Fireball][].

You can find all the Markdown files the website uses in the `src/content`
directory. Each file comes in English (.en.md) and French (.fr.md)
flavors.

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
    `npm install -g grunt-cli`{.block} from the command line / terminal.
    “npm” is the node package manager, the -g means “install globally”,
    and grunt-cli is Grunt’s command-line interface.
3.  And… that’s it.

Using Grunt
-----------

Now that you’ve got everything installed, you can build the website!
From the command line / terminal, navigate to the Pomme D’Api project
directory (tip: it’s probably where you found this file).

1.  Run `npm install`{.block} to install all the components you’ll need
    before you can build.
2.  Run `grunt`{.block} Grunt will run through the various build
    commands in Gruntfile.js, the end result of which will be a
    freshly-built version of the website in the `www` directory.

</p>
I’ve configured a “watch” task that will monitor the source directories
and rebuild the site when files change. Run `grunt watch` to take
advantage of this.

Project structure
=================

As previously mentioned, most of the site content is in the `content`
directory in Markdown format. There are some other important files to be
aware of, though.

Templates
---------

The site page template is in the `templates` directory in English and
French flavors.

Variables
---------

Variables shared between files can go in `variables.json`. Putting
shared values here can be really helpful when, say, the school’s phone
number changes, or the registration fee changes. Both of these events
happened recently, and we updated the information on some pages and
missed others. Hopefully `variables.json` will help mitigate this
problem in the future.

To use a variable in your markdown, enclose it in `{% %}`. For example,
if you want to write Pomme d’Api’s phone number to the page, you’d write
`{% telephone_number %}`

Navigation
----------

The web site’s navigation structure is in `nav/nav.json`. There’s a
`pages` property that contains an array of the top-level pages. Each of
these pages can have an array of sub-pages. Each page has a page ID
(`page`), and English and French strings to describe the page (`en` and
`fr` respectively). The build process will inspect this file to generate
the left-hand nav on each HTML page. Note: the current build process
assumes there are only two “levels” of pages.

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


  [Daring Fireball]: https://daringfireball.net/projects/markdown/syntax
  [Node.js]: http://nodejs.org
  [Node.js website]: http://nodejs.org/
