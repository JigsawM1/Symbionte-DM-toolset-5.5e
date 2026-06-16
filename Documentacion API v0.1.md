
Calls
boards
whereAmI
Parameters

none

Returns

boardFragment

Description

Returns the board fragment of the currently loaded board.




getBoardsInThisCampaign
Parameters

none

Returns

Array[boardFragment]

Failure States


insufficientRights
Description

Returns a list of board fragments of all the boards in the currently active campaign.




getMoreInfo
Parameters

Description
Name	Type
boardFragmentOrIds	Array[fragmentOrId]
Returns

Array[boardInfo]

Description

Returns more info on the specified board.




bookmarks
getBookmarksInThisCampaign
Parameters

none

Returns

Array[bookmark]

Failure States


insufficientRights
Description

Returns a list of all bookmarks in the currently active campaign.




getBookmarksInThisBoard
Parameters

none

Returns

Array[bookmark]

Failure States


insufficientRights
Description

Returns a list of all bookmarks in the currently loaded board.




gotoBookmark
Parameters

Description
Name	Type
bookmarkFragmentOrId	fragmentOrId
Returns

none

Failure States


invalidBookmarkId
couldNotFindBookmark
couldNotFindBoard
Description

Sends the own clients' camera to the specified bookmark, identically to how it would work when searching for the bookmark in the boards list and clicking on it there or how a talespire://goto/bookmark/ links behaves.




sendToBookmark
Parameters

Description
Name	Type
bookmarkFragmentOrId	fragmentOrId
clientFragmentsOrIds	Array[fragmentOrId]
Returns

none

Failure States


invalidBookmarkId
couldNotFindBookmark
couldNotFindBoard
insufficientRights
Description

Sends the specified list of clients (can also only be one) to the specified bookmark, identically to how it would work when searching for the bookmark in the boards list and clicking on it there or how a talespire://goto/bookmark/ links behaves.




campaigns
whereAmI
Parameters

none

Returns

campaignFragment

Description

Returns info about the campaign that the current user client (ie: The one running this Symbiote) is in.




getMoreInfoAboutCurrentCampaign
Parameters

none

Returns

campaignInfo

Description

Returns more info on the specified campaign.




chat
send
Parameters

Name	Type	Description
message	string	truncated if length > 400
target	fragmentOrId	 
Returns

none

Failure States


invalidTarget
invalidPlayerId
Description

Sends the text specified in message to the given target via chat. Target can be either a single player fragment or player ID (not client ID) or one of the following keywords: “gms”, “board”, “campaign” which send to all GMs, all players on the current board or all players online respectively. All GMs specifically sends to all clients that have GM permissions, regardless of whether they currently are or aren't in GM mode. Received chat messages trigger the chatMessageReceived event from the onChatMessage event source.

Chat allows for rich text formatting within the feature set of Unity's TextMeshPro.




multiSend
Parameters

Name	Type	Description
message	string	truncated if length > 400
targetPlayerFragmentsOrIds	Array[fragmentOrId]	 
Returns

none

Description

Sends chat messages to several players at once. Can either be provided with an array of player fragments or array of player IDs. Useful if you want to target several players with the same message, if you want to send the same message to all players you can instead use chat.send with the target “board” or “campaign”. The target keywords used in chat.send don't work here. Received chat messages trigger the chatMessageReceived event from the onChatMessage event source.

Chat allows for rich text formatting within the feature set of Unity's TextMeshPro.




sendAsCreature
Parameters

Name	Type	Description
message	string	truncated if length > 400
creatureFragmentOrId	fragmentOrId	 
target	string	 
Returns

none

Failure States


invalidCreatureId
invalidTarget
insufficientRights
Description

Sends a chat message as the specified creature. Creatures can either be specified by their ID, or by their fragment object which is returned by any of the functions returning creatures, like getCreaturesInParty or getSelectedCreatures. Message and target work the same as with the chat.send function call.

Chat allows for rich text formatting within the feature set of Unity's TextMeshPro.




multiSendAsCreature
Parameters

Name	Type	Description
message	string	truncated if length > 400
creatureFragmentOrId	fragmentOrId	 
targetPlayerFragmentsOrIds	Array[fragmentOrId]	 
Returns

none

Failure States


invalidCreatureId
insufficientRights
Description

Sends chat messages to several players at once as the specified creature. See chat.sendAsCreature for how to specify the creature to speak as. Message and target work the same as with the chat.multiSend function call. Received chat messages trigger the chatMessageReceived event from the onChatMessage event source.

Chat allows for rich text formatting within the feature set of Unity's TextMeshPro.




clients
whoAmI
Parameters

none

Returns

clientFragment

Description

Returns the client fragment of the own client (= The client that this Symbiote is running in).




getClientsInThisBoard
Parameters

none

Returns

Array[clientFragment]

Description

Returns a list of all clients currently connected to this board.




isMe
Parameters

Description
Name	Type
clientFragmentOrId	fragmentOrId
Returns

boolean

Description

Returns true if the specified client ID (or client fragment) is the same client as the one running the Symbiote (= whether the client is your own client). Returns false otherwise.




getMoreInfo
Parameters

Description
Name	Type
clientFragmentsOrIds	Array[fragmentOrId]
Returns

Array[clientInfo]

Description

Returns more info on the specified client.




contentPacks
getContentPacks
Parameters

none

Returns

Array[contentPackFragment]

Description

Returns a list of all currently loaded content packs as fragments. Content packs can be loaded in and out at runtime (see contentPacks.onContentPackChange) as a preparation for asset modding support, currently the official asset packs are all loaded at the start.




getMoreInfo
Parameters

Description
Name	Type
contentPackFragmentsOrIds	Array[fragmentOrId]
Returns

Array[contentPackInfo]

Description

Returns the all content pack elements (all tiles, props, minis, music, ...) for the specified content pack(s). This contains all the content pack elements alongside their metadata like tags, sizes, icon positions in the atlas, etc.




findBoardObjectInPacks
Parameters

Description
Name	Type
boardObjectFragmentOrId	fragmentOrId
contentPacksInfos	Array[contentPackInfo]
Returns

boardObjectFindResult

Description

