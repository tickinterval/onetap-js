UI.AddSubTab(["Rage", "SUBTAB_MGR"], "Custom")
var path = ["Rage", "Custom", "Custom"];
var kpath = ["Config", "Scripts", "Keys", "JS Keybinds"];
UI.AddCheckbox(path, "Enabled")

UI.AddDropdown(path, "Yaw base", ["Local view", "At targets"], 0);
UI.AddSliderInt(path, "Yaw", -180, 180);
UI.AddDropdown(path, "Yaw jitter", ["Off", "Offset", "Center", "Random"], 0);
UI.AddSliderInt(path, "Yaw jitter value", -180, 180);
UI.AddDropdown(path, "Body yaw", ["Opposite", "Static", "Jitter"], 0);
UI.AddSliderInt(path, "Body yaw value", -180, 180);
UI.AddDropdown(path, "Lower body yaw target", ["Sway", "Opposite", "Eye yaw"], 0);
UI.AddSliderInt(path, "Fake yaw limit", 0, 60);
UI.AddCheckbox(path, "Freestanding");
UI.AddHotkey(kpath, "Freestanding hotkey", "Freestanding hotkey");
UI.AddDropdown(path, "Freestand body yaw", ["Off", "Static", "Crooked"], 0);
UI.AddHotkey(kpath, "Freestanding body yaw hotkey", "Freestanding body yaw hotkey");
UI.AddHotkey(kpath, "Lowerize fake yaw limit", "Lowerize fake yaw limit");
UI.AddCheckbox(path, "Enable jitter when running");
UI.AddCheckbox(path, "Allow to use inverter");
UI.AddCheckbox(path, "Indicate cheat state");
UI.AddDropdown(path, "Anti-aim display mode", ["Real yaw", "Body yaw"], 0);
UI.AddHotkey(kpath, "Left", "Left");
UI.AddHotkey(kpath, "Right", "Right");
UI.AddHotkey(kpath, "Backward", "Backward");
UI.AddCheckbox(path, "Expose fake when exploiting");
var leftWasPressed = false; var rightWasPressed = false; var backWasPressed = false;
var oldTick = 0
var lastPressed = 0
var drawLeft = 0;
var drawRight = 0;
var isHideRealActive = false;
var SetRealYaw = 0;
var SetFakeYaw = 0;
var SetLBYYaw = 0;
var RealSwitch = false;
var FakeSwitch = false;
var LbySwitch = false;
var IsInverted = false;
var left_distance;
var right_distance;
var fontalpha = 0;
var inverter = {
    get: function() {return IsInverted}
}
function deg2rad( degress ) {
    return degress * Math.PI / 180.0;
}
function angle_to_vec( pitch, yaw ) {
    var p = deg2rad( pitch );
    var y = deg2rad( yaw )
    var sin_p = Math.sin( p );
    var cos_p = Math.cos( p );
    var sin_y = Math.sin( y );
    var cos_y = Math.cos( y );
    return [ cos_p * cos_y, cos_p * sin_y, -sin_p ];
}
function trace( entity_id, entity_angles ) { // pasted from kseny aimlines ;)
    var entity_vec = angle_to_vec( entity_angles[0], entity_angles[1] );
    var entity_pos = Entity.GetRenderOrigin( entity_id );
    entity_pos[2] += 50;
    var stop = [ entity_pos[ 0 ] + entity_vec[0] * 8192, entity_pos[1] + entity_vec[1] * 8192, ( entity_pos[2] )  + entity_vec[2] * 8192 ];
    var traceResult = Trace.Line( entity_id, entity_pos, stop );
    if( traceResult[1] == 1.0 )
        return;
    stop = [ entity_pos[ 0 ] + entity_vec[0] * traceResult[1] * 8192, entity_pos[1] + entity_vec[1] * traceResult[1] * 8192, entity_pos[2] + entity_vec[2] * traceResult[1] * 8192 ];
    var distance = Math.sqrt( ( entity_pos[0] - stop[0] ) * ( entity_pos[0] - stop[0] ) + ( entity_pos[1] - stop[1] ) * ( entity_pos[1] - stop[1] ) + ( entity_pos[2] - stop[2] ) * ( entity_pos[2] - stop[2] ) );
    entity_pos = Render.WorldToScreen( entity_pos );
    stop = Render.WorldToScreen( stop );
    if( stop[2] != 1 || entity_pos[2] != 1 )
        return;

    return distance;
}
function RandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}
function getVelocity()
{
    var velocity = Entity.GetProp( Entity.GetLocalPlayer(), "CBasePlayer", "m_vecVelocity[0]" );
    var speed = Math.sqrt( velocity[0] * velocity[0] + velocity[1] * velocity[1] );
    return speed;
}

