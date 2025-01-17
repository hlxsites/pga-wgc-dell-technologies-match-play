# PGA WGC Dell Technologies Match Play

## Environments
- Preview: https://main--pga-wgc-dell-technologies-match-play--hlxsites.hlx.page/
- Live: https://main--pga-wgc-dell-technologies-match-play--hlxsites.hlx.live/
- Prod: https://www.dellmatchplay.com/

## Installation

```sh
npm i
```

## Tests

```sh
npm tst
```

## Local development

1. Create a new repository based on the `helix-project-boilerplate` template and add a mountpoint in the `fstab.yaml`
1. Add the [helix-bot](https://github.com/apps/helix-bot) to the repository
1. Install the [Helix CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/helix-cli`
1. Start Helix Pages Proxy: `hlx up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
