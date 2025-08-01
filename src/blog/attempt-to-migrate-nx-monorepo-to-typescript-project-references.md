---
title: Attempt to Migrate Nx Monorepo to TypeScript Project References
draft: false
slug: typescript-project-references-migration-attempts
tags:
  - typescript
  - nx
  - monorepo
created_at: '2025-06-05'
published_at: '2025-06-05'
abstract: This blog post explores the migration to TypeScript project references in an NX monorepo, detailing the benefits of improved type checking and build speeds alongside the challenges encountered, such as dependency type exports and the need for extensive codebase modifications. Ultimately, the experiment revealed the complexities of adopting project references, leading to the decision to postpone full implementation until further TypeScript enhancements are available.
---

# Why Attempt This Change?

[TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html) have been available since version 3. They allow you to slice a TypeScript project into small bits. According to the documentation, the main benefits are:

> By separating into multiple projects, you can greatly improve the speed of type checking and compiling, reduce memory usage when using an editor, and improve enforcement of the logical groupings of your program.

Also, this setup is now the default when generating a new NX workspace. [This post about project linking](https://nx.dev/concepts/typescript-project-linking) and [this one about project references](https://nx.dev/blog/typescript-project-references) provide some insight.

We decided to attempt the migration on the PayFit monorepo, to try to improve the performance of the LSP.

# Steps

NX has [a guide](https://nx.dev/recipes/tips-n-tricks/switch-to-workspaces-project-references#update-individual-project-typescript-configuration) describing the changes required to move. Since this monorepo is not using [path aliases](https://www.typescriptlang.org/tsconfig/#paths), we had less work to do. The core change is about the tsconfigs.

## tsconfigs Rework

### Extends

Here are some of the tsconfigs that we can find in our libraries.

```
├── ./tsconfig.json
├── ./tsconfig.lib.json
├── ./tsconfig.spec.json
├── ./tsconfig.storybook.json
├── ./tsconfig.e2e.json
├── ./tsconfig.sandbox.json
```

In a project reference setup, the `tsconfig.json` will hold the references to other projects. The other files must no longer extend this file. Instead, they all need to extend a shared one that sets some mandatory compiler options:

- [composite](https://www.typescriptlang.org/tsconfig/#composite)
- [declaration](https://www.typescriptlang.org/tsconfig/#declaration)

For instance, here is the current `tsconfig.app.json` of the client project:

```json
{
  "extends": ["./tsconfig.json", "@payfit/tsconfigs/react-vite.json"],
  "compilerOptions": { "outDir": "../dist/out-tsc" }
}
```

And here is the target:

```json
{
  "extends": ["@payfit/tsconfigs/base.json", "@payfit/tsconfigs/react-vite.json"],
  "references": [ 
	  // all the references
  ]
}
```

In order to handle the `extends` part easily, we updated some of our [nx conformance](https://nx.dev/nx-api/conformance) rules. We also manage the fact that `tsconfig.*.json` must reference `tsconfig.{app,lib}.json` using conformance.

### References

The major source of change is the `references`. Each project needs to reference all its dependencies. This is a tedious task... But NX provides a new plugin that registers a [sync generator](https://nx.dev/concepts/sync-generators) that does just that! 🙌

With this, the tsconfigs were good to go.

## Swap the Type Checking Plugin

The type checking is done via a task inferred by the `@nx/js/typescript` plugin. We have a custom plugin that does this. So we swapped the two. The new one runs `tsc --build --emitDeclarationOnly`.

# Findings

With all this done, several things started to fall apart.

## Importing JSON

We import our translations as JSON modules. Of course, we already have the `resolveJsonModule` [flag](https://www.typescriptlang.org/tsconfig/#resolveJsonModule) enabled. However, in a project reference setup, that is not enough. They must also be declared in either the `include` or `files`. The documentation mentions this but quite vaguely.

> All implementation files must be matched by an include pattern or listed in the files array. If this constraint is violated, tsc will inform you which files weren’t specified.

## @typescript-eslint Type-Aware Linting

In some of our projects, we have handmade `.d.ts` files.
We kept running into the issue that the generated JavaScript file was not known to the project service, even if it was matching a pattern in the include array. After some digging, we arrived at the conclusion that TypeScript works differently when processing a JavaScript file with an existing `.d.ts` file with the same name in a references setup. It ignores it. But not ESLint.

That's not super important because it's generated code after all, but it's something we had to investigate quite deeply.

## The Third-Party Libraries Are Not Project References Ready

### Mini-Bosses

The other points are mitigable on our side. But this one is the one that made us stop the experiment.

In a project references setup, TypeScript relies on generated `.d.ts`. And with this, the `The inferred type of X cannot be named` errors started.

Let's take an example from a Storybook-related file:

```typescript
import { create } from 'storybook/theming/create';

export default create({
 // ...
});
```

To create the declaration file for this, TypeScript needs to access the return type of the `create` function. Here is a part of the declaration file of `storybook/theming/create`:

```typescript
// not exported 😱
interface ThemeVars extends ThemeVarsBase, ThemeVarsColors {}
declare const create: (vars?: ThemeVarsPartial, rest?: Rest) => ThemeVars;

export { create, themes };
```

The issue is that `ThemeVars` is not exported and therefore cannot be referenced in the declaration file we want to generate. Here is [a detailed explanation](https://github.com/microsoft/TypeScript/pull/58176#issuecomment-2052698294) by one of the TypeScript maintainers.

We were able to work around this one with a nice trick (using `ReturnType<typeof create>`), but that was a massive warning:

> [!danger]
Now we depend on third-party libraries to export their types in order for our type check to work.  


Up until now, the changes were quite constrained. But having the type check working on stories would have required updating a significant number of files.

We define our stories as per the [documentation](https://storybook.js.org/docs/writing-stories/typescript):

```tsx
// mycomponent.stories.tsx
const meta = {
  component: MyComponent,
  title: "Components/MyComponent",
  decorators: [],
  args: { onChange: fn() },
  parameters: {},
  argTypes: {},
} satisfies Meta<typeof MyComponent>;

// mycomponent.tsx

interface MyComponentProps {
  //...
}

export const MyComponent: FC<MyComponentProps> = () => {
  // ...
};

```

And here we have two problems:

1. The type of `fn` from `@storybook/testing` is not accessible (it's okay, we'll use noop functions).
2. The props of `MyComponent` are not accessible as well.

Even though we are using the props directly, they need to be exported.

> [!danger]
As a consequence, we would have to update all components having a story 🤯  
And more generally, most files so that the types are properly accessible for the `.d.ts` to be generated.  


### Final Boss

Picture this: your editor tells you there are errors, but `tsc --build --emitDeclarationOnly` sees nothing wrong with the code.  
However, there is obviously something wrong. The difference here is that the editor is using `tsserver`, and `tsc` consumes the `.d.ts` of the dependencies.  
In our case, one of the `.d.ts` was resolving a type as `any`, so `tsc` saw no issue. The type was incorrect because, in this scenario, the types of TanStack Query are using a `Symbol` that is not exported (see [this issue](https://github.com/TanStack/query/issues/8453)).

> [!danger]
Once again, we become dependent on the third-party types. But in this case, there is danger: the type checking on the CI would have been green, which could have led to issues in production.  


# Conclusion

We wanted to give TypeScript project references a spin to improve the LSP performance on our NX monorepo (>100 nodes).  
Conformance was a huge help in the migration, using its `fixGenerator` feature.
But the reality is that this is a huge change that could not be done incrementally.

On the one hand, a vast amount of change is required in our codebase: we would need to ensure that all types are exported properly to generate the declaration files of each library. 

On the other hand, adopting project references would require that every library we depend on has perfect type exports. Even if we contribute to those projects, it would introduce latency.

At the end of the experiment, almost 600 files were modified, and the type checking fixing only started.

With all this in mind, we decided that it would be best to wait for [TypeScript go](https://github.com/microsoft/typescript-go) to hit production.

## Opening

We managed to migrate a smaller monorepo (50 nodes in the graph), mostly servers running [NestJS](https://nestjs.com), using the same approach 🎉. 

This project was using path aliases, but removing this in favor of native workspaces was straight forward.

It was not a small PR, but the scale of the project (less external dependencies) allowed us to merge it this time 🥹.


