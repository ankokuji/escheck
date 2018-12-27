/// <reference path="../types.d.ts" />

import * as acorn from "acorn";
import * as walk from "acorn-walk";
import log from "./log";
import _ from "lodash/fp";

/**
 * 描述代码位置
 *
 * @interface Range
 */
interface Range {
  start: number;
  end: number;
}

/**
 * AST node type 枚举
 *
 * @enum {number}
 */
enum NodeType {
  Identifier = "Identifier",
  MemberExpression = "MemberExpression"
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

const filtList = {
  merberExpression: [{ object: "Symbol", property: "iterator" }]
};

function main() {
  const code = "a[Symbol.iterator]";
  const errorList = checkES5Errors(code);
  printError(code, errorList);
}

// main()

/**
 * 获取代码的es5错误
 *
 * @param {string} code
 * @returns {Range[]}
 */
export function checkES5Errors(code: string): Range[] {
  // const ast = acorn.parse(jscode);
  // const ast = acorn.parse("a[Symbol.iterator]");
  const ast = acorn.parse(code);
  const errorList: Range[] = [];
  walk.ancestor(ast, {
    MemberExpression(node: acorn.Node, visitors: acorn.Node[]) {
      const error = extractErrorMemberExpression(
        node as MemberExpression,
        visitors
      );
      if (error) {
        errorList.push(error);
      }
    }
  });
  return errorList;
}

/**
 * 处理 merber expression
 *
 * @param {MemberExpression} node
 */
function extractErrorMemberExpression(
  node: MemberExpression,
  visitors: acorn.Node[]
): Range | undefined {
  if (
    isMemberExpressionNodeInFiltList(node) &&
    isNodePropertyOfExpression(visitors)
  ) {
    const PRINT_LEVEL = 5;
    const printTargetNode = _.compose<any, any>(
      _.first,
      _.takeLast(PRINT_LEVEL)
    )(visitors);
    const { start, end } = printTargetNode;
    return { start, end };
  }
  return undefined;
}

/**
 * 判断是否处于表达式的property，如 `a[Symbol.iterator]`
 *
 * @param {acorn.Node[]} visitors
 * @returns
 */
function isNodePropertyOfExpression(visitors: acorn.Node[]) {
  const ANCESTER_NUM = 1;
  const ancester = _.last(_.dropRight(ANCESTER_NUM)(visitors));
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
function isMemberExpressionNodeInFiltList(node: MemberExpression): boolean {
  const parsed = parseMermberExpression(node);
  const filteredList = (_.find as any)(parsed)(filtList.merberExpression);
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
 * 判断node是否identifier
 *
 * @param {acorn.Node} node
 * @returns
 */
function isIdentifier(node: acorn.Node) {
  return node.type == NodeType.Identifier;
}

/**
 * 判断node 是否 member expression
 *
 * @param {acorn.Node} node
 * @returns
 */
function isMemberExpression(node: acorn.Node) {
  return node.type == NodeType.MemberExpression;
}

/**
 * 打印错误
 *
 * @param {string} code
 * @param {Range[]} errList
 */
export function printError(code: string, errList: Range[]): void {
  const PRINT_RANGE = 0;
  /**
   * 根据位置截取字符串
   *
   * @param {Range} range
   * @returns
   */
  function range2String(range: Range) {
    const { start, end } = range;
    const trueStart = Math.max(0, start - PRINT_RANGE);
    const trueEnd = Math.min(end + PRINT_RANGE, code.length);
    return _.join("")(_.slice(trueStart)(trueEnd)(code));
  }
  function print(str: string) {
    log.info(str);
  }
  // no returns
  _.compose<any, any>(
    _.forEach(print),
    _.map(range2String)
  )(errList);
}

function parseRowCol(range: Range, code: string) {
  const getLength = (str: string) => str.length;
  const lineLengthArr = _.compose(
    _.map(getLength),
    _.split("\n")
  )(code);
  const { start, end } = range;

  interface ReduceAccum {
    numLeft: number;
    lineNum: number;
  }

  _.reduce<any, any>((pre: ReduceAccum, numOfLine: number) => {
    const { numLeft, lineNum } = pre;
    const curNumLeft = numLeft - lineLengthArr[lineNum];
  })
}
