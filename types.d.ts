
// third-party module
declare module 'acorn-walk' {
  import acorn from "acorn";
  function simple(ast: acorn.Node, func: {[key: string]: Function}): any
  function ancestor(ast: acorn.Node, func: { [key: string]: Function }): any;
}
