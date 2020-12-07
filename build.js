const util = require('util');
const fs = require('fs');
const path = require('path');
const copyFilePromise = util.promisify(fs.copyFile);

function copyFiles(srcDir, destDir, files) {
  return Promise.all(files.map((f) => {
    return copyFilePromise(path.join(srcDir, f), path.join(destDir, f));
  }));
}

async function build() {
  const files = ['content.js', 'inject.js', 'script.js', 'manifest.json', 'icon.ico', 'index.html'];

  await copyFiles('.', 'dist', files).catch(err => {
    console.log(err);
  });

  console.log('done');
}

build();
