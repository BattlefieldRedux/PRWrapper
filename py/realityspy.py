import socket
import bf2
import host

player_fix_timer = None; 
wrapper_socket =  None;

def init( ):
    host.registerGameStatusHandler( onGameStatusChanged )
	
	
def onGameStatusChanged( status ):
	global player_fix_timer

	if status == bf2.GameStatus.Playing and player_fix_timer == None:
		initSocket()
		player_fix_timer = bf2.Timer( updatePlayerList, 0, 1 )
		player_fix_timer.setRecurring( 5 )

	elif player_fix_timer:
		player_fix_timer.destroy()
		player_fix_timer = None
		if(wrapper_socket):
			# close the socket
			wrapper_socket.close()
			wrapper_socket = None


def initSocket():
	host.rcon_invoke( 'game.sayall "Initializing socket"' )
	global wrapper_socket;
	wrapper_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, 0)
	wrapper_socket.connect(('localhost', 55056))	

def updatePlayerList( data = "" ):
	host.rcon_invoke( 'game.sayall "updatePlayerList"' )
	
	# send the command
	global wrapper_socket;
	wrapper_socket.send(prepareMessage())
	
def prepareMessage():
	playerString = "\01player_\00"
	scoreString = "\00score_\00"
	pingString = "\00ping_\00"
	teamString = "\00team_\00"
	deathString = "\00deaths_\00"
	pidString = "\00pid_\00"
	killString = "\00skill_\00"
	aiString = "\00AIBot_\00"

	for player in bf2.playerManager.getPlayers():
		if player.isValid():
			playerString += "\00%s" % player.getName()
			scoreString += "\00%s" % player.score.score
			pingString += "\00%s" % player.getPing()
			teamString += "\00%s" % player.getTeam()
			deathString += "\00%s" % player.score.deaths
			pidString += "\00%s" % player.getProfileId()
			killString += "\00%s" % player.score.kills
			aiString += "\00%s" % player.isAIPlayer()
			
	playerString += "\00"
	scoreString += "\00"
	pingString += "\00"
	teamString += "\00"
	deathString += "\00"
	pidString += "\00"
	killString += "\00"
	aiString += "\00"
	
	return playerString + scoreString + pingString + teamString + deathString + pidString + killString + aiString