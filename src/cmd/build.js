// Compile the ./md folder into ./dist with HTML artifacts n' such

const fs = require('fs');
const path = require('path');
const marked = require('marked');
const hijs = require('highlight.js');
const childProcess = require('child_process');
const { promisify } = require('util');
const execShell = promisify(childProcess.exec);


// The blog article page template
const articlePage = ({title, content, timestamp, prev, next}) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${title}</title>
  <link rel="stylesheet" href="main.css">
</head>
<body>
  <main class="main">
    <article class="article">
      <h1>${title}</h1>
      <time class="timestamp">${timestamp}</time>
      ${content}
    </article>
    <footer class="article-footer">
      ${!prev ? '' :
        `<a class="prev-article" href="${prev.filename}">
          ← ${prev.title}
        </a>`
      }
      ${!next ? '' :
        `<a class="next-article" href="${next.filename}">
          ${next.title} →
        </a>`
      }
    </footer>
  </main>
</body>
</html>
`;


// The /blog/index.html template
const articlesPage = ({articles}) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Christopher Davies | Blog</title>
  <link rel="stylesheet" href="main.css">
</head>
<body>
  <main class="main article-list">
    <h1>Christopher Davies | Blog</h1>
    ${articles.map(({title, timestamp, filename}) =>
      `<a class="article-list-link" href="${filename}">
        <span class="article-list-title">${title}</span>
        <time class="article-list-timestamp">${timestamp}</time>
      </a>`
    ).join('\n')}
  </main>
</body>
</html>
`;


// The root /index.html template, just redirects to the latest article
const rootIndexPage = (url) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Christopher Davies | Blog</title>
  <link rel="stylesheet" href="main.css">
</head>
<body>
  <article class="article">
    Redirecting to <a href="${url}">${url}</a>.
    <script>
      window.location.assign(${JSON.stringify(url)})
    </script>
  </article>
</body>
</html>
`;


function readMdFile(mdFile) {
  return fs.readFileSync(path.join('./src/md', mdFile)).toString();
}


function loadArticleListItem(mdFile) {
  const [yyyy, mm, dd] = mdFile.split('-');
  const mdContent = readMdFile(mdFile);
  const titleEnd = mdContent.indexOf('\n');
  const title = mdContent.slice(0, titleEnd).replace('#', '').trim();
  const timestamp = `${yyyy}-${mm}-${dd}`;
  const filename = `${path.basename(mdFile, '.md')}.html`;

  return { title, timestamp, filename, mdFile };
}

// Convert a markdown file to HTML
function writeArticle(article, prev, next) {
  const mdContent = readMdFile(article.mdFile);
  const titleEnd = mdContent.indexOf('\n');
  const content = marked(mdContent.slice(titleEnd), {
    highlight(code, lang) {
      return hijs.highlight(lang, code).value;
    },
  });
  const html = articlePage({
    ...article,
    content,
    prev,
    next,
  });

  fs.writeFileSync(`./dist/blog/${article.filename}`, html);
}


// Convert ./md/*.md files to blog articles
async function build() {
  // Clear out the build directory
  await execShell('rm -rf ./dist');

  // Ensure the blog directory exists.
  fs.mkdirSync('./dist/blog', { recursive: true });

  // Convert each markdown file to HTML, and extract the article
  // info for use in building an index page.
  const articles = fs.readdirSync('./src/md')
    .map(loadArticleListItem)
    .sort((a, b) => b.filename.localeCompare(a.filename));

  articles.forEach((article, i) => writeArticle(article, articles[i-1], articles[i+1]));
  fs.writeFileSync(`./dist/blog/index.html`, articlesPage({articles}));
  fs.writeFileSync(`./dist/index.html`, rootIndexPage(`blog/${articles[0].filename}`));

  // TODO: Prolly should optimize CSS via postcss or something...
  fs.copyFileSync('./src/css/main.css', './dist/blog/main.css');

  fs.copyFileSync('./src/img/favicon.ico', './dist/favicon.ico');
}


// Do the thing.
build();