function onUnload() {
    AntiAim.SetOverride(0);
}
var yawbasecache = UI.GetValue(["Rage", "Custom", "Custom", "Yaw base"]);
function onCreateMove() {
        if (UI.GetValue(["Rage", "Custom", "Custom", "Enabled"])) {
            AntiAim.SetOverride(1);
            const fired_shots = Entity.GetProp(Entity.GetLocalPlayer(), "CCSPlayer", "m_iShotsFired");
            var isLeftActive = UI.GetValue( ["Config", "Scripts", "Keys", "JS Keybinds", "Left"] );
            var isRightActive = UI.GetValue( ["Config", "Scripts", "Keys", "JS Keybinds", "Right"] );
            var isBackwardsActive = UI.GetValue( ["Config", "Scripts", "Keys", "JS Keybinds", "Backward"]);
            var local = Entity.GetLocalPlayer();
            //Yaw base
            switch (UI.GetValue(["Rage", "Custom", "Custom", "Yaw base"])) {
                case 0:
                    UI.SetValue(["Rage", "Anti Aim", "Directions", "At targets"], 0);
                    break;
                case 1:
                    UI.SetValue(["Rage", "Anti Aim", "Directions", "At targets"], 1);
                    break;
            }
            //Yaw
            if (UI.GetValue(["Rage", "Custom", "Custom", "Yaw jitter"]) == 0) {
                SetRealYaw = UI.GetValue(["Rage", "Custom", "Custom", "Yaw"]);
            }

            //Yaw jitter
            else {
                if (Globals.ChokedCommands() == 0) {
                    if (UI.GetValue(["Rage", "Custom", "Custom", "Yaw jitter"]) == 1) {
                        if (RealSwitch) {
                            SetRealYaw = UI.GetValue(["Rage", "Custom", "Custom", "Yaw"]);
                        } else {
                            SetRealYaw = UI.GetValue(["Rage", "Custom", "Custom", "Yaw"]) + UI.GetValue(["Rage", "Custom", "Custom", "Yaw jitter value"]);
                        }
                        RealSwitch = !RealSwitch;
                    } else if (UI.GetValue(["Rage", "Custom", "Custom", "Yaw jitter"]) == 2) {
                        if (RealSwitch) {
                            SetRealYaw = UI.GetValue(["Rage", "Custom", "Custom", "Yaw"]) - UI.GetValue(["Rage", "Custom", "Custom", "Yaw jitter value"]) / 2;
                        } else {
                            SetRealYaw = UI.GetValue(["Rage", "Custom", "Custom", "Yaw"]) + UI.GetValue(["Rage", "Custom", "Custom", "Yaw jitter value"]) / 2;
                        }
                        RealSwitch = !RealSwitch;
                    } else if (UI.GetValue(["Rage", "Custom", "Custom", "Yaw jitter"]) == 3) {
                        SetRealYaw = UI.GetValue(["Rage", "Custom", "Custom", "Yaw"]) + RandomInt(UI.GetValue(["Rage", "Custom", "Custom", "Yaw jitter value"]) / -2, UI.GetValue(["Rage", "Custom", "Custom",  "Yaw jitter value"]) / 2);
                    }
                }
            }

            //Body Yaw
            if (Globals.ChokedCommands() == 0) {
            if (UI.GetValue(["Rage", "Custom", "Custom", "Enable jitter when running"]) && getVelocity() > 110) {
              if (FakeSwitch) {
  							SetFakeYaw = UI.GetValue(["Rage", "Custom", "Custom", "Body yaw value"]);
  						} else {
  							SetFakeYaw = UI.GetValue(["Rage", "Custom", "Custom", "Body yaw value"]) + 60;
  						}
  						FakeSwitch = !FakeSwitch;
            }
            else {

                  if (UI.GetValue(["Rage", "Custom", "Custom", "Body yaw"]) == 0) {
  					SetFakeYaw = 120;
                  } else if (UI.GetValue(["Rage", "Custom", "Custom",  "Body yaw"]) == 1) {
                      SetFakeYaw = UI.GetValue(["Rage", "Custom", "Custom", "Body yaw value"]);
                  } else if (UI.GetValue(["Rage", "Custom", "Custom", "Body yaw"]) == 2) {
  					if (!UI.GetValue(["Config", "Scripts", "Keys", "JS Keybinds", "Lowerize fake yaw limit"])) {
  						if (FakeSwitch) {
  							SetFakeYaw = UI.GetValue(["Rage", "Custom", "Custom", "Body yaw value"]);
  						} else {
  							SetFakeYaw = UI.GetValue(["Rage", "Custom", "Custom", "Body yaw value"]) + 60;
  						}
  						FakeSwitch = !FakeSwitch;
  					}
  					else {
  						SetFakeYaw = 60;
  					}
                  }
              }
            }





            //LBY
            //Freestanding
            if (UI.GetValue(["Rage", "Custom", "Custom", "Freestanding"]) && UI.GetValue(["Config", "Scripts", "Keys", "JS Keybinds", "Freestanding hotkey"])) {
                UI.SetValue(["Rage", "Anti Aim", "Directions", "Auto direction"], 1);
            } else {
                UI.SetValue(["Rage", "Anti Aim", "Directions", "Auto direction"], 0);
            }
            if (UI.GetValue(["Rage", "Custom", "Custom", "Freestand body yaw"]) != 0 && UI.GetValue(["Config", "Scripts", "Keys", "JS Keybinds", "Freestanding body yaw hotkey"])) {
                var eye_angles = Local.GetViewAngles();
                left_distance = trace( local, [ 0, eye_angles[1] - 22] );
                right_distance = trace( local, [ 0, eye_angles[1] + 22] );
                if (left_distance < 600 && right_distance < 600) {
                    if (UI.GetValue(["Rage", "Custom", "Custom", "Freestand body yaw"]) == 2) {
                        if ( right_distance < left_distance ) {
                            SetFakeYaw *= -1;
                        }
                    }
                    else {
                        if ( left_distance < right_distance ) {
                            SetFakeYaw *= -1;
                        }
                    }
                }
            }
            if(isLeftActive && leftWasPressed == false) {
                isHideRealActive = false;
                lastPressed = Global.Tickcount();
                leftWasPressed = true;
                backWasPressed = false;
                rightWasPressed = false;
                drawLeft = 1;
                drawRight = 0;
                UI.SetValue( ["Rage", "Custom", "Yaw"], -90 );
                UI.SetValue( ["Rage", "Custom", "Yaw base"], 0 );
            } else if( isLeftActive && leftWasPressed == true && Global.Tickcount() > lastPressed + 16 ) {
                isHideRealActive = true;
                oldTick = Global.Tickcount();
            }

            if(isRightActive && rightWasPressed == false)
            {
                isHideRealActive = false;
                lastPressed = Global.Tickcount();
                backWasPressed = false;
                leftWasPressed = false;
                rightWasPressed = true;
                drawLeft = 0;
                drawRight = 1;
                UI.SetValue( ["Rage", "Custom", "Yaw"], 90 );
                UI.SetValue( ["Rage", "Custom", "Yaw base"], 0 );

            } else if(isRightActive && rightWasPressed == true && Global.Tickcount() > lastPressed + 16){
                isHideRealActive = true;
                oldTick = Global.Tickcount();
            }
            if(isBackwardsActive && backWasPressed == false && Global.Tickcount() > lastPressed + 16)
            {
                isHideRealActive = true;
                oldTick = Global.Tickcount();
            } else if(isBackwardsActive && backWasPressed == true && Global.Tickcount() > lastPressed + 16)  {
                isHideRealActive = true;
                oldTick = Global.Tickcount();
            }

            if (isHideRealActive) {
                if (Global.Tickcount() > oldTick + 16)  {
                    backWasPressed = false;
                    rightWasPressed = false;
                    leftWasPressed = false;
                    oldTick = Global.Tickcount();
                }

                drawLeft = 0;
                drawRight = 0;
                UI.SetValue( ["Rage", "Custom", "Yaw base"], 1 );
                UI.SetValue( ["Rage", "Custom", "Yaw"], 0 );
            }
            
            //Inverter
            if (UI.GetValue(["Rage", "Custom", "Custom", "Allow to use inverter"])) {
                if (UI.GetValue(["Rage", "Anti Aim", "General", "Key assignment", "AA Direction inverter"])) {
                    SetFakeYaw = SetFakeYaw * -1;
                }
            }

			if (fired_shots > 1) {
				SetFakeYaw = SetFakeYaw * -1;
			}


            //Main part
            SetFakeYaw = clamp(SetFakeYaw, UI.GetValue(["Rage", "Custom", "Custom", "Fake yaw limit"]) * -1, UI.GetValue(["Rage", "Custom", "Custom", "Fake yaw limit"]));
			if (UI.GetValue(["Config", "Scripts", "Keys", "JS Keybinds", "Lowerize fake yaw limit"])) {
                if (UI.GetValue(["Rage", "Custom", "Custom", "Lower body yaw target"]) == 1) {
					SetFakeYaw = (UI.GetValue(["Rage", "Custom", "Custom", "Expose fake when exploiting"]) && UI.GetValue(["Rage", "Exploits", "Keys", "Key assignment", "Double tap"])) ? -42 : 42;
            }
            if (UI.GetValue(["Rage", "Custom", "Custom", "Lower body yaw target"]) == 2) {
					SetFakeYaw = (UI.GetValue(["Rage", "Custom", "Custom", "Expose fake when exploiting"]) && UI.GetValue(["Rage", "Exploits", "Keys", "Key assignment", "Double tap"])) ? 30 : 30;
            }
        }

			if (UI.GetValue(["Rage", "Custom", "Custom", "Lower body yaw target"]) == 0) {
                if (Math.floor(Globals.Curtime()) % 5 > 2) {
					SetFakeYaw = UI.GetValue(["Rage", "Custom", "Custom", "Fake yaw limit"]);
					SetLBYYaw = UI.GetValue(["Rage", "Custom", "Custom", "Fake yaw limit"]) * 2;
				}
				else {
					SetFakeYaw = UI.GetValue(["Rage", "Custom", "Custom", "Fake yaw limit"]) * -1;
					SetLBYYaw = UI.GetValue(["Rage", "Custom", "Custom", "Fake yaw limit"]) * -2;
				}
            } else if (UI.GetValue(["Rage", "Custom", "Custom", "Lower body yaw target"]) == 1) {
                SetLBYYaw = SetFakeYaw * 2;
            } else if (UI.GetValue(["Rage", "Custom", "Custom", "Lower body yaw target"]) == 2) {
                SetLBYYaw = SetFakeYaw;
            }
            //SetLBYYaw = clamp(SetLBYYaw, UI.GetValue(["Rage", "Custom", "Custom", "Fake yaw limit") * -2, UI.GetValue(["Rage", "Custom", "Custom", "Fake yaw limit") * 2);
            AntiAim.SetFakeOffset(SetFakeYaw);
            //AntiAim.SetRealOffset(SetRealYaw);
			if (UI.GetValue(["Rage", "Custom", "Custom", "Lower body yaw target"]) == 1) {
				UI.SetValue(["Rage", "Anti Aim", "Yaw offset"], SetRealYaw - SetFakeYaw);
			}
			else {
        if (isLeftActive || isRightActive) {
          UI.SetValue(["Rage", "Anti Aim","Yaw offset"], SetRealYaw - SetFakeYaw);
        }
        else {
          UI.SetValue(["Rage", "Anti Aim", "Yaw offset"], SetRealYaw);
        }
			}
            AntiAim.SetLBYOffset(SetLBYYaw);
        } else {
            AntiAim.SetOverride(0);
        }
}
function player_connect(){
    lastPressed = Global.Tickcount();
    oldTick = Global.Tickcount();
}

