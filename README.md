# WACI Demo

## Running Locally

### Prerequisites

- PostgreSQL

```
brew install postgresql
brew services run postgresql
```

### Install

```
npm i -g lerna
npm i
lerna bootstrap
```

### Setup Environment

```
cd packages/server
cp .env.example .env
cd ../../
```

### Run

```
npm run reset-dev
npm run dev
```
