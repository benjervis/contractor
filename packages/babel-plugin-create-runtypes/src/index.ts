import {
  types as t,
  PluginObj,
  PluginPass,
  parseSync as babelParse,
  transformFromAstSync,
  template,
} from '@babel/core';
import { parse, print } from 'recast';

export const withRecast = (codeString: string) => {
  const ast = parse(codeString, {
    parser: {
      parse: (source: string) =>
        babelParse(source, {
          filename: 'file-to-be-transformed.ts',
          plugins: ['@babel/plugin-syntax-typescript'],
          configFile: false,
          parserOpts: {
            tokens: true,
          },
        }),
    },
  });

  const options = {
    filename: 'file-to-be-transformed.ts',
    cloneInputAst: false,
    configFile: false,
    code: false,
    ast: true,
    plugins: ['@babel/plugin-syntax-typescript', createRuntypesPlugin],
  };

  const transformedAst = transformFromAstSync(ast, codeString, { ...options });

  if (!transformedAst?.ast) {
    throw new Error('Unable to transform AST');
  }
  const printed = print(transformedAst.ast);

  return printed.code;
};

type TSPrimitive = 'TSStringKeyword' | 'TSNumberKeyword' | 'TSBooleanKeyword';

const tsPrimitivesToRuntype: Record<TSPrimitive, string> = {
  TSStringKeyword: 'String',
  TSNumberKeyword: 'Number',
  TSBooleanKeyword: 'Boolean',
};
const isTsPrimitive = (input: string): input is TSPrimitive =>
  Object.keys(tsPrimitivesToRuntype).includes(input);

const convertToRuntype = (typescriptTypeNode: t.TSType) => {
  const globalRuntypeExpression = t.identifier('t');

  if (isTsPrimitive(typescriptTypeNode.type)) {
    return t.memberExpression(
      globalRuntypeExpression,
      t.identifier(tsPrimitivesToRuntype[typescriptTypeNode.type]),
    );
  }
};

const runtypesImportNode = template(
  `import * as t from 'runtypes';`,
)() as t.Statement;

interface Context extends PluginPass {
  typeName: string;
  importAdded: boolean;
}

export function createRuntypesPlugin(): PluginObj<Context> {
  return {
    name: 'babel-plugin-create-runtypes',
    pre() {
      this.typeName = '';
      this.importAdded = false;
    },
    visitor: {
      ExportNamedDeclaration(path) {
        if (path.node.exportKind !== 'type') {
          return;
        }

        const typeNameDeclaration = path.node.declaration;

        if (!typeNameDeclaration) {
          throw new Error('Type declaration is undefined');
        }

        if (t.isTSTypeAliasDeclaration(typeNameDeclaration)) {
          this.typeName = typeNameDeclaration.id.name;
          const actualType = typeNameDeclaration.typeAnnotation;
          const runtype = convertToRuntype(actualType);

          const exportOutput = t.exportNamedDeclaration(
            t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier(this.typeName), runtype),
            ]),
          );
          path.replaceWith(exportOutput);

          if (!this.importAdded) {
            const parent = path.parentPath.node;
            if (!t.isProgram(parent)) {
              return;
            }

            parent.body.unshift(runtypesImportNode);
            this.importAdded = true;
          }
        }
      },
    },
  };
}
