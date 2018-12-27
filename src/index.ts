import { checkES5Errors, printError } from "./check";
import fs from "fs";
import path from "path";

/**
 * 读取文件
 *
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function readFile(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    fs.readFile(path.posix.join(__dirname, filePath), (err, data) => {
      if(err) {
        reject(err);
      }
      resolve(data.toString());
    })
  })
}

/**
 * 主函数
 *
 */
async function main() {
  const jscode = await readFile("../template/example.js");
  const errs = checkES5Errors(jscode);
  printError(jscode, errs);
  debugger
}

main()