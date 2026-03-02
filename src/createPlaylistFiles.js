// @ts-check

import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { getFileExtension, partition } from "./utils.js";

import { VIDEO_FILES_EXTENSIONS } from "./constants.js";
import args from "./cli.js";
import { create } from "xmlbuilder2";
import pathModule from "path";

/**
 * @param {string} pathToVideos - path to folder with videos
 * @return {string[]} list of all videofiles in folder
 */
function getVideosNames(pathToVideos) {
  try {
    if (!existsSync(pathToVideos)) {
      console.error("not found");
    } else {
      const allElements = readdirSync(pathToVideos, { withFileTypes: true });
      const [dirs, files] = partition(allElements, (n) => n.isDirectory());
      if (args.r) {
        // recursively creating playlists for subfolders
        dirs.forEach((dir) =>
          createPlaylistFiles(`${dir.parentPath}\\${dir.name}`),
        );
      }

      return (
        files
          .filter((file) =>
            VIDEO_FILES_EXTENSIONS.has(getFileExtension(file.name)),
          )
          // Without adding global path subs do not work for some reason
          .map((file) => `${file.parentPath}/${file.name}`)
      );
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

  const { subTrack, noSub, subFile, audioTrack = 0 } = args;
  const subValue = subTrack
    ? subTrack
    : noSub // Setting sub track to fake number to turn off subtitles
      ? fakeSubTrack
      : 0;

  /**
   * @param {number} i - index of file
   * @return {string} attribute value
   */
  const subFileForVideo = (i) =>
    subFile.replace(
      "$",
      (i + 1).toLocaleString("en-US", { minimumIntegerDigits: 2 }),
    );

  const root = create({ version: "1.0", encoding: "UTF-8" });
  const playlist = root.ele("playlist", {
    xmlns: "http://xspf.org/ns/0/",
    "xmlns:vlc": "http://www.videolan.org/vlc/playlist/ns/0/",
  });

  playlist.ele("title").txt("Title").up();
  const trackList = playlist.ele("trackList");

  fileNames.forEach((fileName, i) => {
    const track = trackList.ele("track");
    // has to be regular slashes "/" not "\"
    track
      .ele("location")
      .txt(`file:///${encodeURIComponent(fileName)}`)
      .up();

    track.ele("duration").txt("0").up();

    const extension = track.ele("extension", {
      application: "http://www.videolan.org/vlc/playlist/0",
    });

    extension.ele("vlc:id").txt(i.toString()).up();

    extension.ele("vlc:option").txt(`audio-track=${audioTrack}`).up();

    const subtitleOption = extension.ele("vlc:option");

    // Either selecting sub file from existing or adding suggested
    if (subFile) {
      subtitleOption.txt(`sub-file=${subFileForVideo(i)}`);
    } else {
      subtitleOption.txt(`sub-track=${subValue}`);
    }

    subtitleOption.up();
    extension.up();
    track.up();
    playlist.up();
  });

  trackList.up();
  playlist.up();

  // convert the XML tree to string
  return root.end({ prettyPrint: true });
}

/** @param {string} dirPath - path to folder with videos */
export function createPlaylistFiles(dirPath) {
  const names = getVideosNames(dirPath);

  if (names.length !== 0) {
    const xmlString = createPlaylistXML(names);
    try {
      const folderName = pathModule.basename(pathModule.resolve(dirPath));
      const playlistName = args.nameAsFolder ? folderName : "playlist";
      const filePath = pathModule.join(dirPath, `${playlistName}.xspf`);
      writeFileSync(filePath, xmlString, { encoding: "utf8" });
      console.info(`File "${filePath}" is created`);
    } catch (err) {
      console.error(err);
    }
  }
}
