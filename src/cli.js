// @ts-check

import minimist from "minimist";

const args = minimist(process.argv.slice(2));
const rootFolder = args._[0];

export default args;
export { rootFolder };
