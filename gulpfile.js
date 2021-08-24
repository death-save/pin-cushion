const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const archiver = require('archiver');
const stringify = require('json-stringify-pretty-compact');
const jsdoc2md = require('jsdoc-to-markdown');
const { parallel, series } = require('gulp');
const zip = require('gulp-zip');
const gulp = require('gulp');
const version = require('./package.json').version;
const fetch = require('node-fetch');
const argv = require('yargs').argv;

function docs(done) {
  jsdoc2md
    .render({ files: ['modules/*.?(m)js', '*.js'], configure: 'jsdoc-conf.json' })
    .then((output) => fs.writeFileSync('api.md', output));
  return done();
}

async function patrons(done) {
  const patrons = await fetchPatrons();
  const uniquePatrons = patrons.filter((v, i, a) => {
    return a.findIndex((t) => t.attributes.full_name === v.attributes.full_name) === i;
  });

  const activePatrons = uniquePatrons.filter((m) => m.attributes.patron_status === 'active_patron');
  const patronList = [];
  for (let p of activePatrons) {
    const nameParts = p.attributes.full_name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 && nameParts[1].length ? nameParts[1] : '';
    const lastInitial = lastName ? lastName.substr(0, 1) : '';
    const name = lastInitial ? `${firstName} ${lastInitial}` : `${firstName}`;

    const patron = {
      name,
    };

    patronList.push(patron);
  }

  fs.writeFileSync('patrons.json', JSON.stringify(patronList, null, 4));
  console.log(activePatrons.length);

  return done();
}

/**
 * Build JavaScript
 */
function buildJS() {
  return (
    gulp
      .src([
        'src/**/*.js',
        '!dist/**',
        '!out/**',
        '!jsdoc/**',
        '!node_modules/**',
        '!.gitignore',
        '!gulpfile.js',
        '!package.json',
        '!package-lock.json',
      ])

      // // eslint() attaches the lint output to the "eslint" property
      // // of the file object so it can be used by other modules.
      // .pipe(eslint())
      // // eslint.format() outputs the lint results to the console.
      // // Alternatively use eslint.formatEach() (see Docs).
      // .pipe(eslint.format())
      // // To have the process exit with an error code (1) on
      // // lint error, return the stream and pipe to failAfterError last.
      // .pipe(eslint.failAfterError())

      .pipe(gulp.dest('dist'))
  );
}

async function fetchPatrons(patrons = [], nextPage = null) {
  const accessToken = fs.readFileSync('patreon_key.txt', 'utf-8');
  const campaignId = '5254689';
  const url = `https://www.patreon.com/api/oauth2/v2/campaigns/${campaignId}/members`;
  const query = '?fields%5Bmember%5D=full_name,patron_status';
  const pagination = nextPage ? `&page%5Bcursor%5D=${nextPage}` : '';

  let myHeaders = new fetch.Headers();
  myHeaders.append('Authorization', `Bearer ${accessToken}`);
  myHeaders.append(
    'Cookie',
    '__cfduid=d0ff53e0a0f52232bc3d071e4e41b36f11601349207; patreon_device_id=aa72995a-d296-4e22-8336-fba6580fa49b; __cf_bm=6d8302a7c059da3dc166c9718f7372a386a1911c-1601350627-1800-AXgBmtTqEn83/w2Ka4Mq+ewtUVrvq5+bZppjqM6WDA2ofb1XwF22RNcARQzzHOF2S9K/A2UUeVUnfInGOwqJ6qk=',
  );

  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
  };

  const response = await fetch(`${url}${query}${pagination}`, requestOptions);
  //console.log(response);
  const json = await response.json();
  //console.log(json);
  const data = json.data;
  //console.log(data);
  const responseNextPage =
    json.meta && json.meta.pagination && json.meta.pagination.cursors ? json.meta.pagination.cursors.next : null;
  //console.log(responseNextPage);
  //console.log(json.meta);
  patrons = patrons.concat(data);
  //console.log(patrons);

  if (responseNextPage) {
    const nextPatrons = await fetchPatrons(patrons, responseNextPage);
    //console.log(nextPatrons);
    patrons = patrons.concat(nextPatrons);
  }

  console.log(patrons.length);
  return patrons;
}

/**
 * Package build
 */
async function packageBuild() {
  const manifest = getManifest();

  return new Promise((resolve, reject) => {
    try {
      // Remove the package dir without doing anything else
      if (argv.clean || argv.c) {
        console.log(chalk.yellow('Removing all packaged files'));
        fs.removeSync('package');
        return;
      }

      // Ensure there is a directory to hold all the packaged versions
      fs.ensureDirSync('package');

      // Initialize the zip file
      const zipName = `${manifest.file.name}-v${manifest.file.version}.zip`;
      const zipFile = fs.createWriteStream(path.join('package', zipName));
      const zip = archiver('zip', { zlib: { level: 9 } });

      zipFile.on('close', () => {
        console.log(chalk.green(zip.pointer() + ' total bytes'));
        console.log(chalk.green(`Zip file ${zipName} has been written`));
        return resolve();
      });

      zip.on('error', (err) => {
        throw err;
      });

      zip.pipe(zipFile);

      // Add the directory with the final code
      zip.directory('dist/', manifest.file.name);

      zip.finalize();
    } catch (err) {
      return reject(err);
    }
  });
}

function getManifest() {
  const json = {};

  if (fs.existsSync('src')) {
    json.root = 'src';
  } else {
    json.root = 'dist';
  }

  const modulePath = path.join(json.root, 'module.json');
  const systemPath = path.join(json.root, 'system.json');

  if (fs.existsSync(modulePath)) {
    json.file = fs.readJSONSync(modulePath);
    json.name = 'module.json';
  } else if (fs.existsSync(systemPath)) {
    json.file = fs.readJSONSync(systemPath);
    json.name = 'system.json';
  } else {
    return;
  }

  return json;
}

/**
 * Build Css
 */
function buildCSS() {
  return gulp.src('src/**/*.css').pipe(gulp.dest('dist'));
}

/**
 * Copy static files
 */
async function copyFiles() {
  const statics = ['lang', 'fonts', 'assets', 'icons', 'templates', 'module.json', 'system.json', 'template.json'];
  try {
    for (const file of statics) {
      if (fs.existsSync(path.join('src', file))) {
        await fs.copy(path.join('src', file), path.join('dist', file));
      }
    }
    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
}

const chores = parallel(patrons, docs);

exports.build = gulp.series(gulp.parallel(buildJS, buildCSS, copyFiles));
// exports.docs = docs;
// exports.patrons = patrons;
exports.chores = chores;
exports.default = gulp.series(chores, buildJS);
