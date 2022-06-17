import {
  Expression,
  JSXElement, Program, Statement,
} from '@swc/core';
import Visitor from "@swc/core/Visitor";
import {
  ExprOrSpread
} from "@swc/core/types";
import {
  buildArrayExpression,
  buildArrowFunctionExpression, buildCallExpression, buildIdentifier, buildImportDeclaration,
  buildJSXElement,
  buildJSXExpressionContainer, buildNamedImportSpecifier, buildNullLiteral, buildStringLiteral
} from "./utils";

enum JSXConditionType {
  if = 'x-if',
  else = 'x-else',
  elseif = 'x-elseif'
}

function isJSXCondition(n: JSXElement) {
  let opening = n.opening;
  let openingAttributes = opening.attributes;

  if (openingAttributes) {
    for (let attribute of openingAttributes) {
      if (attribute.type === 'JSXAttribute' && attribute.name.type === 'Identifier') {
        switch (attribute.name.value) {
          case JSXConditionType.if:
          case JSXConditionType.else:
          case JSXConditionType.elseif: {
            return true;
          }
        }
      }
    }
  }
  return false;
}

type JSXCondition = {
  type: 'x-if' | 'x-elseif' | 'x-else',
  expression?: Expression;
}

function getJSXCondition(n: JSXElement): JSXCondition | undefined {
  let opening = n.opening;
  let openingAttributes = opening.attributes;
  if (!openingAttributes) return undefined;

  for (let attribute of openingAttributes) {
    if (attribute.type === 'JSXAttribute' && attribute.name.type === 'Identifier') {
      switch (attribute.name.value) {
        case JSXConditionType.if:
        case JSXConditionType.else:
        case JSXConditionType.elseif: {
          if (attribute.value?.type === 'JSXExpressionContainer') {
            return {
              type: attribute.name.value,
              expression: attribute.value.expression
            };
          }
          if (attribute.value === null) {
            return {
              type: attribute.name.value,
              expression: buildNullLiteral()
            }
          }
        }
      }
    }
  }

  return undefined;
}

function JSXConditionToStandard(n: JSXElement) {
  let openingAttributes = n.opening.attributes;

  if (openingAttributes) {
    openingAttributes = openingAttributes.filter((attribute) => {
      if (attribute.type === 'JSXAttribute' && attribute.name.type === 'Identifier') {
        switch (attribute.name.value) {
          case JSXConditionType.if:
          case JSXConditionType.else:
          case JSXConditionType.elseif: {
            return false;
          }
        }
      }
      return true;
    });
  }
  return buildJSXElement({
    ...n.opening,
    attributes: openingAttributes
  }, n.children, n.closing)
}


function transformJSXCondition(n: JSXElement, isChild: boolean): JSXElement {
  n.children = n.children.map((n) => {
    if (n.type === 'JSXElement') {
      return transformJSXCondition(n, true);
    }
    return n;
  });

  if (!isJSXCondition(n)) {
    return n;
  }

  let condition = getJSXCondition(n)!;

  let elements: ExprOrSpread[] = [
    {
      expression: buildArrowFunctionExpression([], getJSXCondition(n)!.expression!)
    },
    {
      expression: buildArrowFunctionExpression([], JSXConditionToStandard(n))
    }
  ];

  let body = buildCallExpression(buildIdentifier('__create_condition__', false), [
    {
      expression: buildArrayExpression(elements)
    }
  ]) as any;

  return isChild ? buildJSXExpressionContainer(body) : body;
}

class JSXConditionTransformer extends Visitor {
  visitJSXElement(n: JSXElement): JSXElement {
    if (isJSXCondition(n)) {
      return transformJSXCondition(n, false);
    }

    return n;
  }
}

export default function JSXConditionTransformPlugin(m: Program): Program {
  let result = new JSXConditionTransformer().visitProgram(m);
  let babelImport = buildImportDeclaration([
    buildNamedImportSpecifier(
      buildIdentifier('__create_condition__', false),
      buildIdentifier('createCondition', false)
    )
  ], buildStringLiteral('babel-runtime-jsx-plus'));
  result.body.unshift(babelImport as any);

  return result;
}
