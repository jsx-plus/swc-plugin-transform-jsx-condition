import {
  ArrowFunctionExpression, BooleanLiteral,
  CallExpression,
  Expression, Identifier, ImportDeclaration,
  JSXElement,
  JSXExpressionContainer, JSXText,
  NullLiteral
} from '@swc/core';
import {
  Argument,
  ArrayExpression, BlockStatement,
  ExprOrSpread,
  HasSpan, Import, ImportSpecifier,
  JSXClosingElement,
  JSXElementChild,
  JSXOpeningElement, NamedImportSpecifier,
  Node, Pattern, StringLiteral, Super, TsTypeParameterInstantiation
} from '@swc/core/types';

export function buildBaseExpression<T>(other: any): Node & HasSpan & T {
  return {
    ...other,
    span: {
      start: 0,
      end: 0,
      ctxt: 0
    },
  }
}

export function buildArrayExpression(elements: (ExprOrSpread | undefined)[]): ArrayExpression {
  return buildBaseExpression({
    type: 'ArrayExpression',
    elements: elements
  });
}

export function buildJSXElement(opening: JSXOpeningElement, children: JSXElementChild[], closing?: JSXClosingElement): JSXElement {
  return buildBaseExpression({
    type: 'JSXElement',
    opening: opening,
    children: children,
    closing: closing
  });
}

export function buildArrowFunctionExpression(params: Pattern[], body: BlockStatement | Expression): ArrowFunctionExpression {
  return buildBaseExpression({
    type: 'ArrowFunctionExpression',
    params: params,
    body: body,
    async: false,
    generator: false
  });
}

export function buildNullLiteral(): NullLiteral {
  return buildBaseExpression({
    type: 'NullLiteral'
  });
}

export function buildJSXExpressionContainer(expression: Expression): JSXExpressionContainer {
  return buildBaseExpression({
    type: 'JSXExpressionContainer',
    expression: expression
  });
}

export function buildImportDeclaration(specifiers: ImportSpecifier[], source: StringLiteral): ImportDeclaration {
  return buildBaseExpression({
    type: 'ImportDeclaration',
    specifiers: specifiers,
    source: source
  });
}

export function buildStringLiteral(value: string): StringLiteral {
  return buildBaseExpression({
    type: 'StringLiteral',
    value: value
  });
}

export function buildJSXText(value: ''): JSXText {
  return buildBaseExpression<JSXText>({
    type: 'JSXText',
    value: value,
    raw: value
  })
}

export function buildBooleanLiteral(value: boolean) {
  return buildBaseExpression<BooleanLiteral>({
    type: 'BooleanLiteral',
    value: value
  });
}

export function buildNamedImportSpecifier(local: Identifier, imported: Identifier | null): NamedImportSpecifier {
  return buildBaseExpression({
    type: 'ImportSpecifier',
    local: local,
    imported: imported
  });
}

export function buildCallExpression(callee: Expression | Super | Import, args: Argument[]): CallExpression {
  return buildBaseExpression({
    type: 'CallExpression',
    callee: callee,
    arguments: args
  })
}

export function buildIdentifier(name: string, optional: boolean): Identifier {
  return buildBaseExpression({
    type: 'Identifier',
    value: name,
    optional: optional
  })
}
