# RoundTable
## A decision-making app

[App description here]

## Stack

node v23.11
Nuxt 4, Firebase, Pinia, PWA, Vuetify

### Firebase config

## MVP

[Describe demo flow]

## Routes

`/` Landing Page
`/login` - Login
`/roundtables` - List of RoundTables
`/roundtables/[id]` - RoundTable details
`/join/[id]` - join a RoundTable

## Model

`users`
`roundtables`
`participants`
`options`
`votes`

## How to run it

### Build Setup

```bash
# install dependencies
$ npm install
$ npm install firebase
$ npm install -g firebase-tools

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

For detailed explanation on how things work, check out the [documentation](https://nuxtjs.org).

## Special Directories

You can create the following extra directories, some of which have special behaviors. Only `pages` is required; you can
delete them if you don't want to use their functionality.

### `assets`

The assets directory contains your uncompiled assets such as Stylus or Sass files, images, or fonts.

More information about the usage of this directory
in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/assets).

### `components`

The components directory contains your Vue.js components. Components make up the different parts of your page and can be
reused and imported into your pages, layouts and even other components.

More information about the usage of this directory
in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/components).

### `layouts`

Layouts are a great help when you want to change the look and feel of your Nuxt app, whether you want to include a
sidebar or have distinct layouts for mobile and desktop.

More information about the usage of this directory
in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/layouts).

### `pages`

This directory contains your application views and routes. Nuxt will read all the `*.vue` files inside this directory
and setup Vue Router automatically.

More information about the usage of this directory
in [the documentation](https://nuxtjs.org/docs/2.x/get-started/routing).

### `plugins`

The plugins directory contains JavaScript plugins that you want to run before instantiating the root Vue.js Application.
This is the place to add Vue plugins and to inject functions or constants. Every time you need to use `Vue.use()`, you
should create a file in `plugins/` and add its path to plugins in `nuxt.config.js`.

More information about the usage of this directory
in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/plugins).

### `static`

This directory contains your static files. Each file inside this directory is mapped to `/`.

Example: `/static/robots.txt` is mapped as `/robots.txt`.

More information about the usage of this directory
in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/static).

### `store`

This directory contains your Vuex store files. Creating a file in this directory automatically activates Vuex.

More information about the usage of this directory
in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/store).


## User Stories

### Feature: Roudtables

1. As a user, I want to create a round table so that I can pose a question to a group.
2. As a user, I want to edit a round table that has not been shared so that I can correct inaccuracies before inviting others.
3. As a user, I want to share a round table so that participants can join it.
4. As a user, I want to delete a round table that has not been shared so that I can remove drafts I no longer need.
5. As a user, I want to archive an old round table so that I can hide it from my active list without deleting it.
6. As a user, I want to join a shared round table so that I can subscribe to it, add options, and vote on options.

## RoundTables

### States:
- Draft: Created, editable, deletable, not shared yet.
- Open/Shared: Visible to invited users or anyone with the link, joinable.
- Archived: Hidden from active views, read-only or most inactive.
- Maybe later: Closed/Resolved, if voting ends and a decision is final.

### RoundTable Lifecycle
1. Create a round table

1a. Edit draft round table
1b. Delete draft round table

2. Share round table

3. Join round table

4. Archive round table

### RoundTable Structure

```
{
  title: "Where should we go for dinner?",
  question: "Where should the team go for Friday dinner?",
  description: "",
  ownerId: "uid123",
  ownerName: "Luigi",
  status: "draft", // draft | shared | archived
  shareCode: null, // filled only when shared
  sharedAt: null,
  archivedAt: null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

## Future Work

- Feature to ensure roundtable share codes are unique (to prevent collisions)


# Icons

https://pictogrammers.com/library/mdi/

simply use 'mdi-{icon name}'