class Type {

}

/**
 * AST node type 枚举
 *
 * @enum {number}
 */
enum NodeType {
  Identifier = "Identifier",
  MemberExpression = "MemberExpression",
  CallExpression = "CallExpression"
}

/**
 * 判断node是否identifier
 *
 * @param {acorn.Node} node
 * @returns
 */
export function isIdentifier(node: acorn.Node) {
  return node.type == NodeType.Identifier;
}

/**
 * 判断node 是否 member expression
 *
 * @param {acorn.Node} node
 * @returns
 */
export function isMemberExpression(node: acorn.Node) {
  return node.type == NodeType.MemberExpression;
}

export function isCallExpression(node: acorn.Node) {
  return node.type === NodeType.CallExpression;
}