Takes a board object fragment or ID, as well as a list of contentPacksInfos to find the specified board object in the packs. A board object is a tile, prop or mini and the ID or fragment can for example be found by parsing a slab received from slabs.getSlabInActiveSelection. contentPacksInfos can be queried by calling contentPacks.getMoreInfo. This function will only search through content packs that are provided, which means that you can search through only a subset of content packs by passing it an array of content packs that don't include all content packs. If the specified board object is not found in any of the provided packs, it will return a notFound error.




createThumbnailElementForBoardObject
Parameters

Description
Name	Type
boardObjectInfo	object
size	int
Returns

object

Description

Creates a DOM element showing the library thumbnail for the specified board object (= tile, prop or mini). Optionally allows a size to be set, defaults to 128×128px. The board object info can be found in the content packs returned by contentPacks.getMoreInfo, though a helper function for searching through content packs is also provided: contentPacks.findBoardObjectInPacks. The return element is a DOM element that can be added into the DOM with various JS functions, for example: appendChild or prepend.




creatures
getUniqueCreaturesInThisCampaign
Parameters

none

Returns

Array[creatureFragment]

Failure States


insufficientRights
Description

Returns a list of all unique creatures (as fragments) in the currently active campaign.




getCreaturesOwnedByPlayer
Parameters

Description
Name	Type
playerFragmentOrId	fragmentOrId
Returns

Array[creatureFragment]

Failure States


invalidPlayerId
insufficientRights
Description

Returns a list of all creatures owned by a specific player (as fragments). Player can be specified either as id or as a player fragment.




getSelectedCreatures
Parameters

none

Returns

Array[creatureFragment]

Description

Returns a list of all currently selected creatures. This can either be an array of length 1 if just one creature is selected (or 0 if none), or an arbitrary length of up to 50 when groups of minis are selected with the lasso.




getMoreInfo
Parameters

Description
Name	Type
creatureFragmentsOrIds	Array[fragmentOrId]
Returns

Array[creatureInfo]

Description

Returns more info on the specified mini. This includes states like knockdown, their stats, names, morphs, etc. GMs (including players who can GM, but are in player mode currently) can see all the info on all the minis, players will only see data they themselves can find out through the TaleSpire UI, meaning most data is only visible on minis they own.




getCreatureStatNamesForThisCampaign
Parameters

none

Returns

Array[string]

Description

Returns an array of length 8 with the stat names as set in the campaign settings.




createBlueprint
Parameters

Description
Name	Type
creatureInfo	creatureInfo
Returns

string

Description

Returns a talespire:// URL creature blueprint created from the specified creature info. This can either be the creature info for an existing creature on the board or an edited (or completely newly created) creature info object. The ID of creature info is not used, so does not need to be populated when creating a creature info object from scratch.




debug
log
Parameters

Description
Name	Type
msg	object
Returns

none

Description

Writes the given string into a Symbiote-specific log.txt file located in a .debug folder in the directory of the Symbiote itself. Each call to debug.log writes in a new line into the log. For delevopment purposes the browser's console.log is likely to be more useful, but debug.log allows a simple way for users to send log files to the Symbiote developers without needing to know how to attach the Chrome dev tools to the Symbiote and how to read/export the console messages.

Symbiote logs are kept like the Game logs are: Starting the Symbiote checks whether a log.txt already exists and if so moves it to log-prev.txt. The first call to debug.log then creates a new log.txt file and for the rest of the Symbiote's execution it will keep writing to the newly created file.




dice
isValidRollString
Parameters

Description
Name	Type
rollStr	string
Returns

boolean

Description

Returns true if the given string is a valid dice roll string, false if not. A roll string can consist of several roll groups separated by forward slashes / and then a dice roll with each an arbitrary amount of dice or static modifiers chained with operators. For a more in-depth description of the dice string format, see “Dice Links” section here. Examples: 3d12, 2d20+3, d8+5d6+2d4+2/d20+7




makeRollDescriptors
Parameters

Description
Name	Type
rollString	string
Returns

Array[rollDescriptor]

Description

Takes a dice roll string and returns an array of intermediate descriptor objects for use in dice.putDiceInTray. Each array entry corresponds to one dice group (separated by a forward slash /) See dice.isValidRollString for more info on what a roll string is.




evaluateDiceResultsGroup
Parameters

Description
Name	Type
resultsGroup	rollResultsGroup
Returns

int

Failure States


invalidOperand
invalidOperator
Description

Evaluates a results group from the dice results according to their operators. Uses the same logic as TaleSpire itself to evaluate the results group, meaning it will always stay consistent with the native dice results, but still allows you handling the results of individual groups differently to for example implement a “keep highest group” function.




sendDiceResult
Parameters

Description
Name	Type
resultGroups	Array[rollResultsGroup]
optionalRollId	string
Returns

string

Failure States


emptyGroupResults
invalidDiceType
invalidOperator
invalidScore
invalidModifier
invalidOperand
invalidRollId
Description

Sends a dice result for the TaleSpire UI to display. resultGroups is structured identically to a native dice roll result like could be returned from the dice.onRollResults event source. Can optionally specify a rollId that can correspond to a dice roll within TaleSpire, like one that was created by dice.putDiceInTray. If not specified it is treated as a “new” dice roll and has no association to any dice on the board. All dice results that were sent using this function have an indicator in the UI that show this dice result was sent by a Symbiote which allows GMs to differentiate between known good rolls done from within TaleSpire and results that a player could have tampered with (like for example by always sending a dice result that has a specific value instead of a random result).




putDiceInTray
Parameters

Description
Name	Type
rollDescriptors	Array[rollDescriptor]
quietResults	boolean
Returns

string

Failure States


foundEmptyDiceGroup
unsupportedSidesCount
unsupportedDieCount
noDiceSpecified
notInBoard
Description

Puts a dice roll specified by an array of roll descriptors into the tray ready for the player to roll. If hideResults is set to true, the result of the roll will not be shown and will also not be visible to players in the chat history. GMs will have an indicator of when a roll with hidden results has happened that they can click to see the results of this roll. This is meant to work in conjunction with dice.sendDiceResult so Symbiotes can “override” the roll result, while retaining the GMs ability to cross check what was rolled and what was reported to be the result, because Symbiotes can report any result they like and as such could be used to cheat rolls.

Returns a rollId used to keep track of this specific roll in the future. Any subsequent roll of these dice will use this rollId, as well as the “rollCleared” event of dice.onRollResults.

Once the dice have been rolled their result can be read from the rollResults event from the dice.onRollResults event source.




