# TABLEAUX

## Development

TABLEAUX is fully functional in development.

node: 24

Please build the app before starting it:
`npm ci --silent && npm run build --mode=staging`

To install it : `npm i`
To run it locally : `npm start`

And the project should be available via your favorite browser at http://localhost:5173/.

## Serve localy

To create build: `npm run build`
To run local server: `serve -s server/dist` (requirement: install serve. `npm -g serve`)

## Build for production

The react client app is served by the node server in production.
Vite build creates a build in `/dist` folder. This folder has to be moved into the `/server` folder.

## Deployment

The version number follows [semver](https://semver.org/).

To deploy in production, simply run this command from your staging branch :

`npm run deploy:[patch|minor|major]`
⚠️ Obviously, only members of the [dataesr organization](https://github.com/dataesr/) have rights to push on the repo.

## How to push a new boards in prod

1. Add the new board in the Mongo of prod, in the database "tableaux-prod", in the collection "board". A simple copy / paste trough MongoDB Compass should be enough
2. Add the needed charts into /client/src/boards/integration/charts-registry.tsx
3. Push in prod (cf. previous paragraph)