/// <reference path="../types.d.ts" />

import * as acorn from "acorn";
import * as walk from "acorn-walk";
import log from "./log";
import _ from "lodash/fp";
import { isIdentifier, isCallExpression, isMemberExpression } from "./nameType";
import chalk from "chalk";

/**
 * Illustrate start and end of a node.
 *
 * @interface Range
 */
interface Range {
  /**
   * Start of range.
   *
   * @type {number}
   * @memberof Range
   */
  start: number;
  /**
   * End of range.
   *
   * @type {number}
   * @memberof Range
   */
  end: number;
}

type CheckList = any;

/**
 * 
 *
 * @interface ASTNodeInfo
 */
interface ASTNodeInfo {
  /**
   * AST node of target token.
   *
   * @type {acorn.Node}
   * @memberof ASTNodeInfo
   */
  node: acorn.Node;
  /**
   * Nodes list of walk path.
   *
   * @type {acorn.Node[]}
   * @memberof ASTNodeInfo
   */
  ancesters: acorn.Node[];
}

/**
 * Definition of identifier node.
 *
 * @interface IdentifierNode
 * @extends {acorn.Node}
 */
interface IdentifierNode extends acorn.Node {
  name: string;
}

/**
 * Definition of member expression node.
 *
 * @interface MemberExpression
 * @extends {acorn.Node}
 */
interface MemberExpression extends acorn.Node {
  object: IdentifierNode;
  property: IdentifierNode;
}

/**
 * Parsed member expression
 *
 * @interface ParsedMerberExpression
 */
interface ParsedMemberExpression {
  object: string;
  property: string;
}

/**
 * Check invalid api invoke errors.
 *
 * @param {string} code
 * @returns {ASTNodeInfo[]}
 */
export function checkErrors(
  code: string,
  checkList: CheckList
): NodeError[] {
  if (!checkList || !_.isObject(checkList)) {
    throw new Error("[es-api-check] parameter `checklist` should be an object.");
  }
  if (!code || !_.isString(code)) {
    throw new Error("[es-api-check] parameter `code` should be a string.")
  }
  const errorList: ASTNodeInfo[] = generateNodeErrorList(code, checkList);
  return _.map(_.curryRight(parseASTNodeInfo2Error)(code))(errorList);
}

/**
 * Generate AST from js code, then walk through AST to generate error list.
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
 * Parse AST node info into error detail.
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

  // const fragment = parseErrorFragment(ancesters, code);
  const fragment = parseErrorFragmentByLine(node, code);
  const errorWord = range2String(node, code);
  const nodeLocation = parseNodeLocation(node, code);

  return {
    fragmentLocation: fragment.location,
    errorSentence: fragment.code,
    errorWord,
    nodeLocation
  };
}

/**
 * parse node's location(row and column).
 *
 * @param {acorn.Node} node
 * @param {string} code
 * @returns {NodeLocation}
 */
function parseNodeLocation(node: acorn.Node, code: string): NodeLocation {
  return parseRangeLocation(node, code);
}

/**
 * Get code fragment around target node by line offset.
 *
 * @param {acorn.Node} node
 * @param {string} code
 */
function parseErrorFragmentByLine(
  node: acorn.Node,
  code: string
): { location: NodeLocation; code: string } {
  const FRAGMENT_LINE_OFFSET = 3;
  const location = parseNodeLocation(node, code);
  const codeSplitList = _.split("\n")(code);
  const { start: fragmentStartLine, end: fragmentEndLine } = rangeByOffset(
    location.row,
    FRAGMENT_LINE_OFFSET,
    codeSplitList.length
  );
  const fragmentCode = _.compose<any, any, any>(
    _.join("\n"),
    trimFragmentLines,
    _.slice(fragmentStartLine)(fragmentEndLine)
  )(codeSplitList);
  return {
    location: {
      row: fragmentStartLine,
      col: 0
    },
    code: fragmentCode
  };
}

/**
 * Get a range which offsets by index, and ranges from 0 to limit.
 *
 * @param {number} index
 * @param {number} offset
 * @param {number} limit
 * @returns
 */
function rangeByOffset(index: number, offset: number, limit: number) {
  return {
    start: Math.max(0, index - offset),
    end: Math.min(limit, index + offset)
  };
}

/**
 * Trim spaces ahead of each line of code.
 * Based on minimum space number of all lines.
 *
 * @param {string[]} lines
 * @returns
 */
function trimFragmentLines(lines: string[]): string[] {
  const minHeadSpaceNum = _.compose<any, any>(
    _.min,
    _.map(calculateHeadSpace)
  )(lines);
  const res = _.compose(
    _.map(_.join("")),
    _.map(_.drop(minHeadSpaceNum))
  )(lines);
  return res;
}

