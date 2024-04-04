import { existsSync, readdirSync, writeFileSync } from 'node:fs';

import { create } from 'xmlbuilder2';

const rootFolder = process.argv[2];
const folderNamesReaden = readdirSync(rootFolder);

/**
 * @param {string} folder - name of folder
 * @return {string[]} list of all videofiles in folder
 */
function getVideosNames(folder) {
  try {
    if (!existsSync(folder)) {
      console.log('not found');
    }
    else {
      return readdirSync(folder).filter(name => name.indexOf('.mp4') !== -1);
    }
  } catch (err) {
    console.error(err);
  }
  return [];
}

/**
 * @param {string[]} fileNames - list of videofiles
 * @return {string} playlist in xml format 
 */
function createPlaylistXML(fileNames) {
  const root = create({ version: '1.0', encoding: "UTF-8" })
    .ele('playlist', { xmlns: 'http://xspf.org/ns/0/', "xmlns:vlc": "http://www.videolan.org/vlc/playlist/ns/0/" })
    .ele('title').txt("Title").up().ele('trackList');

  fileNames.forEach((file, i) => {
    root.ele('track')
      .ele('location').txt(`file:///${file}`).up()
      .ele('duration').txt("0").up()
      .ele('extension', { "application": "http://www.videolan.org/vlc/playlist/0" }).ele("vlc:id").txt(i).up().up()
      .up();
  })

  root.up()
    .up();

  // convert the XML tree to string
  return root.end({ prettyPrint: true });
}

/**
 * @param {string[]} folderNames - names of folders in current catalog
 * @return {void}
 */
function createPlaylistFiles(folderNames) {
  folderNames.forEach(folderName => {
    const names = getVideosNames(`${rootFolder}/${folderName}`);
    const xmlString = createPlaylistXML(names);

    try {
      const fileName = `${rootFolder}/${folderName}/${folderName}.xspf`;
      writeFileSync(fileName, xmlString);
      console.log(`File "${folderName}.xspf" is created`);
    } catch (err) {
      console.error(err);
    }
  });
}

createPlaylistFiles(folderNamesReaden);

