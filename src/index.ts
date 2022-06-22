import {
  Expression,
  JSXElement, JSXText, Program,
} from '@swc/core';
import Visitor from '@swc/core/Visitor';
import {
  ExprOrSpread, JSXElementChild
} from '@swc/core/types';
import {
  buildArrayExpression,
  buildArrowFunctionExpression, buildBooleanLiteral, buildCallExpression, buildIdentifier, buildImportDeclaration,
  buildJSXElement,
  buildJSXExpressionContainer, buildJSXText, buildNamedImportSpecifier, buildNullLiteral, buildStringLiteral
} from './utils';

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
    if (n.__skip) {
      return buildJSXText('');
    }

    return n;
  }

  let isRoot = currentIndex === -1;

  type JSXConditionExpression = {
    condition: Expression;
    jsxElement: JSXElement;
  };

  let conditions: JSXConditionExpression[] = [
    {
      condition: condition!.expression!,
      jsxElement: n
    }
  ];

  let continueSearch = true;
  let indent = 1;
  let nextJSXKind: JSXCondition | undefined;
  do {
    let nextSibling = currentList[currentIndex + indent];
    if (nextSibling && nextSibling.type === 'JSXText' && nextSibling.value.trim() === '') {
      indent++;
    } else if (nextSibling && nextSibling.type === 'JSXElement' && (nextJSXKind = getJSXCondition(nextSibling)) && nextJSXKind && nextJSXKind.type != JSXConditionType.if) {
      conditions.push({
        condition: nextJSXKind.type === JSXConditionType.elseif ? getJSXCondition(nextSibling)!.expression! : buildBooleanLiteral(true),
        jsxElement: nextSibling
      });
      // @ts-ignore
      nextSibling.__skip = true;
      continueSearch = nextJSXKind.type === JSXConditionType.elseif;
      indent++;
    } else {
      continueSearch = false;
    }
  } while (continueSearch);

  let elements: ExprOrSpread[] = conditions.map((con) => {
    return {
      expression: buildArrayExpression([
        {
          expression: buildArrowFunctionExpression([], con.condition)
        },
        {
          expression: buildArrowFunctionExpression([], JSXConditionToStandard(con.jsxElement))
        }
      ])
    }
  });

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
