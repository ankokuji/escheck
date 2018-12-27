/// <reference path="../types.d.ts" />

import * as acorn from "acorn";
import * as walk from "acorn-walk";
import fs from "fs";

enum NodeType {
  Identifier = "Identifier",

}

interface IdentifierNode extends acorn.Node {
  name: string;
}

const filtList = {
  merberExpression: [
    {object: "Symbol", property: "iterator"}
  ]
}

walk.simple(acorn.parse("console.log(Symbol.iterator) \n Object.assign({}, {})"), {
  Literal(node: any) {
    console.log(`Found a literal: ${node.value}`);
  },
  MemberExpression(node: acorn.Node) {
    debugger
    handleMemberExpression(node);
  }
});

function handleMemberExpression(node: acorn.Node) {


}

function isIdentifier(node: acorn.Node) {
  return node.type == NodeType.Identifier;
}

function isSpecificIdentifier(node: IdentifierNode, name: string) {
  return isIdentifier(node) && node.name === name;
}