initiative
getQueue
Parameters

none

Returns

initiativeQueue

Description

Returns the contents of the turn queue as a list. Each entry in the list contains an id, a name and a kind - as of right now the kind will always be “creature”, but later on the turn queue is intended to be able to store more than just creatures (eg: AoE markers), so checking for which kind it is should be done already to not encounter bugs whenever the initiative mode gets updated.

The turn queue is still accessible with this call even if the client is currently not in initiative mode, as of right now there are no API calls for determining which game mode (exploration/initiative/cutscene) the client is in.




localStorage
global
setBlob
Parameters

Description
Name	Type
str	string
Returns

none

Failure States


ensurePathFailed
writeFailed
dataTooLarge
Description

Stores the given string of data in a file in the Symbiote's directory. The text given can be formatted as needed; plain text, JSON, XML, etc. Text size is limited to 5MB. All localStorage.global calls access the same file in storage, no matter which campaign is currently active. If campaign specific storage is needed (eg: to have data that is only available in one campaign) see localStorage.campaign Similar to localStorage.global.getBlob running several instances of TaleSpire at the same time on the same machine (with the same Symbiote loaded in both of them) can lead to race conditions when storing/reading data from local storage, meaning there is no guarantee for order or atomicity of operations which can lead to inconsistent data being read or unknowingly overwriting changes from the other instance. Even global data is still scoped with the Symbiote, meaning a Symbiote can only ever read or write its own data and has no access to the data of other Symbiotes.




getBlob
Parameters

none

Returns

string

Failure States


readFailed
Description

Retrieves the locally stored global data for this Symbiote. Returns the same string of data as has been set with localStorage.global.setBlob. If several instances of TaleSpire are running on the same machine race conditions between them can happen. See localStorage.global.setBlob for more info on that.




deleteBlob
Parameters

none

Returns

none

Failure States


deleteFailed
Description

Deletes the locally stored global data for this Symbiote. Does not affect campaign scoped data, to delete that, see localStorage.campaign.deleteBlob




campaign
setBlob
Parameters

Description
Name	Type
str	string
Returns

none

Failure States


ensurePathFailed
writeFailed
notInCampaign
dataTooLarge
Description

Stores the given string of data in a file in the Symbiote's directory. The text given can be formatted as needed; plain text, JSON, XML, etc. Text size is limited to 5MB. All localStorage.campaign calls are scoped by the campaign that is currently active, meaning there is a separate set of files per campaign. If global storage is needed (eg: to have some data available in all campaigns) see localStorage.global Similar to localStorage.campaign.getBlob running several instances of TaleSpire at the same time on the same machine (with the same Symbiote loaded in both of them) can lead to race conditions when storing/reading data from local storage, meaning there is no guarantee for order or atomicity of operations which can lead to inconsistent data being read or unknowingly overwriting changes from the other instance. Campaign data is additionally scoped with the Symbiote, meaning a Symbiote can only ever read or write its own data and has no access to the data of other Symbiotes even if they are both open in the same campaign.




getBlob
Parameters

none

Returns

string

Failure States


readFailed
notInCampaign
Description

Retrieves the locally stored data attached to the currently active campaign for this Symbiote. Returns the same string of data as has been set with localStorage.campaign.setBlob. If several instances of TaleSpire are running on the same machine race conditions between them can happen. See localStorage.campaign.setBlob for more info on that.




deleteBlob
Parameters

none

Returns

none

Failure States


deleteFailed
notInCampaign
Description

Deletes the locally stored data attached to the currently active campaign for this Symbiote. Does not affect global Symbiote data, to delete that, see localStorage.global.deleteBlob




parties
getParties
Parameters

none

Returns

Array[partyFragment]

Description

Returns the IDs for all existing parties. For now only one party is supported by TaleSpire, this function will have more utility once the party system gets overhauled.




getCreaturesInParty
Parameters

Description
Name	Type
partyFragmentOrId	fragmentOrId
Returns

Array[string]

Failure States


unknownPartyId
Description

Returns all creatures (as array of creature IDs) that belong to any player (including GMs) of the specified party.




picking
startPicking
Parameters

none

Returns

string

Failure States


couldNotSwitchToTool
toolInUse
Description

Starts the Symbiote picking tool which allows the user to click on something on the board and the information (id and kind) of that something to be sent to the Symbiote that started the picking. Tool can be dismissed by the user which results in a pickingCanceled event from the onPickingEvent event source. The picking result comes with the pickingCompleted event from the same event source. If another Symbiote has already started a picking operation that has not been completed or canceled by the user yet, this call will return the toolInUse error.




players
whoAmI
Parameters

none

Returns

playerFragment

Description

Returns the player fragment of the own player (= The player that is running the Symbiote).




isMe
Parameters

Description
Name	Type
playerFragmentOrId	fragmentOrId
Returns

boolean

Description

Returns true if the specified player ID (or player fragment) is the same player as the one running the Symbiote (= whether the player is yourself). Returns false otherwise.




getPlayersInThisCampaign
Parameters

none

Returns

Array[playerFragment]

Description

Returns a list of all players who are members of this campaign. This includes players who are not currently connected, as well as banned players. To see their status, use players.getMoreInfo, which shows their permissions, connected clients, etc.




getPlayersInThisBoard
Parameters

none

Returns

Array[playerFragment]

Description

Returns a list of all players currently connected to this board. To see their status, use players.getMoreInfo, which shows their permissions, connected clients, etc.




getMoreInfo
Parameters

Description
Name	Type
playerFragmentOrIds	Array[fragmentOrId]
Returns

Array[playerInfo]

Description

Returns more info on the specified player. The clientsIds list in the response shows info on the clients with which the respective player is connected, but only for the same board as the own client running the Symbiote is in.




rulers
getRulers
Parameters

none

Returns

Array[rulerFragment]

Description

Returns all rulers currently active on the board or an empty array if there is none. This does not include AoE markers. For querying just your own rulers, see rulers.getLocalRuler.




startRuler
Parameters

Description
Name	Type
kind	rulerKind
Returns

string

Failure States


invalidRulerKind
couldNotSwitchToTool
toolInUse
Description

Selects a ruler to start measuring. Can pick any of the available ruler types by selecting its kind: “sphere”, “line”, “cone”. Will trigger a rulerAdded event from the onRulerEvent event source.




getLocalRuler
Parameters

