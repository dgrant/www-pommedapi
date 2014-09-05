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
    steps. Make sure that the option to add Node.js to your path is
    selected, or do it yourself after the install I guess.
2.  Install the Grunt CLI (command-line interface). Run
    `npm install -g grunt-cli`{.block} from the command line / terminal.
    “npm” is the node package manager, the -g means “install globally”,
    and grunt-cli is Grunt’s command-line interface.
3.  And… that’s it.

Using Grunt
-----------

Now that you’ve got everything installed, you can build the website!
From the command line / ter

</div>

  [Daring Fireball]: https://daringfireball.net/projects/markdown/syntax
  [Node.js]: http://nodejs.org
  [Node.js website]: http://nodejs.org/
