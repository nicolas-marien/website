---
title: Sync TypeScript interface implementation with interface definition
draft: false
slug: sync-typescript-interface-implementation-with-interface-definition
tags:
  - typescript
  - nx
created_at: '2025-08-21'
published_at: '2025-08-26'
abstract: Keep interface implementation in sync with the definition
coverImage:
  url: ./cover.jpg
  alt: waves in sync
---

In one of the teams I work with, a small issue recently arose with our domain event definition files.

The interfaces (published through npm) used by our event consumers live in a dedicated library (the repository is a [nx](https://nx.dev) monorepo).
Whereas the implementations (classes annotated with decorators) live in another one.

One day, we had to include a new attribute in a couple of events, so we added it to the implementations and shipped to production.
However, we missed a step: the interface definitions!
The field was not visible to our consumers 🤦‍♂️

Take the following interface:

```typescript
// event.interface.ts
interface IEvent {
  field: string;
}
```

And the implementation:

```typescript
// event.implementation.ts
class Event implements IEvent {
  field: string;
  anotherField: number;
}
```

For what TypeScript is concerned, there is nothing wrong with our class.
However, from a business perspective, `anotherField` is not on the interface and, in our case, will not be available to the consumer.
Of course, we could just try to be more rigorous in code reviews, but it would be better if it were automated.

Since we have access to [nx conformance](https://nx.dev/reference/core-api/conformance), our solution will leverage this tool. Our CI fails if `nx conformance:check` fails so that's perfect!
However, this could just be a simple node scripts run during CI; nx is not required for this solution to be used.

Since we'll have to read code from code, we'll be using [tsquery](https://github.com/phenomnomnominal/tsquery), which has to be one of my favorite projects ever.

First, we collect all properties from each interface. Then, we find the classes that implement these interfaces and collect their properties too. Finally, we verify that both sets of properties match exactly—which is our goal.

## Interface property collection

```typescript
import type {
  ClassDeclaration,
  Identifier,
  PropertyDeclaration,
  PropertySignature,
} from 'typescript';

const interfacesProperties = new Map<string, Set<string>>();

for await (const path of interfacesPaths) {
  const content = await fs.readFile(path, { encoding: 'utf-8' });
  const tree = ast(content);
  const interfaceDeclarations = query<Identifier>(
    tree,
    'InterfaceDeclaration > Identifier[name]',
  );

  if (!interfaceDeclarations.length) {
    continue;
  }

  for (const interfaceDeclaration of interfaceDeclarations) {
    const interfaceName = interfaceDeclaration.text;
    const interfaceProperties = query<PropertySignature>(
      tree,
      `:has(InterfaceDeclaration > Identifier[name=${interfaceName}]) > PropertySignature`,
    );

    interfacesProperties.set(
      interfaceName,
      new Set(interfaceProperties.map((node) => (node.name as Identifier).text)),
    );
  }
}
```

## Implementation property collection

```typescript
for await (const path of eventsPaths) {
  const file = await fs.readFile(path, { encoding: 'utf-8' });
  const tree = ast(file);

  const classDeclarations = query<ClassDeclaration>(tree, 'ClassDeclaration');

  for (const classDeclaration of classDeclarations) {
    const heritageClauses = query<Identifier>(
      classDeclaration,
      'HeritageClause ExpressionWithTypeArguments Identifier[name]',
    );

    const classOrInterfaceNames = heritageClauses.map((node) => node.text);

    for (const name of classOrInterfaceNames) {
      if (!interfacesProperties.has(name)) {
        continue;
      }

      const classOrInterfaceProperties = query<PropertyDeclaration>(
        classDeclaration,
        'PropertyDeclaration',
      );
      const properties = new Set(
        classOrInterfaceProperties.map((node) => (node.name as Identifier).text),
      );

      const differences = properties.difference(interfacesMapping.get(name)!);

      if (differences.size > 0) {
        // Report the issue somewhere
      }
    }
  }
}
```

Please note that the code is a brute force implementation (not 100% type-safe as it is), and I am sure that the queries used could be improved.

> [!warning]
> For this solution to be as effective as possible, all non-primitive nested fields in the implementation must `implements` an interface.

## Fixability?

We wondered if we could take this solution further by automatically fixing mistakes when they're detected. The `nx conformance` tool lets us run a generator to fix violations, which could be a useful addition.

While this would be helpful, we decided against it. Automatically adding properties would require building a two-way property management system that handles decorators, nullable values, and optional fields—plus nested structures.

# Conclusion

Having augmented implementations of our domain events has led to some issues with our consumers.
It has been fairly straightforward to implement a solution to synchronize our interface implementations with their definitions, thanks to tools such as `tsquery` and `nx conformance`.
Since it runs automatically on CI, we are now able to detect potential issues before they reach production 🎉
