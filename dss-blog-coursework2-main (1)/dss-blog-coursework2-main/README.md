# dss-blog-coursework2

## Secuirty Measures Implemented

[Google Doc](https://docs.google.com/document/d/1pWhcqlY0WJ36qim6aL8ZJh1TfDsc3FzrZuF1V99cHFg/edit?usp=sharing)

## Steps to run project

1. Download and install PostgreSQL (remember what password you set, it will be needed later)
2. Open PgAdmin and create new database called `dss-blog`
3. Copy contents of [database-script](database-script) and execute query in `dss-blog`
4. Open [config.json](config.json) and update `password` to the password you set for PostgreSQL
5. Open a terminal and `cd` into the project directory
6. Run `npm install`
7. Run `npm start`
8. Go to [https://localhost:3000](https://localhost:3000)

## Steps to run tests

1. Open PgAdmin and create new database called `dss-blog-test`
2. Copy contents of [database-script](database-script) and execute query in `dss-blog-test`
3. Open [config.json](config.json) and update `password` to the password you set for PostgreSQL
4. Open a terminal and `cd` into the project directory
5. Run `npm test`
