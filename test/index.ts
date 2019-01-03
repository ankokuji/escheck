import { checkErrors, printError } from "../src/check";
import fs from "fs";
import path from "path";
import _ from "lodash/fp";

import arrayRule from "../rules/Array.json";
import symbolRule from "../rules/Symbol.json";

/**
 * 读取文件
 *
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function readFile(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    fs.readFile(path.posix.join(__dirname, filePath), (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.toString());
    });
  });
}

/**
 * 合并检测规则。
 *
 * @param {any[]} checkRuleArray
 * @returns
 */
function combineCheckList(checkRuleArray: any[]) {
  const mergeArr = _.reduce<any, any>((object: any, source: any) => {
    return mergeArrayValueObject(object, source);
  });

  /**
   * 合并值都为数组的两个对象
   *
   * @param {*} object
   * @param {*} source
   * @returns
   */
  function mergeArrayValueObject(object: any, source: any) {
    const keys = _.union(_.keys(object))(_.keys(source));

    const combineAllKey = _.reduce<string, any>((pre, cur) => {
      if (object[cur] && source[cur]) {
        pre[cur] = _.concat(object[cur])(source[cur]);
      } else {
        pre[cur] = object[cur] || source[cur];
      }
      return pre;
    });
    const newObj = combineAllKey({})(keys);
    return newObj;
  }

  return mergeArr({})(checkRuleArray);
}

/**
 * 主函数
 *
 */
async function main() {
  const checkList = combineCheckList([arrayRule, symbolRule]);
  const jscode = await readFile("../template/example.js");
  // const jscode = `dsjklg =sdhjwl function t2`;
  const errs = checkErrors(jscode, checkList);
  const print = printError(errs);
  console.log(print)
  debugger;
}

main();
