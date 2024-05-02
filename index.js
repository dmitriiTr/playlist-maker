// @ts-check

import { existsSync, readdirSync, writeFileSync } from 'node:fs';

import { create } from 'xmlbuilder2';
import { partition } from './utils.js';

const rootFolder = process.argv[2];
const audioTrack = process.argv[3] ?? 0;
const subsFlag = process.argv[4] === "true";
const recFlag = process.argv[5] === "true";

/**
 * @param {string} pathToVideos - path to folder with videos
 * @return {string[]} list of all videofiles in folder
 */
function getVideosNames(pathToVideos) {
  try {
    if (!existsSync(pathToVideos)) {
      console.log('not found');
    }
    else {
      const all = readdirSync(pathToVideos, { withFileTypes: true });
      const [dirs, files] = partition(all, n => n.isDirectory())
      if (recFlag && dirs.length !== 0) {
        // recursively creating playlists for subfolders
        dirs.forEach(dir => createPlaylistFiles(`${dir.path}\\${dir.name}`))
      }

      return files
        .filter(file => file.name.indexOf('.mp4') !== -1 || file.name.indexOf('.mkv') !== -1)
        // Without addning global path subs do not work for some reason
        .map(file => `${file.path}/${file.name}`);
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

  fileNames.forEach((fileName, i) => {
    root.ele('track')
      // has to be regular slashes "/" not "\"
      .ele('location').txt(`file:///${fileName}`).up()
      .ele('duration').txt("0").up()
      .ele('extension', { "application": "http://www.videolan.org/vlc/playlist/0" })
      .ele("vlc:id").txt(i.toString()).up()
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
 * @param {string} path - path to folder with videos
 * @return {void}
 */
function createPlaylistFiles(path) {
  const names = getVideosNames(path);
  if (names.length !== 0) {

    const xmlString = createPlaylistXML(names);
    try {
      const fileName = path.split("\\").pop();
      const filePath = `${path}\\${fileName}.xspf`;
      writeFileSync(filePath, xmlString);
      console.log(`File "${filePath}" is created`);
    } catch (err) {
      console.error(err);
    }
  }
}

createPlaylistFiles(rootFolder);

