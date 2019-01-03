/**
 * AST node type enumaration
 *
 * @enum {number}
 */
enum NodeType {
  Identifier = "Identifier",
  MemberExpression = "MemberExpression",
  CallExpression = "CallExpression"
}

/**
 * Determine if node is an identifier.
 *
 * @param {acorn.Node} node
 * @returns
 */
export function isIdentifier(node: acorn.Node): node is Identifier {
  return node.type == NodeType.Identifier;
}

/**
 * Determine if node is a member expression.
 *
 * @param {acorn.Node} node
 * @returns
 */
export function isMemberExpression(node: acorn.Node): node is MemberExpression  {
  return node.type == NodeType.MemberExpression;
}

/**
 * Determine if node is a call expression.
 *
 * @export
 * @param {acorn.Node} node
 * @returns {node is CallExpression}
 */
export function isCallExpression(node: acorn.Node): node is CallExpression {
  return node.type === NodeType.CallExpression;
}
