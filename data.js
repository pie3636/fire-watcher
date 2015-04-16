var game = {
    version : "v0.4.4w",
    onLoad : false,
    onImport : false,
    onReset : false,
    logTimeout : {},
    logDuration : 10000,
    latestLog : 5,
    numLogs : 5,
    newSave : {}
};
var gD = {
    tickDuration: 25,
    time: 60,
    timeSpeed: 1,
    //watchers: 0,
    //watcherPower: 1,
    currentTab: "play",
    actions: {
        fanTheFlames: {
            uses: 0,
            power: 5
        },
        fetch_Brushwood: {
            fatigue: 0
        }
    },
    options: {
        logDuration: 1, //TODO : Make editable
        darkTheme: false,
        autoSave: {
            enabled: setInterval(save, 60000),
            interval: 60000 //TODO : Make editable
        }
    },
    stats: {
        playTime: 0,
        uses: {
            fanTheFlames: 0
        }
    }
};



/* unlock, cost : Object [~gD]                          Costs of unlocking and buying
 * show : Object [type, tooltip, inside][text]          Items to be displayed
 * effect : function                                    On buying
 * tick : function                                      On tick
 * repeatable : Boolean                                 Peristent
 * nocenter : Boolean                                   Multiline (action)
 * isUpgrade : Boolean                                  In case of unhandled show type
 */
 
var actions = {
    fanTheFlames: {
        repeatable: true,
        show: {
            type: "standardAction",
            tooltip: "Blow air on the fire to make it last a bit longer",
            inside: "Increases the fire duration by <b><span id='firePower'>" + gD.actions.fanTheFlames.power + " seconds</span></b>."
        },
        effect: function() {
            var gain = gD.actions.fanTheFlames.power;
            if (gD.actions.fireMastery.bought) {
                gain += 0.001 * gD.actions.fanTheFlames.uses;
            }
            gD.time += gain;
            gD.actions.fanTheFlames.uses ++;
        },
        tick: function() {
            var gain = gD.actions.fanTheFlames.power;
            if (gD.actions.fireMastery.bought) {
                gain += 0.001 * gD.actions.fanTheFlames.uses;
            }
            $("#firePower").html(timify(gain, 3));
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
            gD.actions.fetch_Brushwood.fatigue = Math.min(300, gD.actions.fetch_Brushwood.fatigue + 30);
            gD.time += 300 - gD.actions.fetch_Brushwood.fatigue;
        },
        tick: function() {
        var fatigue = gD.actions.fetch_Brushwood.fatigue;
            if (fatigue >= 0) {
                gD.actions.fetch_Brushwood.fatigue -= gD.tickDuration/1000;
            }
            actions.fetch_Brushwood.cost.time = 60 + fatigue;
            $("#fetchBrushwoodLoss").html(timify(actions.fetch_Brushwood.cost.time));
            $("#fetchBrushwoodGain").html(timify(300 - fatigue));
            var color = (fatigue < 120 ? "#080" : "#A00"); // Cost < Gain
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
            gD.actions.fanTheFlames.power *= 2;
        }
    },
    fireMastery: {
        unlock: {actions: {fanTheFlames: {uses: 50}}},
        cost: {time: 500},
        isUpgrade: true,
        show: {
            type: "standardUpgrade",
            tooltip : "Your fire skills increase with time. Fan the flames gains 0.001 power with each use"
        },
    }
};
