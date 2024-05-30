// @ts-check

import { existsSync, readdirSync, writeFileSync } from 'node:fs';

import { create } from 'xmlbuilder2';
import minimist from 'minimist';
import { partition } from './utils.js';

/**
 * @param {string} pathToVideos - path to folder with videos
 * @return {string[]} list of all videofiles in folder
 */
function getVideosNames(pathToVideos) {
  try {
    if (!existsSync(pathToVideos)) {
      console.error("not found");
    }
    else {
      const all = readdirSync(pathToVideos, { withFileTypes: true });
      const [dirs, files] = partition(all, n => n.isDirectory());
      if (args.r && dirs.length !== 0) {
        // recursively creating playlists for subfolders
        dirs.forEach(dir => createPlaylistFiles(`${dir.path}\\${dir.name}`));
      }

      return files
        .filter(file => file.name.indexOf('.mp4') !== -1 || file.name.indexOf('.mkv') !== -1 ||
          file.name.indexOf('.avi') !== 1)
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
  const { subTrack, noSub, subFile, audioTrack } = args;
  const subValue = subTrack
    ? subTrack
    // Setting sub track to fake number to turn off subtitles
    : noSub ? fakeSubTrack : 0;

  /**
  * @param {number} i - index of file
  * @return {string} attribute value
  */
  const subFileForVideo = i => subFile.replace("$", (i + 1).toLocaleString('en-US', { minimumIntegerDigits: 2 }));

  const root = create({ version: '1.0', encoding: "UTF-8" })
    .ele('playlist', { xmlns: 'http://xspf.org/ns/0/', "xmlns:vlc": "http://www.videolan.org/vlc/playlist/ns/0/" })
    .ele('title').txt("Title").up().ele('trackList');

  fileNames.forEach((fileName, i) => {
    const track = root.ele('track')
      // has to be regular slashes "/" not "\"
      .ele('location').txt(`file:///${fileName}`).up()
      .ele('duration').txt("0").up()
      .ele('extension', { "application": "http://www.videolan.org/vlc/playlist/0" })
      .ele("vlc:id").txt(i.toString()).up()
      .ele("vlc:option").txt(`audio-track=${audioTrack}`).up();

    // Either add new sub file or selecting from existing
    if (subFile) {
      track.ele("vlc:option").txt(`sub-file=${subFileForVideo(i)}`).up();
    } else {
      track.ele("vlc:option").txt(`sub-track=${subValue}`).up();
    }
    root.up()
      .up();
  });
  root.up()
    .up();

  // convert the XML tree to string
  return root.end({ prettyPrint: true });
}

/** @param {string} path - path to folder with videos */
function createPlaylistFiles(path) {
  const names = getVideosNames(path);
  if (names.length !== 0) {

    const xmlString = createPlaylistXML(names);
    try {
      const fileName = path.split("\\").pop();
      const filePath = `${path}\\${fileName}.xspf`;
      writeFileSync(filePath, xmlString);
      console.info(`File "${filePath}" is created`);
    } catch (err) {
      console.error(err);
    }
  }
}

const args = minimist(process.argv.slice(2));
const rootFolder = args._[0];

if (rootFolder) {
  createPlaylistFiles(rootFolder);
} else {
  console.info("must specify directory");
}