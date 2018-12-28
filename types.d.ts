
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
}

interface NodeLocation {
  row: number;
  col: number;
}
