---
title: Improving .env collaboration with 1Password CLI
slug: improving-dot-env-collaboration
draft: false
created_at: 2024-08-31
tags:
  - devxp
---

In our team of four, we wanted to improve the way we work with environment variables.
As most people do, we are using `.env` file when working locally store our secrets and environment variables.

A `.env` file is a plain text file where variables are declared as follows:

    VARIABLE=value
    OTHER_VARIABLE=othervalue

Your application will read this file and the variables will be available to use.
For instance, if using NestJS, you can instruct the framework to read those files when registering an instance of `ConfigModule`.

When we kickstarted our project, we were only two developers on the team, and we obviously started by sending each other the file on Slack.
At first, we would rather not have something under version control to reduce the risk of disclosing secrets to the internet.
Since we hired new contributors, we needed to find a solution that would allow to easily collaborate on our `.env`.

In my organization, we use 1Password to store day-to-day credentials. And in my team we have a dedicated vault where we but our development credentials, like API keys for providers A, B and C.

And 1Password ships with a [CLI](https://developer.1password.com/docs/cli/get-started/)! So we figured that there should be something we can do to leverage this tool.

Here is what we tried and what we settled on.

## First iteration: the .env file as a Document or a secured note

1Password has the capability to store files, so the first thing we tried was to put the .env as is and retrieve it directly though the CLI.

While this approach is straightforward to set up it, I feel it lacks several features to become a robust daily driver.
On the first hand, updating the file is not seamless. It has to be downloaded, modified and then re-uploaded.
On the second hand, it is difficult to keep track of the modifications made to the file. And even if 1Password provides some insights, they are not as powerful compared to git, where you get history, blame etc…
Moreover, I feel it's same to assume that we want to have each secret as a separate entry inside the vault. As a consequence, having the file directly in the vault removes the single source of truth for an entry.

## Second iteration: crafting the file via a shell script

To mitigate the downsides of our first iteration, we modified all the entries of our secrets in the vault to add a custom field called `variable`, where we put the name of the environment variable.
We also assigned a dedicated tag to those entries.
Since we would rather not put things that were not secrets in 1Password, we created a `.env` file (git-ignored) that contained all our regular variables.
Then we wrote a shell script that pulled all the entries marked with our tag in JSON format.
The next step was to fetch each individual item so we can access our custom field.
We then used [jq](https://jqlang.github.io/jq/) to extract the `variable` field and glued everything together and appended our secrets to the existing `.env` file.
At this time, we were also using a local instance of AWS secret manager using [localstack](https://www.localstack.cloud/), so we used this script to seed the secrets in there as well.

We dwelled on this iteration for months, and while it was perfectly fine, it was something else we needed to maintain, it also requires extra metadata in the vault for it to work.

But my major issue with this, was that since the `.env` is ignored by version control, where does a new contributor start? Someone has to provide an existing env file, or keep one in 1Password, but that leads to even more drawbacks as the first iteration.

## Final iteration: .env template file

So once again, we embarked on a new journey to find a solution. This time something that could ease the onboarding of a new contributor.

And often the answer lies in the question: how can we leverage 1Password CLI for our `.env` file management?
We'll have a proper read of the documentation 😅
We found that the `inject` command of the CLI is everything we wished for.
Our repository contains a `.env.tpl` file, which is **not git-ignored**. And inside this file are [secret references](https://developer.1password.com/docs/cli/secret-reference-syntax/), alongside regular variables.
To generate the final `.env` file, we just tell 1Password to use our template file as input and to create the file: `op inject -i .env.tpl -o .env` ([see also](https://developer.1password.com/docs/cli/secrets-config-files)).

## Conclusion

As for now, this seems like a viable solution for our team.
It solves all the issues that were previously described:

- No secret leak, as everything lives inside 1Password
  - Each secret under its entry in the vault.
- Easy to maintain, as the template file is tracked by git
- Easy to keep track of changes
  - The template file is just plain text
  - Can leverage version control.