none

Returns

rulerFragment

Failure States


rulerNotFound
Description

Returns the ruler set by the own client or rulerNotFound if there is no active one. This does not include AoE markers. For querying all rulers, including ones from other clients, see rulers.getRulers.




getMoreInfo
Parameters

Description
Name	Type
rulerFragmentsOrIds	Array[fragmentOrId]
Returns

Array[lineRulerInfo or sphereRulerInfo or coneRulerInfo]

Description

Returns more info on the specified ruler.




slabs
unpack
Parameters

Description
Name	Type
slabStr	string
Returns

object

Description

Takes the copied slab string and unpacks it to a binary representation using JavaScript Array Buffers. Extracting their data can be done manually one byte at a time, but using Data Views can simplify a lot of the process.

See here for documentation on the slab data format.




pack
Parameters

Description
Name	Type
slabBinary	object
allowOversized	boolean
Returns

string

Description

Takes a JavaScript Array Buffer and packs it: First it gets compressed with gzip and then base64 encoded to get the final slab string. allowOversized does not need to be specified and defaults to false, which will cause the function to return an error if the slab data is larger than the maxSlabSize (which can be queried by slabs.getMaxSlabSizeInBytes). This can be deactivated by setting this argument to true, which results in the slab string to be created regardless. TaleSpire will still not accept slabs larger than the limit, but this can be used for example for intermediate representations for other external slab tools to use.

See here for documentation on the slab data format.




getDataSize
Parameters

Description
Name	Type
slabStr	string
Returns

int

Description

Returns the data size of the slab string after base64 decoding. This is the size that is checked against the slab size limit. To get the size limit, see slabs.getMaxSlabSizeInBytes.




sendSlabToHand
Parameters

Description
Name	Type
slabStr	string
Returns

none

Failure States


notInBoard
clientIsNotInGmMode
invalidSlabString
dataOversized
spawnFailed
Description

Sends the provided slab string to the hand ready to be placed by the user.




getSlabInActiveSelection
Parameters

none

Returns

string

Failure States


areaNotReady
dataOversized
nothingInsideSelection
noActiveSelection
Description

Returns a slab created from the currently active volume selection box.




getMaxSlabSizeInBytes
Parameters

none

Returns

int

Description

This returns the size in bytes that a slab can be at maximum. This size is before base64 encoding it, but after compressing it with gzip. The limit is fixed and won't change during runtime, but using this function allows Symbiotes to adapt to potentially changing limits through updates.




symbiote
getIfThisSymbioteIsVisible
Parameters

none

Returns

boolean

Description

Returns whether the Symbiote is currently visible or not. This includes the Symbiotes panel being collapsed and a Symbiote being put in the background (if it has this capability set in the manifest) when another Symbiote is loaded.




sendNotification
Parameters

Name	Type	Description
title	string	truncated if length > 150
body	string	truncated if length > 400
optionalData	string	max length is 200
Returns

none

Failure States


symbioteManifestMissingInteropId
Description

Sends a notification to the own client's chat/history pane. The notification is clickable to focus/open the Symbiote that has sent it. If the Symbiote has been shut down since sending - either because it's not set to run in background or because it was manually closed by the user - it will be opened and restarted.

The notification has a title and body and can be formatted similar to chat messages with rich text using Unity's TextMeshPro. You can optionally define extra data that is not rendered, but sent to the Symbiote via the notificationActivated event from the onNotificationEvent event source upon clicking the notification, allowing to pass some meta data about the clicked notification to the Symbiote for example to be able to tell apart clicks on different notifications.

The Symbiote needs to have an interop ID defined in its manifest for this to be accessible.




sync
send
Parameters

Name	Type	Description
message	string	max length is 500
target	fragmentOrId	 
Returns

none

Failure States


invalidTarget
messageTooLarge
notConnected
symbioteManifestMissingInteropId
Description

Sends the text specified in message to the given target via the realtime backend. Target can be either a single client fragment or client ID (not player ID) or one of the following keywords: “board”, “gms” which sends to all players on the board, or all GMs respectively. All GMs specifically sends to all clients that have GM permissions, regardless of whether they currently are or aren't in GM mode. To be able to use this function the Symbiote needs to have an interop ID set in the manifest. The message size is limited to 1kB of data (= 500 characters from a JS string due to UTF-16 encoding). Received sync messages trigger the syncMessageReceived event from the onSyncMessage event source.




multiSend
Parameters

Name	Type	Description
message	string	max length is 500
clientFragmentsOrIds	Array[fragmentOrId]	max length is 20
Returns

none

Failure States


messageTooLarge
notConnected
symbioteManifestMissingInteropId
Description

Sends messages via the realtime backend to several clients at once. Can either be provided with an array of client fragments or array of client IDs. Useful if you want to target several clients with the same message, if you want to send the same message to all players you can instead use sync.send with the target “board”. The target keywords available with sync.send don't work here. The message size is limited to 1kB of data (= 500 characters from a JS string due to UTF-16 encoding). Received sync messages trigger the syncMessageReceived event from the onSyncMessage event source.




getClientsConnected
Parameters

none

Returns

Array[clientFragment]

Failure States


notConnected
symbioteManifestMissingInteropId
Description

Returns a list of all clients that has the Symbiote with the same interop ID as the one that called the function loaded. Does not include clients that have the Symbiote installed but not open.




system
clipboard
setText
Parameters

Description
Name	Type
text	string
Returns

none

Description

Puts the specified text into the system clipboard for the user to paste.




units
getDistanceUnitsForThisCampaign
Parameters

none

Returns

distanceUnit

Description

Returns the distance units for rulers that have been set for the campaign.




urls
submit
Parameters

Description
Name	Type
urlStr	string
Returns

none

Failure States


urlInvalid
urlRejected
Description

Passes a talespire:// URL to TaleSpire. Behaves mostly identical to simply clicking a link in the browser (or opening it with window.open), but instead of going through the TaleSpireUrlRelay program it goes directly to TaleSpire.

This has the advantage of being a direct connection, so is more efficient with less potential for delays. It also reliably targets the correct client if several are open at once which going through the UrlRelay does not. Additionally it is not limited to opening one link per user interaction in web view Symbiotes, because of Chrome's link opening/pop-up prevention policies.




createUrlPrefixForThisSymbiote
Parameters

none

Returns

string

Failure States


