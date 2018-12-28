import { checkES5Errors } from "./check";
import _ from "lodash/fp";

import arrayRule from "../rules/Array.json";
import symbolRule from "../rules/Symbol.json";

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
 * 对代码进行检查，同时提供自定义配置.
 *
 * @export
 * @param {string} code
 * @param {*} [customCheckList]
 * @returns {NodeError[]}
 */
export function esCheck(code: string, customCheckList?: any): NodeError[] {
  let checkList;
  if (customCheckList && _.isObject(customCheckList)) {
    checkList = combineCheckList([arrayRule, symbolRule, customCheckList]);
  } else {
    checkList = combineCheckList([arrayRule, symbolRule]);
  }
  const errs = checkES5Errors(code, checkList);
  return errs;
}

export { printError } from "./check";
