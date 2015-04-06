var version = "v0.3.1"; 
var currentTab = "play";
var gD = {
    tickDuration : 100,
    time: 60,
    timeSpeed: 1,
    firePower: 5,
    brushwoodFatigue: 0,
    fanTheFlamesUses: 0,
    //watchers: 0,
    //watcherPower: 1,
    actions: {},
    tabs: {
        play: {
            text: "",
        },
        opt: {
            text: '<div class="col-md-12"><div style="margin-left:15px"><form class="form-horizontal">\
        <div class="checkbox"><label><input type="checkbox" id="darkTheme"/>Use dark theme</label></div><br />\
        <div class="checkbox"><label><input type="checkbox" id="1"/>Enable autosave (WIP)</label></div><br />\
        <div class="checkbox"><label><input type="checkbox" id="2"/>And some</label></div><br />\
        <div class="checkbox"><label><input type="checkbox" id="3"/>Other options</label></div><br />\
        </form></div><hr/></div>\
        <div class="col-md-12"><div style="margin-left:15px">Un panel quelconque à customiser parce que merde.</div><hr/></div>\
        <div class="row" style="margin-left:10px">\
        <div class="col-md-2 col-md-center">\
        <button id="myOption" type="button" class="btn btn-default" data-toggle="tooltip" data-placement="bottom" title="This is a fucking tooltip" data-container="body">Pointless button</button>\
                        </div>\
                        <div class="col-md-9 vcenter">\
                            See this button? Well, it does absolutely nothing.\
                        </div>\
                    </div>\
                    <hr id="myHR" />',
              darkTheme:false
        }
    },
}

/* unlock, cost : Object [~gD]                          Costs of unlocking and buying
 * show : Object [type, tooltip, inside][text]          Items to be displayed
 * effect : function                                    On buying
 * tick : function                                      On tick
 * repeatable : Boolean                                 Peristent
 * nocenter : Boolean                                   Multiline (action)
 */
 
var actions = {
    fanTheFlames: {
        repeatable: true,
        show: {
            type: "standardAction",
            tooltip: "Blow air on the fire to make it last a bit longer",
            inside: "Increases the fire duration by <b><span id='firePower'>" + gD.firePower + " seconds</span></b>."
        },
        effect: function() {
            var gain = gD.firePower;
            if (gD.actions.fireMastery.bought) {
                gain += 0.001 * gD.fanTheFlamesUses;
            }
            gD.time += gain;
            gD.fanTheFlamesUses ++;
        },
        tick: function() {
            var gain = gD.firePower;
            if (gD.actions.fireMastery.bought) {
                gain += 0.001 * gD.fanTheFlamesUses;
            }
            $("#firePower").html(timify(gain));
        }
    },
    fetch_Brushwood: {
        unlock: {time: 100},
        cost: {time: 60},
        repeatable: true,
        show: {
            type: "standardAction",
            nocenter: true,
            tooltip: "Take some time to fetch brushwood on the beach, increasing the duration of the fire",
            inside: "Takes <b><span id='fetchBrushwoodLoss'></span></b> to gather brushwood and makes the fire last an additional <b><span id='fetchBrushwoodGain'></span></b>."
        },
        effect: function() {
            gD.brushwoodFatigue = Math.min(300, gD.brushwoodFatigue + 30);
            gD.time += 300 - gD.brushwoodFatigue;
        },
        tick: function() {
            if (gD.brushwoodFatigue >= 0) {
                gD.brushwoodFatigue -= gD.tickDuration/1000;
            }
            actions.fetch_Brushwood.cost.time = 60 + gD.brushwoodFatigue;
            $("#fetchBrushwoodLoss").html(timify(prettify(actions.fetch_Brushwood.cost.time, 0)));
            $("#fetchBrushwoodGain").html(timify(prettify(300 - gD.brushwoodFatigue, 0)));
            var color = (60 + gD.brushwoodFatigue < 300 - gD.brushwoodFatigue ? "#080" : "#800");
            $("#fetchBrushwoodLoss").attr("style", "color:" + color);
            $("#fetchBrushwoodGain").attr("style", "color:" + color);
        }
    },
    exploreTheBeach: {
        unlock: {time: 300},
        cost: {time: 300},
        repeatable: true,
        show: {
            type: "standardAction",
            tooltip: "Explore the immediate surroundings of the fire, and collect what could be useful",
            inside: "Takes <b><span id='exploreTheBeachLoss'>" + timify(300) + "</span></b> to explore the beach and possibly find loot.<br />"
        },
        effect: function() {
            var branchesFound = intRandom(1, 5);
        },
        tick: function() {
        }
    },
    /* ============================================================ UPGRADES ============================================================ */
    pyramidFire: {
        unlock: {time: 100},
        cost: {time: 600},
        isUpgrade: true,
        show: {
            type: "standardUpgrade",
            tooltip : "Fanning the flames is twice as efficient"
        },
        effect: function() {
            gD.firePower *= 2;
        }
    },
    fireMastery: {
        unlock: {fanTheFlamesUses: 50},
        cost: {time: 500},
        isUpgrade: true,
        show: {
            type: "standardUpgrade",
            tooltip : "Your fire skills increase with time. Fan the flames gains 0.001 power with each use"
        },
    }
}

