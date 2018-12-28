/// <reference path="../types.d.ts" />

import * as acorn from "acorn";
import * as walk from "acorn-walk";
import log from "./log";
import _ from "lodash/fp";
import { isIdentifier, isCallExpression, isMemberExpression } from "./nameType";

/**
 * 描述代码位置
 *
 * @interface Range
 */
interface Range {
  start: number;
  end: number;
}

type CheckList = any;

/**
 *
 *
 * @interface ASTNodeInfo
 */
interface ASTNodeInfo {
  node: acorn.Node;
  ancesters: acorn.Node[];
}

/**
 *
 *
 * @interface IdentifierNode
 * @extends {acorn.Node}
 */
interface IdentifierNode extends acorn.Node {
  name: string;
}

/**
 *
 *
 * @interface MemberExpression
 * @extends {acorn.Node}
 */
interface MemberExpression extends acorn.Node {
  object: IdentifierNode;
  property: IdentifierNode;
}

/**
 * 解析完的对象
 *
 * @interface ParsedMerberExpression
 */
interface ParsedMerberExpression {
  object: string;
  property: string;
}

/**
 * 获取代码的es5错误
 *
 * @param {string} code
 * @returns {ASTNodeInfo[]}
 */
export function checkES5Errors(
  code: string,
  checkList: CheckList
): NodeError[] {
  if(!checkList || !_.isObject(checkList)) {
    throw new Error("[escheck] check list should be an object!!")
  }
  const errorList: ASTNodeInfo[] = generateNodeErrorList(code, checkList);
  return _.map(_.curryRight(parseASTNodeInfo2Error)(code))(errorList);
}

/**
 * 生成ast，并遍历生成错误列表
 *
 * @param {string} code
 * @returns
 */
function generateNodeErrorList(code: string, checkList: any) {
  // ast shouldn't be used after because
  // it can be refered and changed outside of this function
  const ast = acorn.parse(code);
  let errorList: ASTNodeInfo[] = [];
  walk.ancestor(
    ast,
    {
      MemberExpression(
        node: acorn.Node,
        { checkList }: any,
        ancesters: acorn.Node[]
      ) {
        const error = extractErrorMemberExpression(
          _.clone(node) as MemberExpression,
          _.clone(ancesters),
          checkList
        );
        if (error) {
          errorList = _.concat(errorList)(error);
        }
      }
    },
    undefined,
    { checkList }
  );
  return errorList;
}

/**
 * 解析AST node 信息为错误信息
 *
 * @param {ASTNodeInfo} nodeInfo
 * @param {string} code
 * @returns {NodeError}
 */
function parseASTNodeInfo2Error(
  nodeInfo: ASTNodeInfo,
  code: string
): NodeError {
  const { node, ancesters } = nodeInfo;

  const errorSentence = parseErrorSentence(ancesters, code);
  const errorWord = range2String(node, code);
  const nodeLocation = parseNodeLocation(node, code);

  return { errorSentence, errorWord, nodeLocation };
}

/**
 * 解析ast节点位置
 *
 * @param {acorn.Node} node
 * @param {string} code
 * @returns {NodeLocation}
 */
function parseNodeLocation(node: acorn.Node, code: string): NodeLocation {
  return parseRangeLocation(node, code);
}

/**
 *
 *
 * @param {acorn.Node[]} ancesters
 * @param {string} code
 * @returns
 */
function parseErrorSentence(ancesters: acorn.Node[], code: string) {
  const PRINT_LEVEL = 5;
  let errorSentence;
  const printTargetNode = _.compose<any, any>(
    _.first,
    _.takeLast(PRINT_LEVEL)
  )(ancesters);
  if (printTargetNode) {
    const { start, end } = printTargetNode;
    errorSentence = range2String({ start, end }, code);
  } else {
    errorSentence = "can't get error sentence!!!";
  }
  return errorSentence;
}

/**
 * 处理 merber expression
 *
 * @param {MemberExpression} node
 */
function extractErrorMemberExpression(
  node: MemberExpression,
  ancesters: acorn.Node[],
  checkList: CheckList
): ASTNodeInfo | undefined {
  if (isMemberExpressionNodeInFiltList(node, checkList) && isTargetExpressionBeExec(ancesters)) {
    return { node: node, ancesters: ancesters };
  }
  return undefined;
}

/**
 * 判断表达式是否是执行对，有时是通过`===`判断环境时调用，不会引起报错
 *
 * @param {acorn.Node[]} ancesters
 * @returns {boolean}
 */
function isTargetExpressionBeExec(ancesters: acorn.Node[]): boolean {
  return (
    isNodePropertyOfExpression(ancesters) || isNodeCallExpressionLeft(ancesters)
  );
}

/**
 * 判断目标node是否是处于调用表达式左值.
 *
 * @param {acorn.Node[]} ancesters
 * @returns {boolean}
 */
function isNodeCallExpressionLeft(ancesters: acorn.Node[]): boolean {
  const ANCESTER_LOCATION = -2;
  const ancester = _.nth(ANCESTER_LOCATION)(ancesters);
  if (!ancester) {
    return false;
  }
  return isCallExpression(ancester);
}

/**
 * 判断是否处于表达式的property，如 `a[Symbol.iterator]`
 *
 * @param {acorn.Node[]} ancesters
 * @returns
 */
function isNodePropertyOfExpression(ancesters: acorn.Node[]): boolean {
  const ANCESTER_NUM = 1;
  const ancester = _.last(_.dropRight(ANCESTER_NUM)(ancesters));
  if (!ancester) {
    return false;
  }
  return isMemberExpression(ancester);
}

/**
 * 判断此member expression节点是否在过滤列表中
 *
 * @param {MemberExpression} node
 * @returns {boolean}
 */
function isMemberExpressionNodeInFiltList(node: MemberExpression, filtList: CheckList): boolean {
  const parsed = parseMermberExpression(node);
  const filteredList = (_.find as any)(parsed)(filtList.memberExpression);
  return !!filteredList;
}

/**
 * 解析表达式
 *
 * @param {MemberExpression} node
 * @returns {ParsedMerberExpression}
 */
function parseMermberExpression(
  node: MemberExpression
): ParsedMerberExpression {
  const { object, property } = node;
  return {
    object: object.name,
    property: property.name
  };
}

/**
 * 打印错误
 *
 * @param {string} code
 * @param {Range[]} errList
 */
export function printError(code: string, errList: Range[]): void {
  function print(str: string) {
    log.info(str);
  }
  // no returns
  _.compose<any, any>(
    _.forEach(print),
    _.map(_.curryRight(range2String)(code))
  )(errList);
}

/**
 * 根据位置截取字符串
 *
 * @param {Range} range
 * @returns
 */
function range2String(range: Range, code: string) {
  const PRINT_RANGE = 0;
  const { start, end } = range;
  const trueStart = Math.max(0, start - PRINT_RANGE);
  const trueEnd = Math.min(end + PRINT_RANGE, code.length);
  return _.join("")(_.slice(trueStart)(trueEnd)(code));
}

/**
 * 解析范围在代码的行列位置
 *
 * @param {Range} range
 * @param {string} code
 */
function parseRangeLocation(range: Range, code: string): NodeLocation {
  const getLength = (str: string) => str.length;
  const lineLengthArr = _.compose(
    _.map(getLength),
    _.split("\n")
  )(code);
  const { start, end } = range;
  let line = 0;
  let numLeft = start;
  let col = 0;
  while (numLeft > 0) {
    col = numLeft;
    numLeft -= lineLengthArr[line] + 1;
    line++;
  }
  return {
    col,
    row: line
  };
}
