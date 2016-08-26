# PR Wrapper (WIP)
An UDP wrapper for Project Reality: BF2. This wrapper intercepter gamespy queries to the server and returns an expanded version with all 100 players (BF2 limits these replies to the first 64p). This means that both PRSPY and server browser will display all players that are playing in the server.

The information for the remaining 36 players gameservers is obtain throught a python running in the gameserver.


## Install
The following command will install all required dependencies.
```
npm install
```

## Run
And to keep it simple, the following command will clean, build and start the wrapper (server).
```
npm start
```
