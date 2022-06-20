import {
  Expression,
  JSXElement, JSXText, Program,
} from '@swc/core';
import Visitor from "@swc/core/Visitor";
import {
  ExprOrSpread, JSXElementChild
} from "@swc/core/types";
import {
  buildArrayExpression,
  buildArrowFunctionExpression, buildBooleanLiteral, buildCallExpression, buildIdentifier, buildImportDeclaration,
  buildJSXElement,
  buildJSXExpressionContainer, buildJSXText, buildNamedImportSpecifier, buildNullLiteral, buildStringLiteral
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
  type: JSXConditionType;
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


function transformJSXCondition(n: JSXElement, currentList: JSXElementChild[], currentIndex: number): JSXElement | JSXText {
  n.children = n.children.map((c, i) => {
    if (c.type === 'JSXElement') {
      return transformJSXCondition(c, n.children, i);
    }
    return c;
  });

  if (!isJSXCondition(n)) {
    return n;
  }

  let condition = getJSXCondition(n)!;
  if (condition.type === JSXConditionType.else || condition.type === JSXConditionType.elseif) {
    // @ts-ignore
    if (!n.__indented) {
      return n;
    }

    return buildJSXText('');
  }

  let elseIfJSXElement : JSXElement | null = null;
  let elseJSXElement: JSXElement | null = null;

  let isRoot = currentIndex === -1;
  if (!isRoot && condition.type === JSXConditionType.if) {
    let indent = 1;
    let nextSibling = currentList[currentIndex + indent];
    while (nextSibling && nextSibling.type != 'JSXElement') {
      indent++;
      nextSibling = currentList[currentIndex + indent];
    }

    if (nextSibling) {
      let nextJSXKind = getJSXCondition(nextSibling);
      if (nextJSXKind && nextJSXKind.type === JSXConditionType.elseif) {
        elseIfJSXElement = nextSibling;
        indent++;
        nextSibling = currentList[currentIndex + indent];
        while (nextSibling && nextSibling.type != 'JSXElement') {
          indent++;
          nextSibling = currentList[currentIndex + indent];
        }

        if (nextSibling) {
          elseJSXElement = nextSibling;
        }
      } else if (nextJSXKind && nextJSXKind.type === JSXConditionType.else) {
        elseJSXElement = nextSibling;
      }
    }
  }

  let elements: ExprOrSpread[] = [
    {
      expression: buildArrayExpression([
        {
          expression: buildArrowFunctionExpression([], condition.expression!)
        },
        {
          expression: buildArrowFunctionExpression([], JSXConditionToStandard(n))
        }
      ])
    },
  ];

  if (elseIfJSXElement) {
    // @ts-ignore
    elseIfJSXElement.__indented = true;

    elements.push({
      expression: buildArrayExpression([
        {
          expression: buildArrowFunctionExpression([], getJSXCondition(elseIfJSXElement)!.expression!)
        },
        {
          expression: buildArrowFunctionExpression([], JSXConditionToStandard(elseIfJSXElement))
        }
      ])
    });
  }

  if (elseJSXElement) {
    // @ts-ignore
    elseJSXElement.__indented = true;
    elements.push({
      expression: buildArrayExpression([
        {
          expression: buildArrowFunctionExpression([], buildBooleanLiteral(true))
        },
        {
          expression: buildArrowFunctionExpression([], JSXConditionToStandard(elseJSXElement))
        }
      ])
    });
  }

  let body = buildCallExpression(buildIdentifier('__create_condition__', false), [
    {
      expression: buildArrayExpression(elements)
    }
  ]) as any;


  return isRoot ? body : buildJSXExpressionContainer(body);
}

class JSXConditionTransformer extends Visitor {
  visitJSXElement(n: JSXElement): JSXElement {
    if (isJSXCondition(n)) {
      return transformJSXCondition(n, [], -1) as JSXElement;
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