symbioteManifestMissingInteropId
Description

Symbiotes can receive information from outside by using talespire://symbiote/ URLs. This function returns the start of the URL: talespire://symbiote/<system_segment>/, where the system_segment is data used by TaleSpire to properly deliver the messages to the right Symbiote. The transmitted information is the “user segment” which is to be appended to the returned URL string like so: talespire://symbiote/<system_segment>/<user_segment>

The interop ID has to be set in the manifest for this to work. The URL prefix is stable (=unchanging) for as long as the interop ID remains the same.




Subscriptions
The subscription system is organized into kinds and event sources. Events are part of event sources and will be delivered to the handler function defined by the event source subscription in the manifest.

urls
onUrlMessage
Events


urlMessageReceived
Description

The urlMessageReceived event gets triggered whenever your Symbiote receives a talespire://symbiotes/ URL via the TaleSpire URL Relay. Payload contains the data attached to the URL after the prefix. For example if a user clicks the url talespire://symbiote/1234567890/test the Symbiote that is prefixed by 1234567890 receives the message “test”. If the Symbiote is not running when this message is received it will be loaded and then receives the message. If the Symbiote has the capability to run in background set in the manifest it will stay loaded, if not, it will be shutdown after delivery of the message.




rulers
onRulerEvent
Events


rulerAdded

rulerRemoved

rulerResult
Description

The rulerAdded event is triggered when a new ruler measurement is started by a client on the same board. This only includes an ID for the ruler for later reference.

rulerResult triggers whenever measuring with a ruler is finished and the final positions are set on the board. This includes information on all the positions of the ruler allowing for example total length of a line ruler to be calculated - or more interesting things like only vertical height difference.

rulerRemoved triggers whenever a ruler is either removed from the board after finishing the measurement or if it is dismissed while measuring.




chat
onChatMessage
Events


chatMessageReceived
Description

The chatMessage event triggers whenever a chat message is received by your client. Includes messages sent by the own client and messages sent through the Symbiotes API, including your own Symbiote.

The information contains the message itself, who sent it from where and under what name it was sent




creatures
onCreatureStateChange
Events


creatureAdded

creatureRemoved

creatureIsUniqueChanged

creatureNameChanged

creatureLinkChanged

creatureLocationChanged

creatureMorphsChanged

creatureActiveMorphChanged

creatureHpChanged

creatureStatsChanged

creatureTorchStateChanged

creatureExplicitlyHiddenStateChanged

creatureFlyingStateChanged

creatureActivePersistentEmotesChanged

creatureOwnersChanged
Description

The onCreatureStateChange event source provides access to a whole host of creature related events. Your handling function can listen to any number of them to only see what it cares about. Creature events are board-wide and unfiltered, so if you for example want to create a Symbiote that keeps track of all creatures in the initiative queue, it needs to check whether the event is about a creature that is actually in the queue.

Unique creatures can trigger events even when they are not on the same board as they are stored campaign-wide.

The names of the events should be self-explanatory for when they trigger.




onCreatureSelectionChange
Events


creatureSelection
Description

The onCreatureSelectionChange event source provides access to the creatureSelection event. It returns a list of creature fragments identifying the creatures currently in the selection. The event is triggeed live as selection changes occur, including with lasso group select tool.




campaigns
current
onInfoChanged
Events


campaignInfoChanged
Description

The campaignInfoChanged event triggers when the campaign name, description or default board have been edited.




onBoardEvent
Events


boardAdded

boardInfoChanged

boardRemoved
Description

The boardAdded and boardRemoved events trigger whenever a board gets added to or removed from the current campaign respectively.

boardInfoChanged triggers when the name or description of a board is edited.




onSettingsChanged
Events


distanceUnitsChanged

statNamesChanged
Description

The distanceUnitsChanged event is triggered whenever the ruler distance units get modified in the campaign settings. The statNamesChanged event is triggered whenever the aliases/names for any of the generic stats in the campaign get changed either by hand or by importing them from a talespire://stat-names/ link.




sync
onSyncMessage
Events


syncMessageReceived
Description

The syncMessageReceived event gets triggered whenever a sync message gets received from the realtime backend. Only messages from the same Symbiote (= Symbiote with the same interop ID) can be received.




onClientEvent
Events


clientConnected

clientDisconnected
Description

The clientConnected event gets triggered whenever a client opens a Symbiote with the same interop ID as yours or joins the same board with it already open. This event also triggers for your own client opening the Symbiote. The clientDisconnected event gets triggered whenever a client that has a Symbiote with the same interop ID open leaves the board that your clients' Symbiote is open in or closes that Symbiote.




dice
onRollResults
Events


rollResults

rollRemoved
Description

The rollResults event is triggered whenever any user on the board rolls any dice and a result is received from that. The result contains the rollId (and clientId of the client rolling) which can be checked against the rollId that is returned from dice.putDiceInTray if you want to filter out rolls the Symbiote created by itself (or the own/a specific other client).

The rollRemoved event is triggered either when a roll that has previously been put in the tray by your Symbiote is dismissed instead of being rolled or when any dice on the board are deleted. This allows Symbiotes to stop keeping track of certain rollIds when their accompanying dice were either never rolled or have since been deleted.




slabs
onSlabCopied
Events


slabCopied
Description

The slabCopied event triggers whenever the own user client (the one that is running the Symbiote) is copying a slab and contains the slab data as well as a notice if the copied slab contained too much data to be converted to a slab string.




contentPacks
onContentPackChange
Events


contentPackAdded

contentPackRemoved
Description

The contentPackAdded and contentPackRemoved events trigger whenever a content pack gets added to or removed from the current campaign respectively. As of right now all content packs are loaded on startup, this is in preparation of asset modding which will allow modded content packs to be loaded and unloaded during runtime.




clients
onClientEvent
Events


clientJoinedBoard

clientLeftBoard

clientModeChanged
Description

The clientJoinedBoard and clientLeftBoard events trigger for a game client connecting to and disconnecting from the same board as the Symbiote is in. A game client does not equal to a player as one player can be connected to the same campaign/board (or different ones) with several clients at once. See players.onBoardPlayerEvent if you care about only the player events and not about their individual clients. The join and leave events also trigger for the own client when switching boards, allowing to detect board switches.

clientModeChanged triggers when the client mode is switched from player to GM or vice versa. This specifically refers to the current view mode it is in, not the canGM permission. For that, see players.getMoreInfo.




