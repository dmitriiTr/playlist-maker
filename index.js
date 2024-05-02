import { existsSync, readdirSync, writeFileSync } from 'node:fs';

import { create } from 'xmlbuilder2';

const rootFolder = process.argv[2];
const audioTrack = process.argv[3] ?? 0;
const subsFlag = process.argv[4] === "true";
const folderNamesReaden = readdirSync(rootFolder);

/**
 * @param {string} path - name of folder
 * @return {string[]} list of all videofiles in folder
 */
function getVideosNames(path) {
  try {
    if (!existsSync(path)) {
      console.log('not found');
    }
    else {
      // todo: { withFileTypes: true } and recoursion
      return readdirSync(path) 
      .filter(name => name.indexOf('.mp4') !== -1 || name.indexOf('.mkv') !== -1)
      // Without addning global path subs do not work for some reason
      .map(name => `${path}/${name}`);
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
  const fakeSubTrack = 99;
  const root = create({ version: '1.0', encoding: "UTF-8" })
    .ele('playlist', { xmlns: 'http://xspf.org/ns/0/', "xmlns:vlc": "http://www.videolan.org/vlc/playlist/ns/0/" })
    .ele('title').txt("Title").up().ele('trackList');

  fileNames.forEach((file, i) => {
    root.ele('track')
      .ele('location').txt(`file:///${file}`).up()
      .ele('duration').txt("0").up()
      .ele('extension', { "application": "http://www.videolan.org/vlc/playlist/0" })
        .ele("vlc:id").txt(i).up()
        .ele("vlc:option").txt(`audio-track=${audioTrack}`).up()
        // Setting sub track to fake number to turn off subtitles by default
        .ele("vlc:option").txt(`sub-track=${subsFlag ? 0 : fakeSubTrack}`).up()
      .up()
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

