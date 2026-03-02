// @ts-check

import { createPlaylistFiles } from "./createPlaylistFiles.js";
import { rootFolder } from "./cli.js";

if (rootFolder) {
  createPlaylistFiles(rootFolder);
} else {
  console.info("must specify directory");
}