symbiote
onVisibilityEvent
Events


hasBecomeVisible

hasBecomeHidden
Description

The hasBecomeVisible event is triggered when the Symbiote comes back into the foreground. This happens when it is initially loaded, returns from the background due to another Symbiote being open in “front” of it (only possible if this Symbiote has the runInBackground capability) or if the Symbiote side panel was collapsed and has been reopened.

hasBecomeHidden triggers more or less opposite of that: If a Symbiote is being shut down, another one is opened in front of it or if the side panel gets collapsed.




onStateChangeEvent
Events


hasInitialized

willEnterBackground

hasEnteredForeground

willShutdown
Description

The hasInitialized event is triggered once the Symbiote API has been successfully injected and the connection to TaleSpire has been started. If something went wrong, this will still trigger after the initTimeout specified in the manifest.

willEnterBackground and hasEnteredForeground only trigger for Symbiotes that have the runInBackground capability set. willEnterBackground is triggered whenever another Symbiote is started and this one is now not visible anymore, while hasEnteredForeground is triggered whenever the Symbiote regains focus.

willShutdown is triggered when TaleSpire is about to shut down the Symbiote either due to it going in the background without having the runInBackground capability or by being closed manually by the user. Additionally, we reserve the right to shut down any Symbiote at any point for performance or stability reasons. This event is a “best effort” event and not guaranteed to be triggered in time before shutdown, so there shouldn't be any crucial tasks that only get executed on shutdown.




onNotificationEvent
Events


notificationActivated
Description

The notificationActivated event is triggered when the user clicks on a notification that was sent by a Symbiote. The payload of the event consists of the optionalData argument specified when sending the notification. Only the Symbiote that sent the notification that was clicked on receives this event. If the user clicks on the notification while the Symbiote is closed, the Symbiote will be launched and the event will be delivered once initialization has completed.




players
onCampaignPlayerEvent
Events


playerJoinedCampaign

playerLeftCampaign

playerRightsChanged
Description

The playerJoinedCampaign and playerLeftCampaign events are triggered when a player joins or leaves the campaign. This does not need to coincide with the player actually being online or offline, but instead is referring to the list of players in the campaign. As of right now playerJoinedCampaign can only trigger as consequence of a player actually connecting to a campaign, but internally they are handled separately.

playerRightsChanged is triggered when the permissions are updated, meaning when a user is for example promoted from player to GM, or when they get banned.




onBoardPlayerEvent
Events


playerJoinedBoard

playerLeftBoard
Description

The playerJoinedBoard and playerLeftBoard events get triggered whenever a player joins or leaves the board that the Symbiote is open in. Because players can have several clients connected at once, the join event is triggered when the first client of a player joins and the leave event when the last client of a player leaves. The join and leave events also trigger for yourself when switching boards - however, if several clients from the same player are connected this will not trigger, so using the join and leave events from the clients.onClientEvent event source should be used to detect board switches instead.




initiative
onInitiativeEvent
Events


initiativeUpdated
Description

The initiativeUpdated event is triggered when in initiative mode and the turn is moved forwards/backwards or if the turn queue is edited by adding or removing entries.




picking
onPickingEvent
Events


pickingCompleted

pickingCanceled
Description

The pickingCompleted event is triggered when a Symbiote picking (initiated by picking.startPicking) has been finished by the user. It includes information on what has been picked, as well as the picking ID previously returned by the picking.startPicking command.

The pickingCanceled event is triggered when the user cancels the picking operation by dismissing the tool (right click or pressing Escape).




talespire
Types
Types can be:


JavaScript objects containing primitive types or other custom types documented here
“Enums”. Since JavaScript does not have a concept of enums like other languages do, they are handled as string types with a set of accepted values.
creatureSelection

{
    creatures: Array[creatureFragment]
}
Used By


subscription: onCreatureSelectionChange
creatureFragment

{
    id: string
}
Used By


call: creatures.getCreaturesOwnedByPlayer

call: creatures.getSelectedCreatures

call: creatures.getUniqueCreaturesInThisCampaign

type: creatureAdded

type: creatureSelection
boardAdded

{
    board: boardFragment
}
Used By


subscription: onBoardEvent
boardFragment

{
    id: string,
    name: string
}
Used By


call: boards.getBoardsInThisCampaign

call: boards.whereAmI

type: boardAdded
boardRemoved

{
    boardId: string
}
Used By


subscription: onBoardEvent
boardInfoChanged

{
    info: boardInfo
}
Used By


subscription: onBoardEvent
boardInfo

{
    id: string,
    campaignId: string,
    name: string,
    description: string
}
Used By


call: boards.getMoreInfo

type: boardInfoChanged
playerJoinedCampaign

{
    player: playerFragment
}
Used By


subscription: onCampaignPlayerEvent
playerFragment

{
    id: string,
    name: string
}
Used By


call: players.getPlayersInThisBoard

call: players.getPlayersInThisCampaign

call: players.whoAmI

type: clientFragment

type: clientInfo

type: playerJoinedBoard

type: playerJoinedCampaign

type: playerLeftBoard

type: playerRightsChanged
playerLeftCampaign

{
    playerId: string
}
Used By


subscription: onCampaignPlayerEvent
playerRightsChanged

{
    player: playerFragment,
    rights: playerRights
}
Used By


subscription: onCampaignPlayerEvent
playerRights

{
    isOwner: boolean,
    canPlay: boolean,
    canGm: boolean
}
Used By


type: playerInfo

type: playerRightsChanged
playerJoinedBoard

{
    player: playerFragment
}
Used By


subscription: onBoardPlayerEvent
playerLeftBoard

{
    player: playerFragment
}
Used By


subscription: onBoardPlayerEvent
campaignFragment

{
    id: string,
    name: string
}
Used By


call: campaigns.whereAmI
campaignInfo

{
    id: string,
    name: string,
    description: string,
    defaultBoardId: string
}
Used By


call: campaigns.getMoreInfoAboutCurrentCampaign

type: campaignInfoChanged
campaignInfoChanged

{
    info: campaignInfo
}
Used By


subscription: onInfoChanged
clientFragment

{
    id: string,
    player: playerFragment
}
Used By


call: clients.getClientsInThisBoard

call: clients.whoAmI

call: sync.getClientsConnected

