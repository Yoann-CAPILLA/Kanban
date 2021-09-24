# Kanban

Simple kanban application.

You can create/modify/delete lists, cards and labels.

Cards are created inside a list.
Labels are associated inside a card.

Double click on the list title to modify it.
Deleting a list will also delete its cards.

You can also update the color of cards and labels.

## Stack

### Front

- Vanilla JavaScript

### Back

- NodeJs
- Express
- PostgreSQL
- Sequelize

## Installation

Clone the repository locally :

```bash
git clone <repo url>
```

Install the dependencies via NPM :

```bash
npm i
```

Create a postgresql database :

```bash
createdb kanban
```

/!\ You need to configure PostgreSQL or provide the environment variables to run the `createdb` command.

Import the tables into your database via the SQL file provided in the "doc" folder with :

```bash
psql -U user -h host -d dbName -f doc/kanban.sql
```

Rename the `.env.example` file to `.env` and provide de correct PG_URL and PORT.

### Launch

```bash
npm start
```

## Modification

If you want to modify the JS files in `public/src/`, you need to bundle them :

```bash
npx browserify -e public/src/app.js -o public/assets/js/bundle.js
```
