
// third-party module
declare module 'acorn-walk' {
  import acorn from "acorn";
  import walk from "acorn-walk";
  function simple(ast: acorn.Node, func: {[key: string]: Function}): any
}