type: clientConnected

type: clientJoinedBoard

type: clientLeftBoard

type: clientModeChanged

type: rulerFragment

type: syncMessageReceived
clientInfo

{
    id: string,
    clientMode: clientMode,
    player: playerFragment
}
Used By


call: clients.getMoreInfo
clientMode
One of the following string values:


“spectator”
“player”
“gm”
Used By


type: clientInfo

type: clientModeChanged
playerInfo

{
    id: string,
    name: string,
    clientsIds: Array[string],
    rights: playerRights
}
Used By


call: players.getMoreInfo
syncMessageReceived

{
    str: string,
    fromClient: clientFragment
}
Used By


subscription: onSyncMessage
urlMessageReceived

{
    str: string
}
Used By


subscription: onUrlMessage
rollDescriptor

{
    name: string,
    roll: string
}
Used By


call: dice.makeRollDescriptors

call: dice.putDiceInTray
rollResults

{
    rollId: string,
    clientId: string,
    resultsGroups: Array[rollResultsGroup],
    gmOnly: boolean,
    quiet: boolean
}
Used By


subscription: onRollResults
rollResultsGroup

{
    name: string,
    result: rollResultsOperation or rollResult or rollValue
}
Used By


call: dice.evaluateDiceResultsGroup

call: dice.sendDiceResult

type: rollResults
rollResultsOperation

{
    operator: string,
    operands: Array[rollResultsOperation or rollResult or rollValue]
}
A rollResultsOperation contains the reference to an operator and all its accompanying operands in an array. Available operators are: "+", "-" both of which take two operands. If you want to add more operands than that you can nest rollResultsOperation as often as necessary.

Used By


type: rollResultsGroup
rollResult

{
    kind: string,
    results: Array[int]
}
kind describes which kind of dice was rolled. Can be the name of any of the dice available to TaleSpire, the built-in dice are: “d4", “d6", “d8", “d10", “d12", “d20", “d100".

Used By


type: rollResultsGroup
rollValue

{
    value: int
}
Used By


type: rollResultsGroup
rollRemoved

{
    rollId: string
}
Used By


subscription: onRollResults
slabCopied

{
    slab: string,
    status: slabCopiedStatus,
    dataSize: int
}
Used By


subscription: onSlabCopied
slabCopiedStatus
One of the following string values:


“success”
“oversized”
Used By


type: slabCopied
contentPackAdded

{
    contentPackId: string,
    optionalName: string
}
Used By


subscription: onContentPackChange
contentPackRemoved

{
    contentPackId: string
}
Used By


subscription: onContentPackChange
contentPackFragment

{
    id: string,
    optionalName: string
}
Used By


call: contentPacks.getContentPacks
contentPackInfo

{
    id: string,
    optionalName: string,
    tiles: Array[contentPackPlaceableElement],
    props: Array[contentPackPlaceableElement],
    creatures: Array[contentPackCreatureElement],
    music: Array[contentPackMusicElement],
    iconsAtlases: Array[contentPackIconsAtlasElement]
}
Used By


call: contentPacks.findBoardObjectInPacks

call: contentPacks.getMoreInfo

type: boardObjectFindResult
contentPackPlaceableElement

{
    id: string,
    name: string,
    isDeprecated: boolean,
    groupTag: string,
    tags: Array[string],
    assets: Array[contentPackLoaderData],
    isInteractable: boolean,
    colliderBoundsBound: bounds,
    icon: contentPackIconElement
}
Used By


type: boardObjectFindResult

type: contentPackInfo
contentPackCreatureElement

{
    id: string,
    name: string,
    isDeprecated: boolean,
    groupTag: string,
    tags: Array[string],
    miniAsset: contentPackLoaderData,
    baseAsset: contentPackLoaderData,
    defaultScale: number,
    icon: contentPackIconElement
}
Used By


type: boardObjectFindResult

type: contentPackInfo
contentPackMusicElement

{
    asset: contentPackLoaderData
}
Used By


type: contentPackInfo
contentPackIconsAtlasElement

{
    path: string,
    resolution: atlasResolution
}
Used By


type: contentPackInfo
contentPackLoaderData

{
    bundleId: string,
    assetName: string
}
Used By


type: contentPackCreatureElement

type: contentPackMusicElement

type: contentPackPlaceableElement
bounds

{
    center: position,
    width: float,
    height: float,
    depth: float
}
Used By


type: contentPackPlaceableElement
contentPackIconElement

{
    atlasIndex: int,
    region: rect
}
Used By


type: contentPackCreatureElement

type: contentPackPlaceableElement
atlasResolution

{
    width: int,
    height: int
}
Used By


type: contentPackIconsAtlasElement
rect

{
    x: float,
    y: float,
    width: float,
    height: float
}
Used By


type: contentPackIconElement
position

{
    locId: number,
    x: float,
    y: float,
    z: float
}
locId contains the sub-board ID for the thing the position is from. Positions that are on different sub-boards cannot be compared directly, as their coordinate origin may differ.

Used By


type: bookmark

type: bounds

type: coneRulerInfo

type: creatureInfo

type: creatureLocationChanged

type: lineRulerInfo

type: sphereRulerInfo
creatureInfo

{
    id: string,
    isUnique: boolean,
    name: string,
    nameSet: boolean,
    link: string,
    position: position,
    rotation: eulerRotation,
    boardId: string,
    morphs: Array[morph],
    activeMorphIndex: int,
    hp: creatureStat,
    stats: Array[creatureStat],
    torchIsOn: boolean,
    isExplicitlyHidden: boolean,
    isFlying: boolean,
    idsOfActivePersistentEmotes: Array[string],
    ownerIds: Array[string]
}
id describes the unique identifier for each mini instance on a board. It is unique, even if the same creature model is placed down. To get the asset/model ID for querying data like the thumbnail, check morphs at index activeMorphIndex

Used By


call: creatures.createBlueprint

call: creatures.getMoreInfo
eulerRotation

{
    x: float,
    y: float,
    z: float
}
Used By


type: creatureInfo

type: creatureLocationChanged
morph

{
    boardAssetId: string,
    scale: float
}
Used By


type: creatureInfo

type: creatureMorphsChanged
creatureStat

{
    name: string,
    value: float,
    max: float
}
Used By


type: creatureHpChanged

type: creatureInfo

type: creatureStatsChanged
creatureIsUniqueChanged