function sumPrices(base, factor, owned, number) {
    var sum = 0;
    for (var i = owned + 1; i <= owned + number; i++) {
        sum += Math.floor(base * Math.pow(factor, i));
    }
    return sum;
}

function timify(input, digits) {
    return Math.floor(1000000000*input)/1000000000 + " seconds"; //TODO : EDIT
}

/*function buyWatcher(number) {
    for (var i = 1; i <= number; i++) {
        var watcherCost = sumPrices(10, 1.1, watchers, 1);
        if(time >= watcherCost) {
            watchers++;
            time -= watcherCost;
            var nextCost = sumPrices(10, 1.1, watchers, 1);
                $("#watchers").html(watchers);
                $("#watcherCost").html(nextCost);
                $("#watcherProduction").html(watcherPower * watchers);
                tooltip(buyWatcher1, "Cost : " + nextCost); //TODO : EDIT
        }
    }
}*/

function tick() {
    gD.time -= gD.timeSpeed * gD.tickDuration/1000;
    //time += watchers * watcherPower * tickDuration/1000;
    $("#time").html(prettify(gD.time, 3));
    for (var i in actions) {
        if (!gD.actions[i].unlocked && compare(actions[i].unlock, gD)) { // If new action unlocked
            gD.actions[i].unlocked = true;
            var strButton = '<button id=' + i + ' type="button" class="btn btn-default' + (gD.tabs.opt.darkTheme ? "2" : "") + '" data-toggle="tooltip" data-placement="bottom" title="' + actions[i].show.tooltip + '" data-container="body">';
            switch (actions[i].show.type) { // Display it
            case "standardAction":
                $("#actions").append('\
                    <div id="' + i + 'Div" class="row" style="margin-left:10px">\
                        <div class="col-md-3 col-md-center">\
                            ' + strButton + i.textify() + '</button>\
                        </div>\
                        <div class="col-md-9' + (actions[i].show.nocenter ? '' : ' vcenter') + '">\
                            ' + actions[i].show.inside + '\
                        </div>\
                    </div>\
                    <hr id="' + i + 'HR"' + (gD.tabs.opt.darkTheme ? 'div="HR2"' : "") + ' />');
                break;
            case "standardUpgrade":
                $("#upgrades").append(
                        strButton + i.textify() + ' ' + cost(i) + '</button>');
                break;
            default:
                $(actions[i].isUpgrade ? "#upgrades" : "#actions").after(actions[i].show.text);
                break;
            }
            if (actions[i].show.type == "standardAction" || actions[i].show.type == "standardUpgrade") { // Fix to prevent constant focus after clicking
                $("#" + i).tooltip().mouseup(function() {
                    $(this).blur();
                })
                $("#" + i).on('click', function(_i){
                    return function() { // Clooooooosure :D
                        buyUpgrade(_i);
                    };
                }(i))
            }
        }
        if(gD.actions[i].unlocked) { // Each action unlocked : grey if and only if not affordable
            $("#" + i).css("background-color", (compare(actions[i].cost, gD) ? (gD.tabs.opt.darkTheme ? "#000" : "#fff") : (gD.tabs.opt.darkTheme ? "#333" : "#eee")));
        }
        if(typeof actions[i].tick !== 'undefined') { // && (!actions[i].tickIfBought || gD.actions[i].bought) && (!actions[i].tickIfUnlocked || gD.actions[i].unlocked)) {
            actions[i].tick();
        }
    }
    /* greyOut("buyWatcher1", time >= sumPrices(10, 1.1, watchers, 1));
    greyOut("buyWatcher2", time >= sumPrices(10, 1.1, watchers, 10));
    greyOut("buyWatcher3", time >= sumPrices(10, 1.1, watchers, 100)); */
}

function buyUpgrade(upgrade) {
    if (!gD.actions[upgrade].bought && compare(actions[upgrade].cost, gD, true)) { // First condition isn't mandatory
        if (typeof actions[upgrade].effect !== 'undefined') {
            actions[upgrade].effect();
        }
        if (!actions[upgrade].repeatable) {
            gD.actions[upgrade].bought = true;
            switch (actions[upgrade].show.type) {
                case "standardAction":
                    $("#" + upgrade).tooltip('hide');
                    $("#" + upgrade + "Div").remove();
                    $("#" + upgrade + "HR").remove();
                    break;
                case "standardUpgrade":
                    $("#" + upgrade).tooltip('hide');
                    $("#" + upgrade).remove();
                    break;
                default:
                    console.log("ERROR");
                    break;
            }
        }
    }
}

function cost(upgrade) {
    return '(' + actions[upgrade].cost.time + ')'; //TODO : Modifier
}