/**
 * calculate number of space ahead of string.
 *
 * @param {string} line
 * @returns
 */
function calculateHeadSpace(line: string): number {
  let num = 0;
  let char = line[num];
  while (num < line.length && char === " ") {
    num++;
    char = line[num];
  }
  return num;
}

/**
 *
 *
 * @param {acorn.Node[]} ancesters
 * @param {string} code
 * @returns
 */
function parseErrorFragment(
  ancesters: acorn.Node[],
  code: string
): { location: NodeLocation | undefined; code: string } {
  const PRINT_LEVEL = 5;
  let fragment;
  const printTargetNode = _.compose<any, any>(
    _.first,
    _.takeLast(PRINT_LEVEL)
  )(ancesters);
  if (printTargetNode) {
    const { start, end } = printTargetNode;
    fragment = {
      location: parseNodeLocation(printTargetNode, code),
      code: range2String({ start, end }, code)
    };
  } else {
    fragment = { location: undefined, code: "can't get error sentence!!!" };
  }
  return fragment;
}

/**
 * handle merber expression
 *
 * @param {MemberExpression} node
 */
function extractErrorMemberExpression(
  node: MemberExpression,
  ancesters: acorn.Node[],
  checkList: CheckList
): ASTNodeInfo | undefined {
  if (
    isMemberExpressionNodeInFiltList(node, checkList) &&
    isTargetExpressionBeExec(ancesters)
  ) {
    return { node: node, ancesters: ancesters };
  }
  return undefined;
}

/**
 * determine if an expression is invoked,
 * sometimes expression is used in an `===` to inspect js enviroment,
 * which will not lead to an error.
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
 * determine if target node is property of expression, e.t. `a[Symbol.iterator]`.
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
 * determine if node is in member expression check list.
 *
 * @param {MemberExpression} node
 * @returns {boolean}
 */
function isMemberExpressionNodeInFiltList(
  node: MemberExpression,
  filtList: CheckList
): boolean {
  const parsed = parseMermberExpression(node);
  const filteredList = (_.find as any)(parsed)(filtList.memberExpression);
  return !!filteredList;
}

/**
 * Parse a member expression(extract name of identifier).
 *
 * @param {MemberExpression} node
 * @returns {ParsedMemberExpression}
 */
function parseMermberExpression(
  node: MemberExpression
): ParsedMemberExpression {
  const { object, property } = node;
  return {
    object: object.name,
    property: property.name
  };
}

/**
 * Print error list to string.
 *
 * @param {NodeError[]} errList
 * @returns {string} 
 */
export function printError(errList: NodeError[]): string {
  function print(str: string) {
    log.info(str);
  }

  /**
   * Generate error detail string from structured error data.
   *
   * @param {NodeError} error
   * @returns {string} 
   */
  function formatLogString(error: NodeError): string {
    const { nodeLocation, errorWord, errorSentence, fragmentLocation } = error;
    const errorTitle = chalk.redBright(
      `code:${nodeLocation.row}:${
        nodeLocation.col
      } - error Find invalid api invoke '${errorWord}'. \n\n`
    );
    const errorBody = chalk.white(
      `${addLineNum(fragmentLocation.row + 1, errorSentence)} \n\n`
    );
    return `${errorTitle}${errorBody}`;
  }

  // no returns
  return _.compose<any, any>(
    _.join(""),
    // _.forEach(print),
    _.map(formatLogString)
  )(errList);
}

/**
 * insert line number into code.
 *
 * @param {number} linestart
 * @param {string} code
 */
function addLineNum(linestart: number, code: string) {
  /**
   * construct line number to code string.
   *
   * @param {number} num
   * @param {string} str
   * @returns {string}
   */
  function constructLineNum(num: number, str: string): string {
    return num + "  " + str;
  }
  /**
   * construct line number to each row
   *
   * @param {*} [num, str]
   * @returns
   */
  const constructLineNumByRow = ([num, str]: any) => {
    return constructLineNum(num, str);
  };
  const codeSplitArr = _.split("\n")(code);
  const indexArr = _.range(linestart)(linestart + codeSplitArr.length);
  const str = _.compose<any, any>(
    _.join("\n"),
    _.map(constructLineNumByRow)
  )(_.zip<number, any>(indexArr, codeSplitArr));

  return str;
}

/**
 * Slice code snippet from source code by range.
 *
 * @param {Range} range
 * @returns
 */
function range2String(range: Range, code: string): string {
  const PRINT_RANGE = 0;
  const { start, end } = range;
  const trueStart = Math.max(0, start - PRINT_RANGE);
  const trueEnd = Math.min(end + PRINT_RANGE, code.length);
  return _.join("")(_.slice(trueStart)(trueEnd)(code));
}

/**
 * Parse the location of a node's start position.
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