{
    id: string,
    isUnique: boolean
}
Used By


subscription: onCreatureStateChange
creatureNameChanged

{
    id: string,
    name: string,
    nameSet: boolean
}
Used By


subscription: onCreatureStateChange
creatureLinkChanged

{
    id: string,
    link: string
}
Used By


subscription: onCreatureStateChange
creatureLocationChanged

{
    id: string,
    boardId: string,
    position: position,
    rotation: eulerRotation
}
Used By


subscription: onCreatureStateChange
creatureMorphsChanged

{
    id: string,
    morphs: Array[morph]
}
Used By


subscription: onCreatureStateChange
creatureActiveMorphChanged

{
    id: string,
    activeMorphIndex: int
}
Used By


subscription: onCreatureStateChange
creatureHpChanged

{
    id: string,
    hp: creatureStat
}
Used By


subscription: onCreatureStateChange
creatureStatsChanged

{
    id: string,
    stats: Array[creatureStat]
}
Used By


subscription: onCreatureStateChange
creatureTorchStateChanged

{
    id: string,
    torchIsOn: boolean
}
Used By


subscription: onCreatureStateChange
creatureExplicitlyHiddenStateChanged

{
    id: string,
    isExplicitlyHidden: boolean
}
Used By


subscription: onCreatureStateChange
creatureFlyingStateChanged

{
    id: string,
    isFlying: boolean
}
Used By


subscription: onCreatureStateChange
creatureActivePersistentEmotesChanged

{
    id: string,
    idsOfActivePersistentEmotes: Array[string]
}
Used By


subscription: onCreatureStateChange
creatureOwnersChanged

{
    id: string,
    ownerIds: Array[string]
}
Used By


subscription: onCreatureStateChange
creatureAdded

{
    creature: creatureFragment
}
Used By


subscription: onCreatureStateChange
creatureRemoved

{
    id: string
}
Used By


subscription: onCreatureStateChange
initiativeUpdated

{
    queue: initiativeQueue
}
Used By


subscription: onInitiativeEvent
initiativeQueue

{
    items: Array[initiativeTurnItem],
    activeItemIndex: int
}
Used By


call: initiative.getQueue

type: initiativeUpdated
initiativeTurnItem

{
    id: string,
    name: string,
    kind: initiativeTurnItemKind
}
Used By


type: initiativeQueue
initiativeTurnItemKind
One of the following string values:


“creature”
Used By


type: initiativeTurnItem
partyFragment

{
    id: string
}
Used By


call: parties.getParties
clientJoinedBoard

{
    client: clientFragment
}
Used By


subscription: onClientEvent
clientLeftBoard

{
    client: clientFragment
}
Used By


subscription: onClientEvent
clientModeChanged

{
    client: clientFragment,
    clientMode: clientMode
}
Used By


subscription: onClientEvent
bookmark

{
    id: string,
    name: string,
    position: position,
    boardId: string
}
Used By


call: bookmarks.getBookmarksInThisBoard

call: bookmarks.getBookmarksInThisCampaign
distanceUnit

{
    name: string,
    numberPerTile: float
}
Used By


call: units.getDistanceUnitsForThisCampaign

type: distanceUnitsChanged
lineRulerInfo

{
    id: string,
    beingEdited: boolean,
    positions: Array[position]
}
Used By


call: rulers.getMoreInfo

type: rulerResult
sphereRulerInfo

{
    id: string,
    beingEdited: boolean,
    startPosition: position,
    endPosition: position
}
Used By


call: rulers.getMoreInfo

type: rulerResult
coneRulerInfo

{
    id: string,
    beingEdited: boolean,
    startPosition: position,
    endPosition: position,
    angle: float
}
Used By


call: rulers.getMoreInfo

type: rulerResult
distanceUnitsChanged

{
    units: distanceUnit
}
Used By


subscription: onSettingsChanged
statNamesChanged

{
    statNames: Array[string]
}
Used By


subscription: onSettingsChanged
pickingCanceled

{
    id: string
}
Used By


subscription: onPickingEvent
pickingCompleted

{
    id: string,
    kindOfPicked: pickedThingKind,
    idOfPicked: string
}
Used By


subscription: onPickingEvent
pickedThingKind
One of the following string values:


“unknown”
“tile”
“prop”
“creature”
Used By


type: pickingCompleted
rulerKind
One of the following string values:


“sphere”
“cone”
“line”
Used By


call: rulers.startRuler
rulerFragment

{
    id: string,
    client: clientFragment
}
Used By


call: rulers.getLocalRuler

call: rulers.getRulers
rulerAdded

{
    rulerId: string
}
Used By


subscription: onRulerEvent
rulerRemoved

{
    rulerId: string
}
Used By


subscription: onRulerEvent
rulerResult

{
    ruler: lineRulerInfo or sphereRulerInfo or coneRulerInfo
}
Used By


subscription: onRulerEvent
hasBecomeVisible
Type has no fields

Used By


subscription: onVisibilityEvent
hasBecomeHidden
Type has no fields

Used By


subscription: onVisibilityEvent
willEnterBackground
Type has no fields

Used By


subscription: onStateChangeEvent
hasEnteredForeground
Type has no fields

Used By


subscription: onStateChangeEvent
hasInitialized
Type has no fields

Used By


subscription: onStateChangeEvent
willShutdown
Type has no fields

Used By


subscription: onStateChangeEvent
boardObjectFindResult

{
    contentPackInfo: contentPackInfo,
    kind: boardObjectKind,
    boardObject: contentPackPlaceableElement or contentPackCreatureElement
}
Used By


call: contentPacks.findBoardObjectInPacks
boardObjectKind
One of the following string values:


“tile”
“prop”
“creature”
Used By


type: boardObjectFindResult
chatMessageReceived

{
    senderPlayerId: string,
    sentAs: chatSendAsKind,
    sentAsId: string,
    sentAsName: string,
    sentFromBoardId: string,
    body: string
}
Used By


subscription: onChatMessage
chatSendAsKind
One of the following string values:


“creature”
“player”
“unknown”
Used By


type: chatMessageReceived
notificationActivated

{
    data: string
}
Used By


subscription: onNotificationEvent
clientConnected

{
    client: clientFragment
}
Used By


subscription: onClientEvent
clientDisconnected

{
    clientId: string
}
Used By


subscription: onClientEvent
