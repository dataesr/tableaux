import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

import { NotFoundError, ServerError } from "../../../../commons/errors/index.js";

const fixturesDir = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "fixtures");

const readFixture = async (name) => {
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new NotFoundError(`Unknown fixture '${name}'`);
  }
  const fixturePath = path.join(fixturesDir, `${name}.json`);
  try {
    return JSON.parse(await fs.readFile(fixturePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new NotFoundError(`Fixture '${name}' not found in ${fixturesDir}`);
    }
    throw new ServerError(`Fixture '${name}' is not valid JSON: ${error.message}`);
  }
};

export { readFixture };
