import { types as t, PluginObj, PluginPass } from '@babel/core';

const convertToRuntype = (typescriptTypeNode: t.TSType) => {
  const globalRuntypeExpression = t.identifier('t');
  if (typescriptTypeNode.type === 'TSStringKeyword') {
    return t.memberExpression(globalRuntypeExpression, t.identifier('String'));
  }
};

const runtypesImportNode = t.importDeclaration(
  [t.importNamespaceSpecifier(t.identifier('t'))],
  t.stringLiteral('runtypes'),
);

interface Context extends PluginPass {
  typeName: string;
  importAdded: boolean;
}

export default function (): PluginObj<Context> {
  return {
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