function compare(cost, data, doSub, subStep) { // Returns (cost <= data), data -= cost if doSub, subStep means toplevel (nested objects)
    var ret = true;
    if(!subStep) {
        for (var i in cost) {
            switch (typeof cost[i]) {
                case "number":
                    ret = cost[i] <= data[i];
                    break;
                case "boolean":
                    ret = cost[i] == data[i];
                    break;
                case "object":
                    ret = compare(cost[i], data[i], false); // doSub == false => compare only
                    break;
                case "undefined":
                default:
                    break;
            }
            if (!ret) return false;
        }
    }
    if (doSub) { // Can only possibly happen at toplevel
        for (var i in cost) {
            switch (typeof cost[i]) {
                case "number":
                    data[i] -= cost[i];
                    break;
                case "object":
                    ret = compare(cost[i], data[i], true, true); // Transmit doSub, skip first step
                case "boolean":
                case "undefined":
                default:
                    break;
            }
        }
    }
    return true;
}


function prettify(input, digits) {
	return input.toFixed((typeof digits === 'undefined' ? 9 : digits));
}

function show(id) { //TODO : Remove if unused
    $("#" + id).css("display", "block");
}

function hide(id) { //TODO : Remove if unused
    $("#" + id).css("display", "none");
}

function greyOut(id, back, theme) {
    $("#" + id).css("background-color", (back ? (theme ? "#000" : "#fff") : (theme ? "#222" : "#eee")));
}

function tooltip(id, title, show) { //TODO : Remove if unused
    show = (typeof show === 'undefined' ? true : show);
    $("#" + id).attr("title", title).tooltip('fixTitle');
    if (show) $("#" + id).tooltip('show');
}

function intRandom(min, max) {
    return 1 + Math.round(Math.random()*(max-min));
}

String.prototype.textify = function() { // camelCaseObject,AnotherAnd_Escaping_or_Not__ -> Camel case object, another and Escapingor Not_
    var res = "";
    var up = false;
    if (this == "") {
        return "";
    }
    var curWord = this[0].toUpperCase();
    for (var i = 1; i < this.length; i++) {
        if(this[i] == '_') {
            res += curWord;
            curWord = (up ? "_" : "");
            up = !up;
        }
        else if(this.charCodeAt(i) >= 65 && this.charCodeAt(i) <= 90) {
            res += curWord + " ";
            curWord = (up ? this[i].toUpperCase() : this[i].toLowerCase());
            up = false;
        }
        else {
            curWord += this[i];
            up = false;
        }
    }
    return res + curWord;
}

function changeTab(newTab) {
    $("#nav_" + currentTab).parent().removeClass("active");
    $("#nav_" + newTab).parent().addClass("active");
    gD.tabs[currentTab].text = $("#main").html();
    $("#main").html(gD.tabs[newTab].text);
    currentTab = newTab;
    switch (newTab) { // TODO : Remove switch if pointless
        case "play":
            break;
        case "opt":
            $("#darkTheme").change(darkTheme).prop("checked", gD.tabs.opt.darkTheme);
            break;
        default:
            break;
    }
}

function darkTheme() {
    gD.tabs.play.text = gD.tabs.play.text.replace(/btn-default2/g, "btn-P2").replace(/btn-default/g, "btn-default2").replace(/btn-P2/g, "btn-default"); // Play
    gD.tabs.play.text = gD.tabs.play.text.replace(/split-left2/g, "split-P2").replace(/split-left/g, "split-left2").replace(/split-P2/g, "split-left");
    gD.tabs.play.text = gD.tabs.play.text.replace(/hr class="HR2"/g, "HR-HR2").replace(/hr/g, 'hr class="HR2"').replace(/HR-HR2/g, "hr");
    $("#main").html($("#main").html().replace(/hr class="HR2"/g, "HR-HR2").replace(/hr/g, 'hr class="HR2"').replace(/HR-HR2/g, "hr")); // Opt
    $("#main").html($("#main").html().replace(/btn-default2/g, "btn-P2").replace(/btn-default/g, "btn-default2").replace(/btn-P2/g, "btn-default"));
    // Global
    $("#navbar").html($("#navbar").html().replace(/navbar-inverse/g, "navbar-P2").replace(/navbar-default/g, "navbar-inverse").replace(/navbar-P2/g, "navbar-default")); // Not on body or ajax async request fails
    $("body").css("background-color", (gD.tabs.opt.darkTheme ? "#FFF" : "#000"));
    $("body").css("color", (gD.tabs.opt.darkTheme ? "#000" : "#FFF"));
    //$("#main").html(gD.tabs.opt.text.replace(/btn-default2/g, "btn-P2").replace(/btn-default/g, "btn-default2").replace(/btn-P2/g, "btn-default"));
    // TODO on load game/reset ^ v
    //$("myHR").addClass("HR2");
    gD.tabs.opt.darkTheme = !gD.tabs.opt.darkTheme;
    $("#darkTheme").change(darkTheme).prop("checked", gD.tabs.opt.darkTheme);
}

window.setInterval(tick, gD.tickDuration);

$(function () {
    for (var i in actions) { // TODO : Fix on load game...
        gD.actions[i] = {unlocked: false, bought: false};
    }
    $("#version").append(version);
});
