# Better Lichess Charts

## I just want to use this! Where do I go?

Click [here](https://dylhunn.github.io/better-lichess-charts/)!

## Introduction

I always thought the charts and graphs that Lichess provides weren't that great. However, since Lichess exposes an API, I took the opportunity to re-implement them. Rather than using Lichess's approach of "insights," instead this tool generates an entire predefined report on your playing. This is a very low-effort way to explore your playing metrics.

## How to build

Clone the repo, and make sure you have node.js (npm). Then `cd` into the repo, and run `npm install`, then `npm start`. The page should open.

Making a production build is a bit more complicated. `npm run build` ordinarly does this, but first you need to use babel to compile the `lichess-api` dependency into es5.

Note to self/others: since I'm seployed on GitHub Pages, I update to a newly built version with `git subtree push --prefix build origin gh-pages`, pushing the `build` folder to a separate branch for GH Pages.

## Implementation details

This app is written using React Typescript, with Blueprint.js for UI components and Recharts for charts/graphs.

## Current Status

Basic analytics and the opening explorer are working.

## License

This is free software available under the [GPL v3 license](https://www.gnu.org/licenses/gpl-3.0.en.html).