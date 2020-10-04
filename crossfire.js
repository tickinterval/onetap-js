var lastkill = 0;
var kills = 0;
var headshot = false;
var badges = [];
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function draw() {
	if(!World.GetServerString() || Entity.IsAlive(Entity.GetLocalPlayer()) == false) badges.length = 0;
	if(!World.GetServerString() || Entity.IsAlive(Entity.GetLocalPlayer()) == false) return;
	if (kills == 1) RenderFrame = Render.AddTexture("ot/killmarks/badge_headshot.png");
	if (kills == 2) RenderFrame = Render.AddTexture("ot/killmarks/badge_multi2.png");
	else if (kills == 3) RenderFrame = Render.AddTexture("ot/killmarks/badge_multi3.png");
	else if (kills == 4) RenderFrame = Render.AddTexture("ot/killmarks/badge_multi4.png");
	else if (kills == 5) RenderFrame = Render.AddTexture("ot/killmarks/badge_multi5.png");
	else if (kills == 6) RenderFrame = Render.AddTexture("ot/killmarks/badge_multi6.png");
	
	
	if (kills > 0 && Globals.Curtime() < (lastkill + 2) && headshot == false) {
		Render.TexturedRect(Global.GetScreenSize()[0]/2 - 79, 258, 158, 158, RenderFrame);
	}
	else if (kills == 1 && Globals.Curtime() < (lastkill + 2) && headshot == true) {
		RenderFrame = Render.AddTexture("ot/killmarks/badge_headshot_gold.png");
		Render.TexturedRect(Global.GetScreenSize()[0]/2 - 79, 258, 158, 158, RenderFrame);
	}
	
	if (Globals.Curtime() > (lastkill + 2) || kills > 1) {
		headshot = false;
	}
	if (badges.length > 0) {
		for (var i = badges.slice(-11).length, j = 0; i > 0; i-- , j++) {
			if (j > 11) {
			  j = 0;
			}
			var badge = badges.slice(-11)[i - 1];
			if (badge.type == "headshot") RenderBadge = Render.AddTexture("ot/killmarks/badge_crosshair.png");
			if (badge.type == "body") RenderBadge = Render.AddTexture("ot/killmarks/badge_elite.png");
			Render.TexturedRect(Global.GetScreenSize()[0] - 500 - 30 * i, Global.GetScreenSize()[1] - 125, 158, 158, RenderBadge);
		}
		if (badges.length > 10) {
			badges.shift();
		}
	}
}
function onkill() {
	if(!World.GetServerString() || Entity.IsAlive(Entity.GetLocalPlayer()) == false) return;
	if(Entity.GetEntityFromUserID(Event.GetInt("attacker")) == Entity.GetLocalPlayer() && Entity.GetEntityFromUserID(Event.GetInt("userid")) != Entity.GetLocalPlayer()){
		kills++;
		lastkill = Globals.Curtime();
		random = getRandomInt(1, 3);
		if (Event.GetInt("headshot") == 1 && kills == 1) {
			if (random == 1) Cheat.ExecuteCommand("play Headshot_BL.wav");
			if (random == 2) Cheat.ExecuteCommand("play Headshot_GR.wav");
			if (random == 3) Cheat.ExecuteCommand("play Headshot_SP.wav");
			headshot = true;
		}
		if (Event.GetInt("headshot") == 1) {
			badges.push({
			type: "headshot"
		});
		}
		else {
			badges.push({
			type: "body"
		});
		}
		if (kills == 2 && random == 1) Cheat.ExecuteCommand( "play MultiKill_2_BL.wav" );
		else if (kills == 2 && random == 2) Cheat.ExecuteCommand("play MultiKill_2_GR.wav");
		else if (kills == 2 && random == 3) Cheat.ExecuteCommand("play MultiKill_2_SP.wav");
		else if (kills == 3 && random == 1) Cheat.ExecuteCommand("play MultiKill_3_BL.wav");
		else if (kills == 3 && random == 2) Cheat.ExecuteCommand("play MultiKill_3_GR.wav");
		else if (kills == 3 && random == 3) Cheat.ExecuteCommand("play MultiKill_3_SP.wav");
		else if (kills == 4 && random == 1) Cheat.ExecuteCommand("play MultiKill_4_BL.wav");
		else if (kills == 4 && random == 2) Cheat.ExecuteCommand("play MultiKill_4_GR.wav");
		else if (kills == 4 && random == 3) Cheat.ExecuteCommand("play MultiKill_4_SP.wav");
		else if (kills > 4 && random == 1) Cheat.ExecuteCommand("play MultiKill_5_BL.wav");
		else if (kills > 4 && random == 2) Cheat.ExecuteCommand("play MultiKill_5_GR.wav");
		else if (kills > 4 && random == 3) Cheat.ExecuteCommand("play MultiKill_5_SP.wav");
	}
}

function round_pre() {
kills = 0;
}
Cheat.RegisterCallback("Draw", "draw");
Cheat.RegisterCallback("player_death", "onkill")
 Cheat.RegisterCallback("round_prestart","round_pre");