Global.RegisterCallback("player_connect_full", "player_connect")

var sx = Global.GetScreenSize()[0] / 2;
var sy = Global.GetScreenSize()[1] / 2;
var dtactive = false;
var hasinverted = false;
var cachey = 0;
var cacheyj = 0;
var cacheyjv = 0;
var cacheby = 0;
var cachebyv = 0;
var cachelby = 0;
var cachefyl = 0;
function onDraw() {
        if(!World.GetServerString() || Entity.IsAlive(Entity.GetLocalPlayer()) == false) return;
        
        var font = Render.AddFont("Verdana.ttf", 10, 400);
        var fontbig = Render.AddFont("Calibrib.ttf", 26, 700);
        var offset = 0;
        var flip = false;
        if (UI.GetValue(["Rage", "Custom", "Custom", "Anti-aim display mode"]) == 1) {
            if (UI.GetValue(["Rage", "Custom", "Custom", "Freestand body yaw"]) != 0 && UI.GetValue(["Config", "Scripts", "Keys", "JS Keybinds", "Freestanding body yaw hotkey"])) {
                if (left_distance < 600 && right_distance < 600) {
                    if (fontalpha < 1)
                        fontalpha += Globals.Frametime() * 8;   
                }
                else {
                    if (fontalpha > 0)
                        fontalpha -= Globals.Frametime() * 8;
                }
            }
            
            else {
                fontalpha = 1;
            }
            if (UI.GetValue(["Rage", "Custom", "Custom", "Freestand body yaw"]) == 0) {
                    if (UI.GetValue(["Rage", "Anti Aim", "General", "Key assignment", "AA Direction inverter"]))
                        flip = true;
                    else
                        flip = false;
            }
            else {
                if (UI.GetValue(["Config", "Scripts", "Keys", "JS Keybinds", "Freestanding body yaw hotkey"])) {
                    if (left_distance < right_distance && UI.GetValue(["Rage", "Custom", "Custom", "Freestand body yaw"]) != 0)
                        flip = false;
                    else
                        flip = true;
                }
                else {
                    if (left_distance < right_distance && UI.GetValue(["Rage", "Custom", "Custom", "Freestand body yaw"]) != 0)
                        flip = true;
                    else
                        flip = false;
                }
            }
            
        }
        else {
            if (leftWasPressed || rightWasPressed) {
                if (fontalpha < 1)
                fontalpha += Globals.Frametime() * 8;
            }
                
            else {
                if (fontalpha > 0)
                fontalpha -= Globals.Frametime() * 8;
            }   

            if (leftWasPressed)
                flip = true;
        }

        if (UI.GetValue(["Rage", "Exploits", "Keys", "Key assignment", "Double tap"]) && UI.GetValue(["Rage", "Custom", "Custom", "Expose fake when exploiting"])) {
            if (!dtactive) {
                dtactive = true;
                cachey = UI.GetValue(["Rage", "Custom", "Custom", "Yaw"]);
                cacheyj = UI.GetValue(["Rage", "Custom", "Custom", "Yaw jitter"]);
                cacheyjv = UI.GetValue(["Rage", "Custom", "Custom", "Yaw jitter value"]);
                cacheby = UI.GetValue(["Rage", "Custom", "Custom", "Body yaw"]);
                cachebyv = UI.GetValue(["Rage", "Custom", "Custom", "Body yaw value"]);
                cachelby = UI.GetValue(["Rage", "Custom", "Custom", "Lower body yaw target"]);
                cachefyl = UI.GetValue(["Rage", "Custom", "Custom", "Fake yaw limit"]);
            }
            
            if (!leftWasPressed && !rightWasPressed) {
                 //left
                if (UI.GetValue(["Rage", "Anti Aim", "General", "Key assignment", "AA Direction inverter"])) {
					if (UI.GetValue(["Config", "Scripts", "Keys", "JS Keybinds", "Lowerize fake yaw limit"]))
						UI.SetValue(["Rage", "Custom", "Custom", "Yaw"], -45);
					else
						UI.SetValue(["Rage", "Custom", "Custom", "Yaw"], 30);
                }
                //right
                else {
                    UI.SetValue(["Rage", "Custom", "Custom", "Yaw"], -45);
                }
            }
            
            UI.SetValue(["Rage", "Custom", "Custom", "Yaw jitter"], 0);
            UI.SetValue(["Rage", "Custom", "Custom", "Yaw jitter value"], 0);
            if (!leftWasPressed && !rightWasPressed)
                UI.SetValue(["Rage", "Custom", "Custom", "Lower body yaw target"], 2);
            else
                UI.SetValue(["Rage", "Custom", "Custom", "Lower body yaw target"], cachelby);
            UI.SetValue(["Rage", "Custom", "Custom", "Fake yaw limit"], 60);
        }
        else if (!UI.GetValue(["Rage", "Exploits", "Keys", "Key assignment", "Double tap"]) && dtactive) {
            dtactive = false;
            UI.SetValue(["Rage", "Custom", "Custom", "Yaw"], 0);
            UI.SetValue(["Rage", "Custom", "Custom", "Yaw jitter"], cacheyj);
            UI.SetValue(["Rage", "Custom", "Custom", "Yaw jitter value"], cacheyjv);
            UI.SetValue(["Rage", "Custom", "Custom", "Lower body yaw target"], cachelby);
            UI.SetValue(["Rage", "Custom", "Custom", "Fake yaw limit"], cachefyl);
        }
        Render.String(sx-50, sy - 13, 1,  "<", flip ? [148, 174, 255, Math.max(Math.min(fontalpha, 1), 0) * 255] : [180, 180, 180, Math.max(Math.min(fontalpha, 1), 0) * 120], fontbig );
        if (UI.GetValue(["Rage", "Custom", "Custom", "Anti-aim display mode"]) == 0)
            Render.String(sx+50, sy - 13, 1,  ">", (leftWasPressed || rightWasPressed) ? (!flip ? [148, 174, 255, Math.max(Math.min(fontalpha, 1), 0) * 255] : [180, 180, 180, Math.max(Math.min(fontalpha, 1), 0) * 120]) : [180, 180, 180, Math.max(Math.min(fontalpha, 1), 0) * 120], fontbig );
        else
        Render.String(sx+50, sy - 13, 1,  ">", (!flip ? [148, 174, 255, Math.max(Math.min(fontalpha, 1), 0) * 255] : [180, 180, 180, Math.max(Math.min(fontalpha, 1), 0) * 120]), fontbig );
        if (UI.GetValue(["Rage", "Custom", "Custom", "Indicate cheat state"])) {
        Render.String(sx + 1, sy + 50 + 1 + offset, 1, UI.GetValue(["Config", "Scripts", "Keys", "JS Keybinds", "Lowerize fake yaw limit"]) ? "LOW DELTA" : (UI.GetValue(["Rage", "Custom", "Custom", "Enable jitter when running"]) && getVelocity() > 110) ? "JITTER WALK" : "SWEET YAW", [0, 0, 0, 255], font);
        Render.String(sx, sy + 50 + offset, 1, UI.GetValue(["Config", "Scripts", "Keys", "JS Keybinds", "Lowerize fake yaw limit"]) ? "LOW DELTA" : (UI.GetValue(["Rage", "Custom", "Custom", "Enable jitter when running"]) && getVelocity() > 110) ? "JITTER WALK" : "SWEET YAW", [148, 174, 255, 255], font);
        offset += 10;
        if (UI.GetValue(["Rage", "Custom", "Custom", "Freestand body yaw"]) == 0) {
            if (UI.GetValue(["Rage", "Custom", "Custom", "Anti-aim display mode"]) == 0) {
                Render.String(sx + 1, sy + 50 + 1 + offset, 1, UI.GetValue(["Rage", "Anti Aim", "General", "Key assignment", "AA Direction inverter"]) ? "LEFT" : "RIGHT", [0, 0, 0, 255], font);
                Render.String(sx, sy + 50 + offset, 1, UI.GetValue(["Rage", "Anti Aim", "General", "Key assignment", "AA Direction inverter"]) ? "LEFT" : "RIGHT", [189, 205, 255, 255], font);
                offset += 10;
            }
            else if (UI.GetValue(["Rage", "Custom", "Custom", "Anti-aim display mode"]) == 1 && (leftWasPressed || rightWasPressed)) {
                Render.String(sx + 1, sy + 50 + 1 + offset, 1, leftWasPressed ? "LEFT" : "RIGHT", [0, 0, 0, 255], font);
                Render.String(sx, sy + 50 + offset, 1, leftWasPressed ? "LEFT" : "RIGHT", [189, 205, 255, 255], font);
                offset += 10;
            }
            else {
                Render.String(sx + 1, sy + 50 + 1 + offset, 1, "FAKE YAW", [0, 0, 0, 255], font);
                Render.String(sx, sy + 50 + offset, 1, "FAKE YAW", [163, 186, 255, 255], font);
                offset += 10;
            }
        }
        else {
            Render.String(sx + 1, sy + 50 + 1 + offset, 1, "DYNAMIC", [0, 0, 0, 255], font);
            Render.String(sx, sy + 50 + offset, 1, "DYNAMIC", [163, 186, 255, 255], font);
            offset += 10;
        }
        if (UI.GetValue(["Rage", "Exploits", "Keys", "Key assignment", "Double tap"])) {
            Render.String(sx + 1, sy + 50 + 1 + offset, 1, "DT", [0, 0, 0, 255], font);
            Render.String(sx, sy + 50 + offset, 1, "DT", [170, 204, 0, 255], font);
            offset += 10;
        }

        if (UI.GetValue(["Rage", "Exploits", "Keys", "Key assignment", "Hide shots"])) {
            Render.String(sx + 1, sy + 50 + 1 + offset, 1, "ONSHOT", [0, 0, 0, 255], font);
            Render.String(sx, sy + 50 + offset, 1, "ONSHOT", [170, 204, 0, 255], font);
            offset += 10;
        }

        if (UI.GetValue(["Rage", "General", "General", "Key assignment", "Force safe point"])) {
            Render.String(sx + 1, sy + 50 + 1 + offset, 1, "SAFE", [0, 0, 0, 255], font);
            Render.String(sx, sy + 50 + offset, 1, "SAFE", [170, 204, 0, 255], font);
            offset += 10;
        }

        if (UI.GetValue(["Rage", "General", "General", "Key assignment", "Force body aim"])) {
            Render.String(sx + 1, sy + 50 + 1 + offset, 1, "BAIM", [0, 0, 0, 255], font);
            Render.String(sx, sy + 50 + offset, 1, "BAIM", [224, 99, 60, 255], font);
            offset += 10;
        }}
}

function weapon_fire() {

}

Global.RegisterCallback("CreateMove", "onCreateMove")
Global.RegisterCallback("Draw", "onDraw")
Global.RegisterCallback("Unload", "onUnload")
Global.RegisterCallback("weapon_fire", "weapon_fire")
