
// third-party module
declare module 'acorn-walk' {
  import acorn from "acorn";
  function simple(ast: acorn.Node, visitors: {[key: string]: Function}): any
  function ancestor(ast: acorn.Node, visitors: { [key: string]: Function }, ...args: any[]): any;
}

interface NodeError {
  /**
   * 错误所在文件位置
   *
   * @type {NodeLocation}
   * @memberof NodeError
   */
  nodeLocation: NodeLocation;
  /**
   * 片段位置
   *
   * @type {NodeLocation}
   * @memberof NodeError
   */
  fragmentLocation: NodeLocation;
  /**
   * 错误所在语句
   *
   * @type {string}
   * @memberof NodeError
   */
  errorSentence: string;
  /**
   * 具体错误的表达式
   *
   * @type {string}
   * @memberof NodeError
   */
  errorWord: string;

  errorType: string;
}

interface NodeLocation {
  row: number;
  col: number;
}

/**
 * Definition of identifier node.
 *
 * @interface IdentifierNode
 * @extends {acorn.Node}
 */
interface Identifier extends acorn.Node {
  name: "Identifier";
}

/**
 * Definition of member expression node.
 *
 * @interface MemberExpression
 * @extends {acorn.Node}
 */
interface MemberExpression extends acorn.Node {
  name: "MemberExpression";
  object: Identifier;
  property: Identifier;
}

/**
 * Definition of call expression node.
 *
 * @interface CallExpression
 * @extends {acorn.Node}
 */
interface CallExpression extends acorn.Node {
  name: "CallExpression"
}

