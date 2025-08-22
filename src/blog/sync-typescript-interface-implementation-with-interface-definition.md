---
title: Sync Typescript interface implementation with interface definition
draft: true
slug: sync-typescript-interface-implementation-with-interface-definition
tags: ['typescript', 'nx']
created_at: '2025-08-21'
published_at:
abstract: CHANGE_ME
---

In one of the team I work with, an small issue recently arose with our domain event definition files.
The interfaces that are published through npm to be used by our event consumers live in a dedicated library (the repository is an [nx](https://nx.dev) monorepo) and the implementations (classes annotated with decorators) live in another one. 
One day a new attribute had to be included in a couple of events, so the team added it the implementations, and shipped to production. 
However, we missed a step: the interface definitions! The field was not visible to our consumers 🤦‍♂️

Take the following interface: 

```typescript
// event.interface.ts
interface IEvent {
	field: string
}
```

And the implementation:

```typescript
// event.implementation.ts
class Event implements IEvent {
	field: string
	anotherField: number
}
```

For what Typescript is concerned, there is nothing wrong with our class. But from a business perspective `anotherField` is not on the interface, and in our case will not be available to consumer. 
Of course we could just try to be more rigorous in code reviews, but it would be better automated.

Since are have access to [nx conformance](https://nx.dev/reference/core-api/conformance), our solution will be leveraging this tool. Our CI fails if `nx conformance:check` fails so that's perfect!
However this could just be a simple node scripts run during CI, nx is not required for this solution to be used.

Since we can to understand code from code, we'll be using [tsquery](https://github.com/phenomnomnominal/tsquery), which has to be one of my favorite projects ever.

The idea is to build a set of properties per interface, then find the classes implementing the interfaces, build a set of properties and finally make sure that the set are identical (which is what we want for our use case).

## Interface properties collection

```typescript
const interfacesProperties = new Map<string, Set<string>>();
for await (const file of interfaceGlobs) {
  const fileContent = await fs.readFile(file, { encoding: "utf-8" });
  const tree = ast(fileContent);
  const interfaceDeclarations = query(
    tree,
    "InterfaceDeclaration > Identifier[name]"
  );

  if (!interfaceDeclarations.length) {
    continue;
  }

  for (const interfaceDeclaration of interfaceDeclarations) {
    const interfaceName = interfaceDeclaration.text;
    const interfaceProperties = query(
      tree,
      `:has(InterfaceDeclaration > Identifier[name=${interfaceName}]) > PropertySignature`
    );

    interfacesProperties.set(
      interfaceName,
      new Set(interfaceProperties.map((node) => node.name.text))
    );
  }
}
```

## Implementation property collection

```typescript
for await (const file of implentationGlobs) {
  const fileContent = await fs.readFile(file, { encoding: "utf-8" });
  const tree = ast(fileContent);

  const classDeclarations = query(tree, "ClassDeclaration");

  for (const classDeclaration of classDeclarations) {
    const heritageClauses = query(
      classDeclaration,
      "HeritageClause ExpressionWithTypeArguments Identifier[name]"
    );

    const classOrInterface = heritageClauses.map((node) => node.text);

    for (const name of classOrInterface) {
      // NOTE: HeritageClause also catches class inheritance
      if (!interfacesMapping.has(name)) {
        continue;
      }

      const classOrInterfaceProperties = query(
        classDeclaration,
        "PropertyDeclaration"
      );
      const properties = new Set(
        classOrInterfaceProperties.map((node) => node.name.text)
      );

      const differences = properties.difference(interfacesMapping.get(name));

      if (differences.size > 0) {
        // report the error either somehow
      }
    }
  }
}

```

The code is a brute force implementation (not 100% type-safe as it is), and I am sure that the queries used could be improved. 

For this solution to be as effective as possible, all non primitive nested fields in the implementation must `implements` an interface.

## Fixability?

We wondered wether this solution could be brought a step further and we could automatically fix the mistakes when they are caught. `nx conformance` allows us to run a generator to fix a violation, so it could be a nice addition.
As nice as it would be, we decided to stop there because automatically adding properties would require a two-way property management system, with decorators, nullability, and "optionability". No mentioning of nested fields.