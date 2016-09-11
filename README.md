# PR Wrapper (WIP)
An UDP wrapper for Project Reality: BF2. This wrapper intercepter gamespy queries to the server and returns an expanded version with all 100 players (BF2 limits these replies to the first 64p). This means that both PRSPY and server browser will display all players that are playing in the server.

The information for the remaining 36 players gameservers is obtain throught a python running in the gameserver.


## Install
- Install all dependencies with:
```
npm install
```
- Install python by moving ```realityspy.py``` to ```\mods\pr\python\game\``` and adding in the ```__init__.py```  the following code:
```
import playersfix
playersfix.init()
```
- In ```\mods\pr\settings\serversettings.con``` set the interface IP to 'loopback' ip, ie: 
```
sv.interfaceIP "127.0.0.1"
```


## Run
- The following command will clean, build and start the wrapper (server).
- Requires administrator/sudo permissions to override UDP port.
```
npm start
```

## Configuration
- In ```realityspy.py``` you can change the port to which you'll report to the proxy
- In ```app.ts``` you can change:
  - The gamespy's port
  - The port that will receive updates from the server
  - The public IP, ie the IP that clients connect to, (This is optional but recomended, the code will attempt to obtain this ip)


