---
title: Scalable GraphQL SDL generation with NestJS
created_at: "2024-10-07"
published_at: "2024-10-07"
abstract: "How to generate a GraphQL SDL file from your NestJS resolvers"
draft: false
tags:
  - devxp
  - graphql
  - nestjs
  - typescript
---

There is excellent documentation on NestJS' website regarding [how to generate SDL](https://docs.nestjs.com/graphql/generating-sdl) based on your resolver classes.

It uses an instance of `GraphQLSchemaFactory` and an array of the classes containing the GraphQL-based decorators.
I find that this approach is perfect for a small application where there is only a handful of resolvers.
However when the project starts to scale, I believe this could get a bit out of hand, and a class could easily be forgotten in the array.

What triggers the execution of the decorators is importing the file that contains them. So if we were to get all the files, we could simply `require` them (node).

I have always liked to add suffixes to my files. Therefore I name all my resolver files `name.resolver.ts`.
And thanks to this, I can use [glob](<https://en.wikipedia.org/wiki/Glob_(programming)>) patterns to retrieve them all.

Node has an [experimental glob API](https://nodejs.org/api/fs.html#fspromisesglobpattern-options), but I have been using [globby](https://github.com/sindresorhus/globby) for quite a long time now.

The last piece of the puzzle is in fact to get a reference to the classes, since the `GraphQLSchemaFactory.prototype.create` method needs them.
For this, I need all my resolver files to export the classes as a named export.

Here is everything put together:

```typescript
import { NestFactory } from "@nestjs/core";
import {
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
} from "@nestjs/graphql";
import { globSync } from "glob";
import { printSchema } from "graphql";
import { writeFileSync } from "fs";
import * as prettier from "prettier";

function getResolversClasses() {
  const filePaths = globSync(`whereyouwannastart/**/*.resolver.ts`, {
    ignore: ["node_modules/**"],
  });

  const classes: Function[] = [];

  for (const filePath of filePaths) {
    const fileExport = require(filePath);
    // NOTE: this is a bit "unsafe"
    const exportedClasses = [...Object.values(fileExport)] as Function[];
    classes.push(...exportedClasses);
  }

  return classes;
}

(async function main() {
  const schemaDestination = "whereyouneed/schema.gql";

  const app = await NestFactory.create(GraphQLSchemaBuilderModule);
  await app.init();

  const gqlSchemaFactory = app.get(GraphQLSchemaFactory);
  const classes = getResolversClasses();
  const schema = await gqlSchemaFactory.create(classes);

  const sdl = await prettier.format(printSchema(schema), {
    parser: "graphql",
  });

  writeFileSync(schemaDestination, sdl);
})();
```

During this process, I also like to apply [prettier](https://prettier.io/) to the generated file.

Of course, many things could be improved, but thanks to this piece of code, I do not have to import dozens of classes there. It can run on your CI pipeline so that your codegen is as automated as possible.

> [!warning]
> Where this solution falls short is if someone in the team forgets to add the `.resolver` suffix, or uses a default export.
>
>> [!tip]
>> However this could be addressed by custom linter rules for instance.
